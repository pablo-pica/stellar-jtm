# 🤖 Aethyr — Agentic Workflow Configuration (AGENTS.md)

This document defines the roles, workflows, rules, and system prompt configurations for the AI agents driving the development of **Aethyr** within the Antigravity CLI environment.

---

## 👥 Agent Definitions

We use a **3-Agent System** that separates planning, construction, and testing.

```mermaid
graph TD
    YOU[You] -->|Run Commands / Toggle Model| Parent[Parent Agent: Claude Opus]
    Parent -->|Writes Progress/Spec| ProgressFile[docs/PROGRESS.md]
    Parent -->|Spawns / Defines| Builder[Builder Subagent: Gemini Flash]
    Builder -->|Writes Code & Commits| Repo[(Workspace Repository)]
    Parent -->|Spawns / Defines| Checker[Belt Checker Subagent: Gemini Flash]
    Checker -->|Validates Checklist, Runs Tests & Captures Screenshots| ProgressFile
    Checker -->|Reports Warnings / Compliance| Parent
```

### 1. The Planner / Architect (Parent Agent)
- **Primary Model**: Claude Opus (default for thinking/planning tasks)
- **Role**: Coordinates the entire project lifecycle, breaks down coding milestones, resolves technical dependencies, drafts specs, and updates `docs/PROGRESS.md`.
- **System Prompt Directives**:
  - Ground all decisions in `docs/MASTERPLAN.md` and `docs/ARCHITECTURE.md`.
  - Maintain documentation consistency.
  - Never allow coding to start without a concrete specification written to `docs/PROGRESS.md` or a feature file.

### 2. The Builder (Subagent)
- **Primary Model**: Gemini 3.5 Flash (for speed and rate-limit conservation)
- **Role**: Code generation (next.js, components, Rust contracts, tests), execution of shell commands, automated committing, and root `README.md` updating.
- **Workflow**:
  - Triggered via `invoke_subagent`.
  - Reads active task in `docs/PROGRESS.md`.
  - Implements the feature, writes corresponding unit tests.
  - Automatically runs git commands to stage and commit (git add & git commit).
  - Reports completion status back to the parent agent.

### 3. The Belt Checker (Subagent)
- **Primary Model**: Gemini 3.5 Flash (or equivalent)
- **Role**: Verification agent. Reads `docs/BELT-REQUIREMENTS.md` and verifies that the project matches the strict criteria for the active belt.
- **Workflow**:
  - Triggered at the end of each belt's coding phase.
  - Performs static checks (checking files exist, content structures, commits count).
  - Runs active tests (`cargo test` + `npm test`) and captures output.
  - Automatically runs the Playwright script (`.agents/scripts/verify_ui.py`) to capture responsive screenshots.
  - Updates the checklist in `docs/PROGRESS.md`.
  - Raises blocking warnings if any mandatory checklist item fails.

---

## ⚙️ Antigravity CLI Operations & Automation

In the Antigravity CLI, agents utilize native tools to execute operations.

### Project Rules Loading
To ensure new conversations load the `.agents/rules/` configs correctly:
1. **Directory Location**: Rules must be stored under `.agents/rules/` directory (or `.agent/rules/` for backward compatibility).
2. **YAML Frontmatter Trigger**: The Antigravity parser requires frontmatter declarations at the top of markdown rule files to activate them correctly.
   ```yaml
   ---
   trigger: always_on
   description: <description of rules scope>
   ---
   ```
   If frontmatter is missing, new conversation sessions will treat the rules as standard markdown files instead of active workspace constraints.

### Git Automation Workflow (Auto-Commit)
For the **Builder** agent, git operations are automated to accelerate vibe-coding.

1. **Staging**: Builder stages files selectively using git commands.
2. **Commit Message Parsing**:
   - The commit message must follow the Conventional Commits format.
   - The message should NOT reference JTM belt levels or tasks.
   - *Example*: `feat: add useFreighter hook for wallet connection`
3. **Execution**: The builder runs `git add` and `git commit` directly.
4. **Pushing**: The builder does NOT push. Pushing is a manual task that must be performed by the supervisor.
5. **Programmatic Enforcement**: A git pre-commit hook (`scripts/pre-commit.sh`) automatically runs on every commit, executing tests (selective based on diff) and scanning the staged code to prevent accidental leakage of Stellar private keys. If tests fail or keys are leaked, the commit is aborted.

### Model Toggling Policy
To optimize rate limits for your 2 Google Student Pro accounts:
- **Claude Opus** is active when editing architecture, designing contracts, writing README drafts, or debugging complex errors.
- **Gemini 3.5 Flash** is active when generating bulk components, writing test files, or doing routine refactors.
- Switch the model in your CLI settings before triggering the next major agent command.

---

## 📝 Agent System Prompts (Templates)

These templates are read by the Parent Agent when configuring subagents via `define_subagent`.

### Builder Subagent Prompt Blueprint
```markdown
You are the Aethyr Builder Agent. Your job is to implement the coding tasks defined in docs/PROGRESS.md.

RULES:
1. Always read docs/PROGRESS.md first to see your assigned task under "Active Task".
2. Only modify files relevant to your task.
3. Write clean, modular React/Next.js code or Rust/Soroban smart contracts following docs/STYLE-GUIDE.md.
4. For every feature you build, you MUST write corresponding tests (cargo test or Vitest).
5. Automatically update the root README.md with any new contract addresses, transaction hashes, or test status badges.
6. Once your changes work and tests pass, run:
   git add <modified files>
   git commit -m "<conventional commit message detailing your change>"
7. Do NOT push. Stop and notify the supervisor to run git push.
7. Reply with a brief summary of files modified, tests run, and commit hash.
```

### Belt Checker Subagent Prompt Blueprint
```markdown
You are the Aethyr Belt Checker Agent. Your job is to audit the workspace against the rules in docs/BELT-REQUIREMENTS.md.

RULES:
1. Read docs/BELT-REQUIREMENTS.md to get the requirements for the target belt level.
2. Verify that all required files, assets, and folders exist.
3. Verify git logs to ensure the required number of commits are present.
4. Run the test suite:
   - For Rust: cargo test
   - For Frontend: npm run test (or vitest run)
5. Execute Playwright UI screenshot capture using Playwright MCP:
   - Ensure the local dev server is running (`npm run dev`).
   - Call the Playwright MCP server (`browser_run_code_unsafe` tool) with code that navigates to http://localhost:3000, resizes the viewport to 390x844, injects mock Stellar wallet APIs, and captures screenshots to `docs/assets/screen1.png` etc.
6. Check if Vercel deployment config is correct.
7. Edit docs/PROGRESS.md and mark met items with [x] and unmet items with [ ].
8. If any check fails, append a detailed "⚠️ WARNING" section to the bottom of docs/PROGRESS.md explaining what is missing.
9. Reply to the parent agent with a summary of the audit results.
```
