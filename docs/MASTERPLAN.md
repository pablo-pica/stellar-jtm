# 🌌 Aethyr — JTM Master Plan

> *"Your money, transmitted through the Aethyr."*

**Project**: Aethyr — AI-Augmented Cross-Border Payment Routing on Stellar  
**Track**: Builder Track  
**Program**: Stellar Journey to Mastery ($20K/month prize pool)  
**Program Window**: May 31 – August 31, 2026  
**Coding Start**: July 7, 2026  
**Approach**: Vibe-coded with strict quality verification  
**Models**: Gemini Flash 3.5 (medium) · Claude Opus (planning)  

---

## 📊 Program Intelligence

### Key Rules

| Rule | Detail |
|------|--------|
| Reward model | Competitive — "selected winners" scored by technical committee |
| Highest belt only | Rewarded for the HIGHEST belt per month, not cumulative |
| Chain unbroken | Must pass every preceding level to be rewarded for higher ones |
| One project + track/month | Cannot do Builder + Startup Track simultaneously |
| Monthly evaluation | Progress reviewed at end of each month |
| No repeat rewards | Once rewarded for a level, must advance for future eligibility |
| Team = 1 prize | Prize per project, not per person |
| Earlier = reviewed first | Submit early to be reviewed before the rush |
| Mentor Checkpoint | Must get feedback on technical/market fit before onboarding users (for Levels 5 & 6) |

### Reward Table

| Belt | Level | Reward | Status |
|------|-------|--------|--------|
| ⚪ White | 1 | No stated reward | Unlocked |
| 🟡 Yellow | 2 | **$10** / winner | Unlocked |
| 🟠 Orange | 3 | **$50** / winner | Unlocked |
| 💡 Idea Submission | Gate | None (unlocks 4-7) | Unlocked |
| 🟢 Green | 4 | Unknown (likely $100+) | 🔒 |
| 🔵 Blue | 5 | Unknown (likely $200+) | 🔒 |
| ⚫ Black | 6 | Unknown (likely $300+) | 🔒 |
| 🏆 Master | 7 | Unknown (recurring) | 🔒 |

> [!IMPORTANT]
> The $20K pool is **weighted toward higher belts**. Getting past Orange into Green+ in August is where the real money is.

### 🏆 Insider Tips

1. **Judges rely heavily on README** — your README IS your pitch
2. **PWA / mobile-ready stands out** — installable on homescreen shows production thinking
3. **Strict belt compliance** — meet every checkbox first, add flair on top

---

## 🌌 Project: Aethyr

### Elevator Pitch

> Aethyr is an intelligent cross-border payment routing platform built on Stellar. It analyzes DEX orderbooks in real-time to find the cheapest multi-hop path for your money — with an optional AI assist that lets you describe payments in plain language.

### Feature Progression

| Feature | Belt | Description |
|---------|------|-------------|
| Wallet + Balance + Send | ⚪ White | Connect Freighter, show XLM balance, send transaction |
| Contract + Multi-wallet + Events | 🟡 Yellow | Payment routing contract, 3 error types, tx status |
| Full dApp + AI + Tests + CI/CD | 🟠 Orange | Production PWA, inter-contract calls, test suite, pipeline |
| Production MVP + 10 Users | 🟢 Green | Full routing engine, testnet user onboarding |
| Scale + Pitch + 50 Users | 🔵 Blue | Feedback-driven features, pitch deck, demo |
| Mainnet + Audit + Real Users | ⚫ Black | Production launch with security review |

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|--------|
| Frontend | React + Next.js (App Router) | 15+ |
| Styling | Tailwind CSS | v4 |
| PWA | `next-pwa` or `@serwist/next` | Latest |
| Contracts | Rust + Soroban | Rust 1.84+ |
| Wallet | `@stellar/freighter-api` | 6.0.1 |
| Multi-wallet | `@creit-tech/stellar-wallets-kit` | 2.2.0 |
| SDK | `@stellar/stellar-sdk` | 16.0.1 |
| CLI | `stellar-cli` | 27.0.0 |
| WASM | `wasm32v1-none` | rustup |
| AI Assist | Gemini API (free tier) | Optional |
| Deploy | Vercel | Latest |
| CI/CD | GitHub Actions | |
| Tests | Vitest + `cargo test` | |

---

## 🏷️ Task Ownership Matrix

| Label | Meaning | Examples |
|-------|---------|---------|
| **[AI]** | AI generates AND executes (auto-commit, auto-push) | Code generation, tests, README text, git commits, CI config |
| **[AI→YOU]** | AI prepares, you review/approve before it runs | Architecture decisions, commit messages |
| **[YOU]** | Strictly manual — only you can do this | Vercel deploy, screenshots, demo video, GIFs, env keys, belt submission, Freighter testing, Rise In form submission |

---

## 📅 Flexible Milestone Timeline

### Phase Overview

| Phase | Coding Days | What Gets Done | Deliverable |
|-------|-------------|----------------|-------------|
| **0: Setup** | 1-2 | Environment, tooling, crash course | Dev environment ready |
| **1: White Belt** | 1-2 | Wallet, balance, transaction, PWA shell | White Belt submitted |
| **2: Yellow Belt** | 2-3 | Smart contract, multi-wallet, events | Yellow Belt submitted |
| **3: Orange Belt** | 5-7 | Full dApp, tests, CI/CD, demo video | Orange Belt submitted |
| **4: README + Submit** | 1-2 | Award-winning README, final polish | Orange submission polished |
| **5: Idea Submission** | 2-3 | Idea document, revisions | Idea submitted |
| **Buffer** | 2-4 | Catch-up or Green Belt pre-work | Flexibility |
| **6: August Sprint** | ~20 | Green → Blue Belt | Highest belt possible |

**Total coding days to Orange Belt + Idea**: **12-19 coding days**

### Known Dead Zone

> [!WARNING]
> **Finals Period: ~July 15-21** (approximate). Expect 0-2 coding days during this window. The timeline automatically absorbs this — you just track coding days, not calendar days.

### Three Scenarios

| Scenario | Finals Impact | Orange Belt Done | Idea Submitted | Notes |
|----------|--------------|-----------------|----------------|-------|
| 🟢 Best | Finals light (2 lost days) | ~Coding Day 12 | ~Coding Day 15 | Full buffer for August |
| 🟡 Realistic | Finals moderate (5 lost days) | ~Jul 25-27 | ~Jul 28-30 | Tight but achievable |
| 🔴 Worst | Finals heavy (7 lost days) | ~Jul 30-31 | ~Aug 1-3 | Orange reward at risk if deadline missed |

---

## 📊 Pace Tracker

### How It Works

```
CODING_DAYS_DONE    = count of days you coded 4+ hours
CODING_DAYS_NEEDED  = 14 (for Orange Belt) or 17 (Orange + Idea)
CALENDAR_DAYS_LEFT  = July 31 - today
AVAILABLE_CODING_DAYS = CALENDAR_DAYS_LEFT - FINALS_DAYS - REST_DAYS
```

### Milestone Checkpoints

| After Coding Day | Should Be At | If Behind |
|-----------------|-------------|-----------|
| **Day 4** | White Belt submitted | Compress Phase 1+2 overlap |
| **Day 7** | Yellow Belt submitted | Cut scope: skip event listener polish |
| **Day 10** | Orange Belt 50% done (contracts + tests) | Cut AI Assist to post-submission enhancement |
| **Day 14** | Orange Belt submitted | Rush README; submit what you have |
| **Day 17** | Idea Submission done | Submit Idea even if imperfect; iterate |

---

## 🔧 Vibe-Coding Rules

### Workflow Per Feature

```
1. [Claude Opus]     → Plan feature / architecture
2. [Gemini Flash 3.5]→ Generate code
3. [AI]              → Generate tests alongside code
4. [AI]              → Auto-commit + push (conventional commits)
5. [GitHub Actions]  → Auto-lint + test
6. [YOU]             → Test in browser + deploy to Vercel
7. [Belt Checker]    → Verify requirements (before submission)
```

### Commit Rules
- Conventional prefixes: `feat:`, `fix:`, `test:`, `ci:`, `docs:`, `chore:`
- No empty or trivial commits — every commit advances a belt requirement
- Minimum commits: White (3+), Yellow (2+), Orange (10+)

### Quality Gates (before each submission)
1. ✅ Belt compliance checklist — every box checked
2. ✅ All tests passing (`cargo test` + `npm test`)
3. ✅ CI/CD pipeline green
4. ✅ Live Vercel deployment accessible
5. ✅ README updated with latest screenshots + contract addresses
6. ✅ Mobile viewport tested
7. ✅ No secrets in repo

---

## ⚠️ Risk Register

| Risk | Impact | Prob. | Mitigation |
|------|--------|-------|------------|
| Rust/Soroban learning curve | 1-2 day slip | HIGH | AI generates contracts; focus on understanding |
| **Finals (Jul 15-21)** | **5-7 lost days** | **HIGH** | **Built into timeline as dead zone; milestone-based tracking absorbs it** |
| Rate limits exhausted | Lost coding day | MED | 2 accounts; batch requests; offline work when limited |
| Idea Submission slow review | August blocked | MED | Submit by Coding Day 17; follow up in Discord |
| Orange not selected as winner | No $50 | MED | Quality README + PWA + strict compliance |
| CI/CD complications | Orange checklist gap | LOW | Simple Actions template; set up Day 1 |
