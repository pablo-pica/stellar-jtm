# 📜 Aethyr — Code & Style Guide (STYLE-GUIDE.md)

This document establishes development conventions, directory layouts, naming standards, and visual guidelines for building the **Aethyr** codebase. All coding agents must strictly adhere to these rules.

---

## 📂 Directory Layout

The project follows a standard Next.js workspace structure, with smart contracts contained in a subfolder.

```
aethyr/
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
│   │   ├── EscrowLock.tsx
│   │   ├── BottomNav.tsx     # App navigation tabs
│   │   ├── ProfileDrawer.tsx # Wallet details & balance panel
│   │   └── SettingsPanel.tsx # Slippage, network, and AI settings
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

Aethyr is designed from Day 1 to be a **Mobile-First PWA** resembling a native iOS/Android application. It features a deep space theme with glassmorphic elements and neon gradient accents.

### 1. Tailwind CSS v4 CSS Configuration
Tailwind v4 deprecates `tailwind.config.js` in favor of pure CSS-based configurations. The design system is defined in `src/styles/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-space-950: #030712;
  --color-space-900: #090d16;
  --color-space-800: #111827;
  --color-space-700: #1f2937;
  
  --color-primary-indigo: #6366f1;
  --color-primary-indigo-dark: #4f46e5; /* Indigo-600 for high-contrast button states */
  --color-primary-blue: #3b82f6;
  --color-primary-cyan: #06b6d4;
  
  --font-sans: "Inter", var(--font-geist-sans), sans-serif;
  --font-display: "Outfit", var(--font-geist-sans), sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
}

/* Custom class-based dark mode variant */
@custom-variant dark (&:where(.dark, .dark *));
```

### 2. Glassmorphism & Neon Glow Specifications
To achieve a "seamless, slick, and modern" look, container cards must use backdrop filters and soft edge glows:
- **Standard Card Utility**:
  `bg-space-900/75 backdrop-blur-lg border border-space-700/50 shadow-lg shadow-space-950/20`
- **Glowing Interactive Card**:
  `hover:border-primary-indigo/40 hover:shadow-2xl hover:shadow-primary-indigo/5 transition-all duration-300`
- **Bento Glowing Grid Elements**: Add a radial gradient or custom background glow:
  `bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-indigo/10 via-space-900 to-space-900`

### 3. Space-Themed Typography & Gradients
- **Title Headers**: Apply clipping to text gradients and utilize display typeface for headers:
  `font-display bg-gradient-to-r from-primary-indigo via-primary-blue to-primary-cyan bg-clip-text text-transparent font-semibold`
- **Buttons**: Linear high-contrast indigo-to-blue gradients with active press shrink states:
  `bg-gradient-to-r from-primary-indigo-dark to-primary-blue hover:from-primary-indigo-dark/95 hover:to-primary-blue/95 active:scale-[0.98] font-semibold text-white transition-all`

### 4. Framer Motion Micro-Animations Spec
Animations must feel responsive, swift, and organic. Standard parameters:
- **Hover Scale State**: `whileHover={{ scale: 1.02, y: -2 }}`
- **Active Click State**: `whileTap={{ scale: 0.98 }}`
- **Transition Preset (Spring)**: `transition={{ type: "spring", stiffness: 400, damping: 25 }}`
- **Page Transitions**: Simple fade-in and slide-up:
  ```typescript
  initial={{ opacity: 0, y: 15 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -15 }}
  ```

### 5. Interactive Loading & State Feedback
- **Skeleton Loaders**: Custom pulse animations mimicking currency charts.
- **Optimistic UI Action**: For transactions, temporarily disable input and show a glowing scanner/radar animation over the route map to simulate the instant pathfinding before wallet validation.
- **Floating Toast Notifications**: Border glows matching status: Success (Green/Cyan glow), Processing (Indigo pulsing), Warning/Error (Crimson red glow).

### 6. PWA Guidelines
- Include a manifest file at `public/manifest.json`.
- Configure status bar color to `black-translucent` and viewport fit to `cover`.
- Add touch-highlight suppression (`-webkit-tap-highlight-color: transparent`).

### 7. Readability & Human-Centric UI/UX Standards
To ensure that judges and users can navigate the dApp effortlessly under dark-mode environments, adhere to these readability and usability rules:
- **Contrast & Hierarchy**:
  - *Primary Text* (headings, key values): Use high-contrast slate-50 (`#f9fafb`) or absolute white.
  - *Secondary Text* (descriptions, sub-labels): Use slate-300 (`#d1d5db`) or slate-400 (`#9ca3af`). Do not drop below slate-500 (`#6b7280`) for body text to maintain WCAG 2.1 AA legibility standard (4.5:1 ratio against space-900 background).
  - *Highlighted Metrics* (savings, routes): Use vibrant, glow-backed emerald/green for gains (`text-emerald-400 shadow-emerald-500/10`) and indigo/cyan for active selections.
- **Mobile Touch Targets**:
  - Buttons and interactive items must maintain a minimum tap target size of **48px x 48px** (`h-12` or `py-3` with proper margins) to avoid errant clicks on mobile viewports.
  - Tap target margins: Keep interactive elements separated by at least `8px` (`space-y-2` or `gap-2`).
- **Input Field Ergonomics**:
  - Input fields must use distinct focus states (e.g. `focus:ring-2 focus:ring-primary-indigo/50 focus:border-primary-indigo`).
  - Keep label typography clear, positioned directly above or floating inside the input wrapper. Avoid placeholder-only label styles.
  - Action buttons must show loading spinners and disable double-taps (`disabled={isLoading}`) during Soroban transaction broadcast to prevent duplicate signatures.
- **Scannability Rules**:
  - Use visual divider lines (`border-space-700/30`) to group related information clusters (e.g. breakdown of fees, route stops).

### 8. Path Routing & Node Visualization Spec
To visualize the calculated least-cost routed path beautifully, the `RouteVisualizer` component must adhere to the following design constraints:
- **Node Component Anatomy**:
  - Each asset hop (e.g. USDC, XLM, PHP) is rendered as a circular glassmorphic pill:
    `flex flex-col items-center justify-center w-16 h-16 rounded-full bg-space-800/80 border border-space-700/60 backdrop-blur-md relative shadow-lg`
  - *Accent Glow Rings*: Wrap the circular nodes in a soft glow ring colored by asset classification (e.g. green shadow glow for USDC stablecoin, blue for XLM, cyan for local fiat tokens).
  - *Asset Content*: Display a high-res flat flag/token icon at the center, with the uppercase asset symbol (`font-mono text-xs font-semibold tracking-wider text-slate-50 mt-1`) positioned underneath the node.
- **Dynamic Flowing SVG Lines**:
  - Connection paths between nodes are rendered using inline SVG lines (`<svg>` overlaying the flex row layout).
  - *Animation of Flow*: The line stroke must feature an animated dashed array that moves in the direction of the currency flow (e.g., using Framer Motion `strokeDashoffset` loop), visually conveying the concept of "money flowing through the network."
    - *Example Class*: `stroke-primary-indigo stroke-2 [stroke-dasharray:6,6]`
- **Edge Data Tooltips (Hop Metadata)**:
  - Position a small badge above or below each connecting line representing the hop transaction details:
    `px-2 py-0.5 rounded-full bg-space-950/90 border border-space-700/40 text-[9px] font-mono text-slate-400`
  - *Metrics*: Display the pool/DEX type (e.g. "AMM 0.3%" or "Orderbook") and the direct conversion rate (e.g. "1 XLM ➔ 0.12 USD").
- **Interactive Tooltip Triggers**:
  - Tapping a node expands a small clean overlay showing liquidity parameters: total pool reserves, 24h trading volume, and estimated price impact (slippage) for the current transaction amount.

---

## 💻 Frontend Code Conventions

- **TypeScript**: Strict mode enabled. No `any` type allowed. All contract binding functions must be typed.
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

