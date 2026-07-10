#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Symbol, Vec, token};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub description: Symbol,   // Short description of the work
    pub payout_weight: u32,   // Payout percentage represented in basis points (e.g., 5000 = 50.00%)
    pub is_completed: bool,   // Completion status
    pub submitted_at: u64,    // Ledger timestamp
    pub is_disputed: bool,    // Dispute status
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub sender: Address,
    pub receiver: Address,
    pub token: Address,
    pub amount: i128,
    pub milestones: Vec<Milestone>,
    pub released_amount: i128,
    pub creation_time: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Escrow(BytesN<32>),
    Validator,
}

pub const LOCK_PERIOD_SECONDS: u64 = 30 * 24 * 60 * 60; // 30 days lock period
pub const AUTO_RELEASE_PERIOD_SECONDS: u64 = 7 * 24 * 60 * 60; // 7 days auto-release period

pub trait AethyrEscrowTrait {
    /// Creates an escrow lock for a routed payment
    /// - `sender`: The account locking the funds (requires require_auth)
    /// - `receiver`: The account receiving payouts upon milestone completion
    /// - `token`: Soroban token address of locked funds
    /// - `amount`: Total amount locked
    /// - `milestones`: Vector of milestones with descriptions and payout weights
    fn create_escrow(
        env: Env,
        sender: Address,
        funding_src: Address,
        receiver: Address,
        token: Address,
        amount: i128,
        milestones: Vec<Milestone>,
    ) -> BytesN<32>; // Returns Escrow ID

    /// Releases funds for a specific milestone
    /// - `escrow_id`: Unique identifier of the escrow
    /// - `milestone_index`: The index of the milestone being completed
    /// - `auth_party`: The designated validator/oracle address authorizing release (requires require_auth)
    fn release_milestone(
        env: Env,
        escrow_id: BytesN<32>,
        milestone_index: u32,
        auth_party: Address,
    );

    /// Refunds remaining locked funds upon cancellation or failure
    /// - `escrow_id`: Unique identifier of the escrow
    /// - `sender`: The sender reclaiming funds (requires require_auth; only allowed after lock expiration)
    fn refund_escrow(
        env: Env, 
        escrow_id: BytesN<32>, 
        sender: Address
    );

    /// Submits a milestone by a freelancer (escrow receiver)
    fn submit_milestone(
        env: Env,
        escrow_id: BytesN<32>,
        milestone_index: u32,
        freelancer: Address,
    );

    /// Disputes a milestone by a client (escrow sender)
    fn dispute_milestone(
        env: Env,
        escrow_id: BytesN<32>,
        milestone_index: u32,
        client: Address,
    );

    /// Auto-releases a milestone after a 7-day period if not disputed
    fn auto_release_milestone(
        env: Env,
        escrow_id: BytesN<32>,
        milestone_index: u32,
    );
}

#[contract]
pub struct AethyrEscrow;

#[contractimpl]
impl AethyrEscrow {
    /// Initializes the contract with a designated global validator/oracle address
    pub fn initialize(env: Env, validator: Address) {
        if env.storage().instance().has(&DataKey::Validator) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Validator, &validator);
    }

    /// Helper to get the designated validator address if set
    pub fn get_validator(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Validator)
    }

    /// Helper to get escrow details by ID
    pub fn get_escrow(env: Env, escrow_id: BytesN<32>) -> Option<Escrow> {
        env.storage().persistent().get(&DataKey::Escrow(escrow_id))
    }
}

#[contractimpl]
impl AethyrEscrowTrait for AethyrEscrow {
    fn create_escrow(
        env: Env,
        sender: Address,
        funding_src: Address,
        receiver: Address,
        token: Address,
        amount: i128,
        milestones: Vec<Milestone>,
    ) -> BytesN<32> {
        // require_auth on sender
        sender.require_auth();

        // require_auth on funding_src if it is different from sender
        if funding_src != sender {
            funding_src.require_auth();
        }

        if amount <= 0 {
            panic!("Escrow amount must be positive");
        }

        if milestones.is_empty() {
            panic!("Escrow must have at least one milestone");
        }

        // Validate milestone weights sum up to exactly 10000 basis points (100.00%)
        let mut total_weight: u32 = 0;
        let mut sanitized_milestones = Vec::new(&env);
        for milestone in milestones.iter() {
            total_weight += milestone.payout_weight;
            sanitized_milestones.push_back(Milestone {
                description: milestone.description,
                payout_weight: milestone.payout_weight,
                is_completed: false, // Ensure initially false
                submitted_at: 0,
                is_disputed: false,
            });
        }
        if total_weight != 10000 {
            panic!("Total milestone weight must be exactly 10000 basis points");
        }

        // Transfer tokens from funding_src to this contract
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&funding_src, &env.current_contract_address(), &amount);

        use soroban_sdk::xdr::ToXdr;
        // Generate deterministic unique escrow ID by hashing the inputs
        let salt_data = (sender.clone(), funding_src.clone(), receiver.clone(), token.clone(), amount, milestones.clone());
        let escrow_id: BytesN<32> = env.crypto().sha256(&salt_data.to_xdr(&env)).into();

        let escrow = Escrow {
            sender: sender.clone(),
            receiver: receiver.clone(),
            token: token.clone(),
            amount,
            milestones: sanitized_milestones,
            released_amount: 0,
            creation_time: env.ledger().timestamp(),
        };

        // Store configuration in persistent storage
        env.storage().persistent().set(&DataKey::Escrow(escrow_id.clone()), &escrow);

        // Emit custom event
        env.events().publish(
            (Symbol::new(&env, "create_escrow"), escrow_id.clone(), sender),
            (receiver, token, amount),
        );

        escrow_id
    }

    fn release_milestone(
        env: Env,
        escrow_id: BytesN<32>,
        milestone_index: u32,
        auth_party: Address,
    ) {
        // require_auth on auth_party
        auth_party.require_auth();

        // Get escrow configuration
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id.clone()))
            .unwrap_or_else(|| panic!("Escrow not found"));

        if milestone_index >= escrow.milestones.len() {
            panic!("Invalid milestone index");
        }

        let mut milestones = escrow.milestones;
        let mut milestone = milestones.get(milestone_index).unwrap();

        if milestone.is_completed {
            panic!("Milestone already completed");
        }

        // Verify authorization: auth_party must be either the sender (payer)
        // or the designated global validator.
        let is_sender = auth_party == escrow.sender;
        let is_validator = if env.storage().instance().has(&DataKey::Validator) {
            let val: Address = env.storage().instance().get(&DataKey::Validator).unwrap();
            auth_party == val
        } else {
            false
        };

        if !is_sender && !is_validator {
            panic!("Unauthorized auth_party for milestone release");
        }

        // Mark milestone as completed
        milestone.is_completed = true;
        milestone.submitted_at = 0;
        milestone.is_disputed = false;
        milestones.set(milestone_index, milestone.clone());
        escrow.milestones = milestones;

        // Check if all milestones are now completed
        let mut all_completed = true;
        for m in escrow.milestones.iter() {
            if !m.is_completed {
                all_completed = false;
                break;
            }
        }

        // Calculate payout amount: if last milestone, release all remaining funds to avoid dust truncation
        let payout_amount = if all_completed {
            escrow.amount - escrow.released_amount
        } else {
            (escrow.amount * milestone.payout_weight as i128) / 10000
        };
        escrow.released_amount += payout_amount;

        // Update persistent storage
        env.storage().persistent().set(&DataKey::Escrow(escrow_id.clone()), &escrow);

        // Transfer funds if payout_amount is positive
        if payout_amount > 0 {
            let token_client = token::Client::new(&env, &escrow.token);
            token_client.transfer(&env.current_contract_address(), &escrow.receiver, &payout_amount);
        }

        // Emit custom event
        env.events().publish(
            (Symbol::new(&env, "release_milestone"), escrow_id, milestone_index),
            (auth_party, payout_amount),
        );
    }

    fn refund_escrow(
        env: Env,
        escrow_id: BytesN<32>,
        sender: Address,
    ) {
        // require_auth on sender
        sender.require_auth();

        // Get escrow configuration
        let escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id.clone()))
            .unwrap_or_else(|| panic!("Escrow not found"));

        // Verify caller matches sender in escrow config
        if sender != escrow.sender {
            panic!("Caller does not match escrow sender");
        }

        // Verify lock expiration
        if env.ledger().timestamp() < escrow.creation_time + LOCK_PERIOD_SECONDS {
            panic!("Escrow lock has not expired yet");
        }

        let refund_amount = escrow.amount - escrow.released_amount;
        if refund_amount <= 0 {
            panic!("No remaining funds to refund");
        }

        // Remove escrow from persistent storage
        env.storage().persistent().remove(&DataKey::Escrow(escrow_id.clone()));

        // Transfer remaining funds to sender
        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(&env.current_contract_address(), &escrow.sender, &refund_amount);

        // Emit custom event
        env.events().publish(
            (Symbol::new(&env, "refund_escrow"), escrow_id, sender),
            refund_amount,
        );
    }

    fn submit_milestone(
        env: Env,
        escrow_id: BytesN<32>,
        milestone_index: u32,
        freelancer: Address,
    ) {
        freelancer.require_auth();

        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id.clone()))
            .unwrap_or_else(|| panic!("Escrow not found"));

        if freelancer != escrow.receiver {
            panic!("Freelancer is not the escrow receiver");
        }

        if milestone_index >= escrow.milestones.len() {
            panic!("Invalid milestone index");
        }

        let mut milestones = escrow.milestones;
        let mut milestone = milestones.get(milestone_index).unwrap();

        if milestone.is_completed {
            panic!("Milestone already completed");
        }

        milestone.submitted_at = env.ledger().timestamp();
        milestones.set(milestone_index, milestone.clone());
        escrow.milestones = milestones;

        env.storage().persistent().set(&DataKey::Escrow(escrow_id.clone()), &escrow);

        env.events().publish(
            (Symbol::new(&env, "submit_milestone"), escrow_id, milestone_index),
            freelancer,
        );
    }

    fn dispute_milestone(
        env: Env,
        escrow_id: BytesN<32>,
        milestone_index: u32,
        client: Address,
    ) {
        client.require_auth();

        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id.clone()))
            .unwrap_or_else(|| panic!("Escrow not found"));

        if client != escrow.sender {
            panic!("Client is not the escrow sender");
        }

        if milestone_index >= escrow.milestones.len() {
            panic!("Invalid milestone index");
        }

        let mut milestones = escrow.milestones;
        let mut milestone = milestones.get(milestone_index).unwrap();

        if milestone.is_completed {
            panic!("Milestone already completed");
        }

        milestone.is_disputed = true;
        milestones.set(milestone_index, milestone.clone());
        escrow.milestones = milestones;

        env.storage().persistent().set(&DataKey::Escrow(escrow_id.clone()), &escrow);

        env.events().publish(
            (Symbol::new(&env, "dispute_milestone"), escrow_id, milestone_index),
            client,
        );
    }

    fn auto_release_milestone(
        env: Env,
        escrow_id: BytesN<32>,
        milestone_index: u32,
    ) {
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id.clone()))
            .unwrap_or_else(|| panic!("Escrow not found"));

        if milestone_index >= escrow.milestones.len() {
            panic!("Invalid milestone index");
        }

        let mut milestones = escrow.milestones;
        let mut milestone = milestones.get(milestone_index).unwrap();

        if milestone.is_completed {
            panic!("Milestone already completed");
        }

        if milestone.submitted_at == 0 {
            panic!("Milestone has not been submitted");
        }

        if milestone.is_disputed {
            panic!("Milestone is disputed");
        }

        if env.ledger().timestamp() < milestone.submitted_at + AUTO_RELEASE_PERIOD_SECONDS {
            panic!("Auto-release period has not elapsed");
        }

        // Mark milestone as completed
        milestone.is_completed = true;
        milestone.submitted_at = 0;
        milestone.is_disputed = false;
        milestones.set(milestone_index, milestone.clone());
        escrow.milestones = milestones;

        // Check if all milestones are now completed
        let mut all_completed = true;
        for m in escrow.milestones.iter() {
            if !m.is_completed {
                all_completed = false;
                break;
            }
        }

        // Calculate payout amount: if last milestone, release all remaining funds to avoid dust truncation
        let payout_amount = if all_completed {
            escrow.amount - escrow.released_amount
        } else {
            (escrow.amount * milestone.payout_weight as i128) / 10000
        };
        escrow.released_amount += payout_amount;

        // Update persistent storage
        env.storage().persistent().set(&DataKey::Escrow(escrow_id.clone()), &escrow);

        // Transfer funds if payout_amount is positive
        if payout_amount > 0 {
            let token_client = token::Client::new(&env, &escrow.token);
            token_client.transfer(&env.current_contract_address(), &escrow.receiver, &payout_amount);
        }

        // Emit custom event
        env.events().publish(
            (Symbol::new(&env, "auto_release_milestone"), escrow_id, milestone_index),
            payout_amount,
        );
    }
}

mod test;
