# Aethyr — General Agent Instructions

You are executing within the **Aethyr** development workspace in the Antigravity CLI environment. Your goal is to help build a mobile-first cross-border payment routing dApp on Stellar.

---

## 📁 Shared State Check (PROGRESS.md)
Before executing ANY task, you MUST read **[docs/PROGRESS.md](file:///home/pablo-pica/Documents/programming/stellar-jtm/docs/PROGRESS.md)**:
1. Locate the `## ⚡ Active Task` section.
2. Verify the task details match your prompt.
3. Once a task is complete, update the status and checkbox in `docs/PROGRESS.md` before ending your turn.

---

## 🔧 Git Commit & Push Rules
When implementing code changes:
1. Commit immediately when a feature task is functional and its tests pass. Do not batch multiple unrelated tasks.
2. Use **Conventional Commits** formatting for messages:
   - `feat: <description>` (new features)
   - `fix: <description>` (bug fixes)
   - `test: <description>` (test suites additions/fixes)
   - `ci: <description>` (workflows/actions)
   - `docs: <description>` (markdown updates)
3. Include the belt phase name or task reference in the commit message (e.g., `feat: Freighter wallet connect (White Belt #2)`).
4. Run `git push` immediately after committing.
5. **Pre-Commit Enforcement**: Note that a git pre-commit hook (`scripts/pre-commit.sh`) is active. It will automatically run relevant tests and scan the diff to prevent accidental commits of Stellar private seeds. Do not bypass or disable this check.

---

## 🛡️ Workspace Ground Truth
Consult these reference files for design decisions:
- Plan & Timeline: **[docs/MASTERPLAN.md](file:///home/pablo-pica/Documents/programming/stellar-jtm/docs/MASTERPLAN.md)**
- Architecture & Interfaces: **[docs/ARCHITECTURE.md](file:///home/pablo-pica/Documents/programming/stellar-jtm/docs/ARCHITECTURE.md)**
- Coding Style: **[docs/STYLE-GUIDE.md](file:///home/pablo-pica/Documents/programming/stellar-jtm/docs/STYLE-GUIDE.md)**
- Belt Requirements: **[docs/BELT-REQUIREMENTS.md](file:///home/pablo-pica/Documents/programming/stellar-jtm/docs/BELT-REQUIREMENTS.md)**

---

## ⚡ Rate-Limit Protocol (2-Account Rotation)
If you encounter a `429` error, `ResourceExhausted`, or any rate limit warning from the model API:
1. **Stop Immediately**: Do not loop or execute retries that compound rate limits.
2. **Warn User**: Output a message in the chat detailing that the active Google Student Pro account has hit a rate limit.
3. **Instruction**: Advise the user to toggle the active credentials or API key in the Antigravity CLI setup to their second account.
4. **Pause Execution**: Stand by until the user confirms the account switch is complete.
