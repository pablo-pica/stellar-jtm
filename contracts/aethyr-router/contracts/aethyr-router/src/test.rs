#![cfg(test)]

use super::*;
use soroban_sdk::{vec, Env, Address, Symbol, token, testutils::Address as _};

#[test]
fn test_route_payment_fallback() {
    let env = Env::default();
    env.mock_all_auths();

    let router_address = env.register(AethyrRouter, ());
    let client = AethyrRouterClient::new(&env, &router_address);

    let admin = Address::generate(&env);
    let token_in_info = env.register_stellar_asset_contract_v2(admin.clone());
    let token_in_addr = token_in_info.address();

    let token_out_info = env.register_stellar_asset_contract_v2(admin.clone());
    let token_out_addr = token_out_info.address();

    let source = Address::generate(&env);
    let destination = Address::generate(&env);

    // Mint input tokens to source
    let token_in_admin = token::StellarAssetClient::new(&env, &token_in_addr);
    token_in_admin.mint(&source, &1000);

    let token_in_client = token::Client::new(&env, &token_in_addr);
    assert_eq!(token_in_client.balance(&source), 1000);

    // Call route_payment with path: [token_in, token_out]
    let path = vec![&env, token_in_addr.clone(), token_out_addr.clone()];
    let amount_in = 600;
    let min_amount_out = 500;

    let amount_out = client.route_payment(&source, &destination, &path, &amount_in, &min_amount_out);

    // Since the router contract doesn't have token_out balance, it should forward token_in as fallback.
    assert_eq!(amount_out, 600);
    assert_eq!(token_in_client.balance(&source), 400);
    assert_eq!(token_in_client.balance(&destination), 600);
}

#[test]
#[should_panic(expected = "Slippage tolerance exceeded")]
fn test_route_payment_slippage_exceeded() {
    let env = Env::default();
    env.mock_all_auths();

    let router_address = env.register(AethyrRouter, ());
    let client = AethyrRouterClient::new(&env, &router_address);

    let admin = Address::generate(&env);
    let token_in_info = env.register_stellar_asset_contract_v2(admin.clone());
    let token_in_addr = token_in_info.address();

    let token_out_info = env.register_stellar_asset_contract_v2(admin.clone());
    let token_out_addr = token_out_info.address();

    let source = Address::generate(&env);
    let destination = Address::generate(&env);

    let token_in_admin = token::StellarAssetClient::new(&env, &token_in_addr);
    token_in_admin.mint(&source, &1000);

    let path = vec![&env, token_in_addr.clone(), token_out_addr.clone()];
    let amount_in = 600;
    // Set slippage high so that fallback (600) is less than min_amount_out (700)
    let min_amount_out = 700;

    client.route_payment(&source, &destination, &path, &amount_in, &min_amount_out);
}

#[test]
fn test_route_payment_with_swap() {
    let env = Env::default();
    env.mock_all_auths();

    let router_address = env.register(AethyrRouter, ());
    let client = AethyrRouterClient::new(&env, &router_address);

    let admin = Address::generate(&env);
    let token_in_info = env.register_stellar_asset_contract_v2(admin.clone());
    let token_in_addr = token_in_info.address();

    let token_out_info = env.register_stellar_asset_contract_v2(admin.clone());
    let token_out_addr = token_out_info.address();

    let source = Address::generate(&env);
    let destination = Address::generate(&env);

    // Mint input tokens to source
    let token_in_admin = token::StellarAssetClient::new(&env, &token_in_addr);
    token_in_admin.mint(&source, &1000);

    // Mint output tokens directly to the router contract to fund the swap simulation
    let token_out_admin = token::StellarAssetClient::new(&env, &token_out_addr);
    let simulated_out = (600 * 105) / 100; // 630
    token_out_admin.mint(&router_address, &simulated_out);

    let token_in_client = token::Client::new(&env, &token_in_addr);
    let token_out_client = token::Client::new(&env, &token_out_addr);

    // Call route_payment
    let path = vec![&env, token_in_addr.clone(), token_out_addr.clone()];
    let amount_in = 600;
    let min_amount_out = 630;

    let amount_out = client.route_payment(&source, &destination, &path, &amount_in, &min_amount_out);

    // It should perform the swap simulation successfully
    assert_eq!(amount_out, 630);
    assert_eq!(token_in_client.balance(&source), 400);
    assert_eq!(token_in_client.balance(&router_address), 600); // contract kept the input tokens
    assert_eq!(token_out_client.balance(&destination), 630);  // destination received output tokens
}

#[test]
fn test_route_to_escrow() {
    let env = Env::default();
    env.mock_all_auths();

    // 1. Register router & escrow
    let router_address = env.register(AethyrRouter, ());
    let router_client = AethyrRouterClient::new(&env, &router_address);

    let escrow_address = env.register(aethyr_escrow::AethyrEscrow, ());
    let escrow_client = aethyr_escrow::AethyrEscrowClient::new(&env, &escrow_address);
    let validator = Address::generate(&env);
    escrow_client.initialize(&validator);

    // 2. Setup tokens & accounts
    let admin = Address::generate(&env);
    let token_in_info = env.register_stellar_asset_contract_v2(admin.clone());
    let token_in_addr = token_in_info.address();

    let token_out_info = env.register_stellar_asset_contract_v2(admin.clone());
    let token_out_addr = token_out_info.address();

    let source = Address::generate(&env);
    let receiver = Address::generate(&env);

    // 3. Mint initial balances
    let token_in_admin = token::StellarAssetClient::new(&env, &token_in_addr);
    token_in_admin.mint(&source, &1000);

    let token_out_admin = token::StellarAssetClient::new(&env, &token_out_addr);
    token_out_admin.mint(&router_address, &630);

    let token_in_client = token::Client::new(&env, &token_in_addr);
    let token_out_client = token::Client::new(&env, &token_out_addr);

    assert_eq!(token_in_client.balance(&source), 1000);
    assert_eq!(token_out_client.balance(&router_address), 630);

    // 4. Define milestones
    let m1 = aethyr_escrow::Milestone {
        description: Symbol::new(&env, "design"),
        payout_weight: 5000,
        is_completed: false,
        submitted_at: 0,
        is_disputed: false,
    };
    let m2 = aethyr_escrow::Milestone {
        description: Symbol::new(&env, "impl"),
        payout_weight: 5000,
        is_completed: false,
        submitted_at: 0,
        is_disputed: false,
    };
    let milestones = vec![&env, m1, m2];

    // 5. Call route_to_escrow
    let path = vec![&env, token_in_addr.clone(), token_out_addr.clone()];
    let amount_in = 600;
    let min_amount_out = 630;

    let escrow_id = router_client.route_to_escrow(
        &source,
        &escrow_address,
        &receiver,
        &path,
        &amount_in,
        &min_amount_out,
        &milestones,
    );

    // 6. Verify escrow creation details
    let escrow = escrow_client.get_escrow(&escrow_id).unwrap();
    assert_eq!(escrow.amount, 630);
    assert_eq!(escrow.sender, source);
    assert_eq!(escrow.receiver, receiver);
    assert_eq!(escrow.token, token_out_addr);
    assert_eq!(escrow.milestones.len(), 2);
    assert_eq!(escrow.released_amount, 0);

    // 7. Verify balances
    assert_eq!(token_in_client.balance(&source), 400);
    assert_eq!(token_in_client.balance(&router_address), 600); // Router kept the input token
    assert_eq!(token_out_client.balance(&router_address), 0);  // Router transferred simulated output token to escrow
    assert_eq!(token_out_client.balance(&escrow_address), 630); // Escrow holds the locked output tokens
}
