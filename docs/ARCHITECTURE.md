# 🏗️ Aethyr — System Architecture (ARCHITECTURE.md)

This document details the software architecture, smart contract interfaces, path-finding design, and data flows for the **Aethyr** payment routing platform.

---

## 🗺️ System Overview

Aethyr is a client-side dApp (PWA) that interacts directly with the Stellar Network and Soroban RPC nodes. Smart contracts are used to securely handle currency routing and escrow locks.

```
       +---------------------------------------------+
       |                  User View                  |
       |  [ PWA Frontend / Mobile-First viewport ]   |
       +---------------------------------------------+
                              |
          +-------------------+-------------------+
          |                                       |
          v                                       v
+-------------------+                   +-------------------+
|  AI Smart Assist  |                   |   Structured UI   |
| (Gemini Free API) |                   |  (PWA Input Form) |
+-------------------+                   +-------------------+
          |                                       |
          +-------------------+-------------------+
                              |
                              v (Intent parsed / Form filled)
       +---------------------------------------------+
       |             Route Calculator                |
       |  - Fetches orderbooks via Stellar SDK       |
       |  - Runs DFS/Dijkstra pathfinding locally    |
       |  - Returns: optimal path, fees, output amt  |
       +---------------------------------------------+
                              |
                              v (Select Path & Send)
       +---------------------------------------------+
       |           StellarWalletsKit                 |
       |  - Freighter, Albedo, xBull Module          |
       |  - Prompts signature on XDR                 |
       +---------------------------------------------+
                              |
                              v (Signed XDR)
       +---------------------------------------------+
       |             Stellar Network                 |
       |  - Soroban RPC submits tx                   |
       |  - Executes Aethyr Router smart contract    |
       |  - Performs Path Payment on-chain           |
       +---------------------------------------------+
```

---

## 🔀 Path-Finding & Routing Engine

Stellar features a built-in decentralized exchange (DEX) with orderbooks. Aethyr's key differentiator is finding the optimal path through these orderbooks to execute cross-border payments.

### 1. Algorithm Design (Client-Side)
- **Path Resolution**: The frontend queries the Horizon API `/paths` endpoint or fetches orderbooks for liquid asset pairs (e.g., PHP/USDC, USDC/XLM, XLM/NGN).
- **Graph Representation**: Assets are represented as nodes; orderbook bid/ask spreads act as weighted edges (fees + slippage).
- **Execution**: The dApp runs a pathfinding algorithm (Dijkstra or DFS with depth limit 3) to locate the route yielding the highest amount of `token_out` for a given `token_in`.

### 2. Traditional vs. Stellar Cost Comparison
Aethyr compares the computed path against traditional rails:
- **Wise / Western Union**: Fetches typical static fee percentages (e.g., 1.5% - 5%) via standard estimation algorithms.
- **Aethyr (Stellar)**: On-chain transaction fee (fixed at ~0.00001 XLM) + DEX slippage.
- **Result**: Visual comparison chart displayed in the UI showing savings.

---

## 📝 Smart Contract Layout

Aethyr uses two core Soroban smart contracts written in Rust:

### 1. `aethyr-router` (Payment Router)
Handles multi-token routing operations, converting asset A to asset B via intermediate pools or orderbooks.

```rust
pub trait AethyrRouterTrait {
    /// Executes a routed payment from sender to recipient
    /// - `source`: Sender account
    /// - `destination`: Recipient account
    /// - `path`: Vector of token contract addresses representing the route
    /// - `amount_in`: Exact amount of token_in to send
    /// - `min_amount_out`: Slippage tolerance threshold
    fn route_payment(
        env: Env,
        source: Address,
        destination: Address,
        path: Vec<Address>,
        amount_in: i128,
        min_amount_out: i128,
    ) -> i128;
}
```

### 2. `aethyr-escrow` (Milestone Escrow)
Locks funds and releases them to the recipient only when milestone criteria are verified by a designated third-party oracle or both parties confirm.

```rust
pub trait AethyrEscrowTrait {
    /// Creates an escrow lock for a routed payment
    fn create_escrow(
        env: Env,
        sender: Address,
        receiver: Address,
        token: Address,
        amount: i128,
        milestones_count: u32,
    ) -> BytesN<32>; // Returns Escrow ID

    /// Releases funds for a specific milestone
    fn release_milestone(
        env: Env,
        escrow_id: BytesN<32>,
        milestone_index: u32,
        auth_party: Address,
    );

    /// Refunds remaining locked funds upon cancellation or failure
    fn refund_escrow(env: Env, escrow_id: BytesN<32>);
}
```

---

## 📱 Progressive Web App (PWA) Design

To fulfill the mobile-first UX requirement, Aethyr is structured as an installable PWA:

1. **Service Worker**: Implemented using `serwist` or `next-pwa` for background caching of static shells, assets, and offline fallback screens.
2. **Web App Manifest (`manifest.json`)**: Configures display mode to `standalone`, sets theme colors (`#000000` dark mode theme), and defines homescreen icons.
3. **Safe Viewport Layout**:
   - Built with Tailwind utility classes.
   - Notch and status bar padding handled using:
     ```css
     padding-top: env(safe-area-inset-top);
     padding-bottom: env(safe-area-inset-bottom);
     ```
   - Main dashboard enclosed within a **mobile mockup frame** on large screens (desktop view), behaving as a native app interface on true mobile viewports.

---

## 🔄 Data Flows & State Changes

### Wallet Connection Flow
```
[User Connects] 
    --> [Freighter / WalletsKit Modal Opens]
    --> [User Selects Wallet]
    --> [Public Key Requested]
    --> [Key returned to React Context]
    --> [Horizon RPC queries account balance]
    --> [UI renders wallet address & balances]
```

### Transaction Routing & Execution Flow
```
[User inputs amount & recipient]
    --> [Route calculator runs locally]
    --> [Best path displayed to user for verification]
    --> [User clicks Send]
    --> [Frontend builds transaction XDR]
    --> [StellarWalletsKit prompts signing]
    --> [Signed XDR sent to Soroban RPC]
    --> [On-chain Router contract converts & transfers tokens]
    --> [Event listener captures success status]
    --> [UI renders confirmation & transaction Explorer link]
```
