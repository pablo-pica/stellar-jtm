# 🔄 Commit & Push Workflow Playbook

This playbook defines the Git life cycle for the **Builder** agent during development.

---

## 🛠️ Step-by-Step Commit Sequence

```
[Task Coded]
   --> [Agent runs local test suite]
   --> [Check: Tests Pass?]
         |-- Yes --> [Agent runs: git status & git diff]
         |-- No  --> [Agent debugs & fixes code] (Loop)
   --> [Agent stages files: git add]
   --> [Agent executes: git commit -m "conventional msg"]
   --> [Git Hook: pre-commit.sh executes]
         |-- Pass --> [Commit finalized] --> [Agent runs: git push]
         |-- Fail --> [Commit rejected] --> [Agent fixes tests/secrets] (Loop)
```

### 1. Verification
Before staging, the agent must run the local tests:
- Rust: `cargo test` inside the contract subfolder.
- Frontend: `npm run test` or Vitest.
Do not attempt a commit if tests are failing.

### 2. Staging
Stage only files that are related to the active task. Avoid staging stray configuration changes or unfinished code.

### 3. Commit Message Construction
Construct the commit message using **Conventional Commits** tags:
- Prefix (e.g. `feat:`, `fix:`, `docs:`, `test:`, `ci:`)
- Reference the active task or belt level (e.g. `fix: Freighter balance state rendering (White Belt #3)`)

### 4. Push Execution
Once the pre-commit hook runs and the commit is successfully recorded, execute `git push origin <active-branch>` immediately to make the changes available in the remote repository.
