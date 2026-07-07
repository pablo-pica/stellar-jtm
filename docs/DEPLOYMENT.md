# 🚀 Aethyr — Deployment & Setup Guide (DEPLOYMENT.md)

This document provides step-by-step instructions for deploying the **Aethyr** contracts and frontend application to the Stellar Testnet and Vercel hosting.

---

## 🦊 Freighter Wallet Configuration

1. **Installation**: Install the Freighter extension from [freighter.app](https://www.freighter.app/).
2. **Network Toggle**:
   - Open the Freighter extension window.
   - Click the gear icon in the top right.
   - Navigate to **Preferences** -> **Network**.
   - Toggle the active network to **Testnet** (Default is Public).
3. **Funding your Wallet**:
   - Copy your public key address starting with `G...` from the main screen.
   - Visit the [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#account-creator?network=testnet).
   - Paste your address and click **Get testnet network funds**.
   - Verify balance in Freighter (should show 10,000 XLM).

---

## 🏗️ CLI Testnet Key Generation

We need a funded dev key to deploy contracts from our terminal.

```bash
# Generate key pair for deployment
stellar keys generate dev --network testnet --fund
```
This generates a keypair, funds it with 10,000 XLM, and registers it in the local keyring as `dev`.

---

## 🛠️ Smart Contract Compilation & Deployment

Compile the smart contracts and publish them to Testnet:

```bash
# 1. Build WASM artifacts
stellar contract build

# 2. Deploy aethyr-router
stellar contract deploy \
  --wasm target/wasm32v1-none/release/aethyr_router.wasm \
  --source-account dev \
  --network testnet \
  --alias aethyr-router

# 3. Deploy aethyr-escrow
stellar contract deploy \
  --wasm target/wasm32v1-none/release/aethyr_escrow.wasm \
  --source-account dev \
  --network testnet \
  --alias aethyr-escrow

# 4. Generate typescript bindings
stellar contract bindings typescript \
  --network testnet \
  --contract-id <ROUTER_CONTRACT_ID> \
  --output-dir ./packages/aethyr-router-bindings
```

---

## 🔑 Environment Variables Setup

Create a `.env.local` file in the root workspace directory:

```env
# Network configuration
NEXT_PUBLIC_STELLAR_NETWORK=TESTNET
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443

# Deployed Contract Addresses
NEXT_PUBLIC_ROUTER_CONTRACT_ID=CB...
NEXT_PUBLIC_ESCROW_CONTRACT_ID=CC...

# AI Smart Assist Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🚀 Vercel Deployment

Deploy the Next.js frontend using the Vercel Dashboard or CLI:

### Option A: Vercel Dashboard (Recommended)
1. Push your repository code to GitHub.
2. Go to the [Vercel Dashboard](https://vercel.com).
3. Click **New Project** and import the `stellar-jtm` repository.
4. Expand **Environment Variables** and paste the keys from your `.env.local` file.
5. Click **Deploy**. Vercel will automatically trigger preview deploys on every PR and production deploys on main branch commits.

### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Initialize project and deploy
vercel
```

---

## 🔒 GitHub Actions Secrets Setup

To verify CI/CD pipelines run green:
1. Navigate to your GitHub repository.
2. Click **Settings** -> **Secrets and variables** -> **Actions**.
3. Add the following secrets under **Repository secrets**:
   - `STELLAR_DEPLOYER_SECRET`: The private secret seed of your `dev` deploying account. (Used by CI to build/validate contract compilation).
