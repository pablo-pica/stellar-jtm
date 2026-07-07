# 📜 Aethyr — Code & Style Guide (STYLE-GUIDE.md)

This document establishes development conventions, directory layouts, naming standards, and visual guidelines for building the **Aethyr** codebase. All coding agents must strictly adhere to these rules.

---

## 📂 Directory Layout

The project follows a standard Next.js workspace structure, with smart contracts contained in a subfolder.

```
stellar-jtm/
├── contracts/               # Soroban Smart Contracts (Rust)
│   ├── aethyr-router/       # Router contract
│   │   ├── src/
│   │   │   └── lib.rs       # Entrypoint
│   │   └── Cargo.toml
│   └── aethyr-escrow/       # Escrow contract
├── docs/                    # Workspace documentation (Markdown)
├── src/                     # Next.js App Router source code
│   ├── app/                 # Page routing
│   │   ├── layout.tsx
│   │   └── page.tsx         # Mobile dashboard
│   ├── components/          # Reusable React components
│   │   ├── ui/              # Primitive buttons, inputs, modals
│   │   ├── WalletConnect.tsx
│   │   ├── RouteCalculator.tsx
│   │   └── EscrowLock.tsx
│   ├── hooks/               # Custom React hooks (useFreighter, useStellarWallet)
│   ├── lib/                 # Shared utilities, pathfinding algorithms, SDK instances
│   └── styles/              # Global css and Tailwind configs
├── public/                  # Static assets, icons, manifest.json for PWA
├── packages/                # Generated TypeScript bindings for Soroban contracts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🎨 Visual & UI Style

Aethyr is designed from Day 1 to be a **Mobile-First PWA** resembling a native iOS/Android application.

### Design Tokens
- **Theme**: Slate / Dark theme. Deep space dark colors.
  - Background: `#030712` (Slate 950)
  - Card/Modal Background: `#111827` (Slate 900)
  - Primaries: `#6366f1` (Indigo 500) and `#3b82f6` (Blue 500) gradients
  - Text Primary: `#f9fafb` (Gray 50)
  - Text Secondary: `#9ca3af` (Gray 400)
- **Viewport Constraints**:
  - Enclose the core dApp within a centered **mockup frame** when viewed on desktops (max width `420px`).
  - True full-bleed on mobile screens with bottom navigation menus.
  - Notch/safe area padding applied to header and footers.

### PWA Guidelines
- Include a manifest file at `public/manifest.json`.
- Configure status bar color to `black-translucent`.
- Provide immediate, optimistic feedback on clicks (touch states, loaders).

---

## 💻 Frontend Code Conventions

- **TypeScript**: Strict mode enabled. No `any` type allowed.
- **Component Anatomy**:
  - Directives: Use `"use client"` only for components using hooks, state, or browser APIs (Freighter).
  - Folder organization: Group modular components together.
- **Naming Conventions**:
  - Components: PascalCase (e.g., `RouteVisualizer.tsx`).
  - Hooks: camelCase (e.g., `useFreighter.ts`).
  - Utility/Logic: camelCase (e.g., `pathfinder.ts`).

---

## 🦀 Soroban Smart Contract Conventions

- **Safe Storage Patterns**:
  - Always use instance storage for configuration values (`env.storage().instance()`).
  - Temporary data / nonces stored in temporary storage.
- **Events Elicitation**:
  - Every successful transaction execution must emit a structured Soroban event.
  - Events should follow the schema: `(Symbol::new(&env, "event_name"), topic_1, topic_2, data)`.
- **Rust Structure**:
  - Maintain clean interfaces (`traits`) for contract APIs.
  - Use descriptive names for contract methods: `snake_case` (standard Rust).
  - Document all public contract methods with docstrings.

---

## 🔍 Context7 Documentation Lookup Rules
To prevent outdated or hallucinated API patterns:
1. **JavaScript/TypeScript SDK**: Query `/stellar/js-stellar-sdk` using the `context7` MCP server before writing wallet connections or transaction builders.
2. **Stellar Wallets Kit**: Query `/creit-tech/stellar-wallets-kit` to verify exact modal options, browser extension detections, and events.
3. **Soroban Smart Contracts**: Query `/stellar/rs-soroban-sdk` to look up correct macro interfaces (e.g. `#[contract]`, `#[contractimpl]`), environment storage structures, and test helpers.
4. **General Developer Docs**: Query `/websites/developers_stellar` for network parameters, Horizon HTTP endpoint schemas, and DEX orderbook structures.
5. **Lookup Requirement**: Always resolve the library ID first, then execute a targeted documentation search query. Do not write raw code from memory if you are unsure of the signatures.
