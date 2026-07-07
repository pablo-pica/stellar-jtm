# 🏆 Aethyr — JTM Belt Requirements Reference (BELT-REQUIREMENTS.md)

This file contains the verbatim requirements checklists for the **Stellar Journey to Mastery** challenges. The **Belt Checker** subagent reads this file to audit the project status before any submission.

---

## ⚪ White Belt Requirements (Level 1)

### Core Tasks
- [ ] Connect a wallet using the Freighter browser extension.
- [ ] Display the connected wallet’s XLM balance.
- [ ] Implement a wallet disconnect functionality.
- [ ] Send a transaction on the Stellar Testnet.
- [ ] Display transaction feedback to the user (success/failure status).
- [ ] Show the transaction hash or confirmation message upon completion.

### Codebase Requirements
- [ ] Public GitHub repository.
- [ ] A clean, comprehensive `README.md` at the root.

### Submission Assets (Required in README.md)
- [ ] Brief project description.
- [ ] Detailed setup instructions showing how to run the project locally.
- [ ] **Screenshot 1**: Wallet connected state showing public key/address.
- [ ] **Screenshot 2**: Connected wallet's XLM balance displayed in the UI.
- [ ] **Screenshot 3**: A successful transaction being executed on Stellar Testnet.
- [ ] **Screenshot 4**: Clear transaction result page/modal showing transaction hash.

---

## 🟡 Yellow Belt Requirements (Level 2)

### Core Tasks
- [ ] Implement error handling for at least **3 different transaction error types** (e.g., wallet not found, transaction rejected by user, insufficient balance, network timeout).
- [ ] Develop and deploy a simple Soroban smart contract to the Stellar Testnet.
- [ ] Call at least one function from the deployed contract from the frontend.
- [ ] Integrate a multi-wallet module using **StellarWalletsKit** or custom connectors (allowing user to select between Freighter, Albedo, xBull, etc.).
- [ ] Display contract transaction status on the frontend (pending, success, failure).

### Codebase Requirements
- [ ] Public GitHub repository.
- [ ] Clean and structured commit history with **at least 2+ meaningful commits**.

### Submission Assets (Required in README.md)
- [ ] Deployed smart contract address (verifiable on Stellar Explorer).
- [ ] Transaction hash of a successful contract invocation from the frontend.
- [ ] **Screenshot 1**: Multi-wallet modal showing at least two different wallet connection options.
- [ ] **Screenshot 2**: Transaction feedback showing contract call status (pending/success/fail).

---

## 🟠 Orange Belt Requirements (Level 3)

### Core Tasks
- [ ] Implement advanced smart contract development patterns:
  - [ ] **Inter-contract communication** (e.g., Aethyr Router calls Aethyr Escrow contract).
  - [ ] **Event streaming** (emitting events from smart contracts and parsing/listening to them on the frontend).
- [ ] Setup a functional **CI/CD pipeline** (GitHub Actions, GitLab CI, etc.) that runs lints, tests, and validates builds on pushes/PRs.
- [ ] Develop a fully mobile-responsive frontend (PWA format with notched viewports safe design).
- [ ] Complete error handling and state indicators (loading icons, skeleton UI, toast notifications).
- [ ] Write unit and integration tests:
  - [ ] Smart contract tests in Rust (`cargo test`).
  - [ ] Frontend tests (`vitest` or `jest`).
- [ ] Adhere to production-ready architecture practices.

### Codebase Requirements
- [ ] Public GitHub repository.
- [ ] Structured git history with **at least 10+ meaningful commits**.
- [ ] Live demo link deployed to Vercel/Netlify.
- [ ] Configured environment variables (no hardcoded secrets).

### Submission Assets (Required in README.md)
- [ ] Verified smart contract address on Testnet.
- [ ] Transaction hash of an advanced contract call (incorporating inter-contract communication).
- [ ] **Screenshot 1**: Mobile viewport verification showing responsive UI on a small screen layout.
- [ ] **Screenshot 2**: GitHub Actions CI/CD dashboard showing a green/passing pipeline.
- [ ] **Screenshot 3**: Test suite output in terminal showing **at least 3+ passing tests**.
- [ ] **Video Link**: A 1-2 minute video walk-through demonstrating the app's functionality (uploaded to YouTube or Loom).

---

## 💡 Idea Submission Requirements (Gate to Green Belt)

### Document Sections
- [ ] **Problem Statement**: What friction/problem are you solving in the cross-border remittance/payment sector?
- [ ] **Why Stellar?**: Explain why Stellar is the ideal blockchain layer for Aethyr (DEX, low fees, native assets, anchors).
- [ ] **Target Audience**: Who will benefit from Aethyr (remote workers, small businesses, diaspora)?
- [ ] **Technical Architecture**: Detailed summary of frontend, contracts, routing algorithms, and API integrations.
- [ ] **Complexity & Scale**: Identify the technical challenges (pathfinding algorithms, liquidity, inter-contract states).
- [ ] **Product Roadmap**: Clear milestones for Green Belt (MVP), Blue Belt (Growth), Black Belt (Mainnet launch).
