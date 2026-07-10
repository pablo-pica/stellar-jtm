#![no_std]
use soroban_sdk::{contract, contractimpl, Address, BytesN, Env, Symbol, Vec, token, IntoVal};
use soroban_sdk::auth::{ContractContext, InvokerContractAuthEntry, SubContractInvocation};
use aethyr_escrow::{Milestone, AethyrEscrowClient};

pub trait AethyrRouterTrait {
    fn route_payment(
        env: Env,
        source: Address,
        destination: Address,
        path: Vec<Address>,
        amount_in: i128,
        min_amount_out: i128,
    ) -> i128;

    fn route_to_escrow(
        env: Env,
        source: Address,
        escrow_contract: Address,
        receiver: Address,
        path: Vec<Address>,
        amount_in: i128,
        min_amount_out: i128,
        milestones: Vec<Milestone>,
    ) -> BytesN<32>;
}

#[contract]
pub struct AethyrRouter;

#[contractimpl]
impl AethyrRouterTrait for AethyrRouter {
    /// Executes a routed payment from sender to recipient
    /// - `source`: Sender account (requires signature verification via require_auth)
    /// - `destination`: Recipient account or target escrow address
    /// - `path`: Vector of token contract addresses representing the route (e.g., [PHP, USDC, XLM])
    /// - `amount_in`: Exact amount of token_in to swap
    /// - `min_amount_out`: Slippage tolerance threshold
    fn route_payment(
        env: Env,
        source: Address,
        destination: Address,
        path: Vec<Address>,
        amount_in: i128,
        min_amount_out: i128,
    ) -> i128 {
        // 1. Verify the caller (source) has authorized this transaction.
        source.require_auth();

        // 2. Validate parameters.
        if path.len() < 2 {
            panic!("Path must have at least 2 assets");
        }
        if amount_in <= 0 {
            panic!("Amount in must be positive");
        }

        let token_in = path.get(0).unwrap();
        let token_out = path.get(path.len() - 1).unwrap();

        // 3. Perform transfer of token_in from source to this contract.
        let token_in_client = token::Client::new(&env, &token_in);
        let this_contract = env.current_contract_address();
        token_in_client.transfer(&source, &this_contract, &amount_in);

        // 4. Swap/conversion simulation:
        // On local tests or testnet where standard pools may not exist, we simulate a swap.
        // If the contract holds some token_out balance, we perform the mock swap and return simulated out.
        // Otherwise we fallback to direct token_in forwarding.
        let token_out_client = token::Client::new(&env, &token_out);
        let mut amount_out = amount_in;
        let mut executed_swap = false;

        if token_in != token_out {
            let contract_out_balance = token_out_client.balance(&this_contract);
            // Simulate a mock rate of 1 token_in = 1.05 token_out for testing purposes.
            let simulated_out = (amount_in * 105) / 100;
            
            if contract_out_balance >= simulated_out {
                amount_out = simulated_out;
                token_out_client.transfer(&this_contract, &destination, &amount_out);
                executed_swap = true;
            }
        }

        if !executed_swap {
            // Forward token_in directly if no swap occurred (fallback).
            token_in_client.transfer(&this_contract, &destination, &amount_in);
            amount_out = amount_in;
        }

        // 5. Verify slippage constraint.
        if amount_out < min_amount_out {
            panic!("Slippage tolerance exceeded");
        }

        // 6. Emit RouteEvent.
        env.events().publish(
            (
                Symbol::new(&env, "route_payment"),
                source,
                destination,
            ),
            (
                token_in,
                token_out,
                amount_in,
                amount_out,
            ),
        );

        amount_out
    }

    /// Executes a routed payment from source, swaps the token, and locks it into an escrow contract.
    /// - `source`: Sender account (requires signature verification via require_auth)
    /// - `escrow_contract`: Target escrow contract address
    /// - `receiver`: Recipient account receiving payouts upon milestone completion
    /// - `path`: Vector of token contract addresses representing the route
    /// - `amount_in`: Exact amount of token_in to swap
    /// - `min_amount_out`: Slippage tolerance threshold
    /// - `milestones`: Milestones configuration for the escrow
    fn route_to_escrow(
        env: Env,
        source: Address,
        escrow_contract: Address,
        receiver: Address,
        path: Vec<Address>,
        amount_in: i128,
        min_amount_out: i128,
        milestones: Vec<Milestone>,
    ) -> BytesN<32> {
        // 1. Verify the caller (source) has authorized this transaction.
        source.require_auth();

        // 2. Validate parameters.
        if path.len() < 2 {
            panic!("Path must have at least 2 assets");
        }
        if amount_in <= 0 {
            panic!("Amount in must be positive");
        }

        let token_in = path.get(0).unwrap();
        let token_out = path.get(path.len() - 1).unwrap();
        let this_contract = env.current_contract_address();

        // 3. Perform transfer of token_in from source to this contract.
        let token_in_client = token::Client::new(&env, &token_in);
        token_in_client.transfer(&source, &this_contract, &amount_in);

        // 4. Swap/conversion simulation:
        // On local tests or testnet where standard pools may not exist, we simulate a swap.
        // The swapped token_out ends up in the router contract.
        let token_out_client = token::Client::new(&env, &token_out);
        let mut amount_out = amount_in;
        let mut executed_swap = false;

        if token_in != token_out {
            let contract_out_balance = token_out_client.balance(&this_contract);
            // Simulate a mock rate of 1 token_in = 1.05 token_out for testing purposes.
            let simulated_out = (amount_in * 105) / 100;
            
            if contract_out_balance >= simulated_out {
                amount_out = simulated_out;
                executed_swap = true;
            }
        }

        if !executed_swap {
            amount_out = amount_in;
        }

        // 5. Verify slippage constraint.
        if amount_out < min_amount_out {
            panic!("Slippage tolerance exceeded");
        }

        // 6. Let the router contract authorize the token transfer. Specifically, the router contract holds the swapped token_out.
        // We authorize the escrow contract to call the token contract's transfer function on our behalf.
        env.authorize_as_current_contract(soroban_sdk::vec![
            &env,
            InvokerContractAuthEntry::Contract(SubContractInvocation {
                context: ContractContext {
                    contract: token_out.clone(),
                    fn_name: Symbol::new(&env, "transfer"),
                    args: soroban_sdk::vec![
                        &env,
                        this_contract.to_val(),
                        escrow_contract.to_val(),
                        amount_out.into_val(&env),
                    ],
                },
                sub_invocations: soroban_sdk::vec![&env],
            }),
        ]);

        // 7. Call create_escrow on the escrow contract, passing the original client source as the sender,
        // and the router contract (this_contract) as the funding source.
        let escrow_client = AethyrEscrowClient::new(&env, &escrow_contract);
        let escrow_id = escrow_client.create_escrow(
            &source,
            &this_contract,
            &receiver,
            &token_out,
            &amount_out,
            &milestones,
        );

        // 8. Emit RouteToEscrow event.
        env.events().publish(
            (
                Symbol::new(&env, "route_to_escrow"),
                source,
                escrow_contract,
                receiver,
            ),
            (
                token_in,
                token_out,
                amount_in,
                amount_out,
                escrow_id.clone(),
            ),
        );

        // 9. Return the generated BytesN<32> Escrow ID.
        escrow_id
    }
}

mod test;
