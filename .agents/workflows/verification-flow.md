# 🧪 Quality Gate Verification Playbook

This playbook outlines how the **Belt Checker** subagent verifies the repository's compliance with JTM guidelines before a belt level is submitted.

---

## 🔍 Verification Checklist Lifecycle

```
[Trigger Verification]
   --> [Load docs/BELT-REQUIREMENTS.md]
   --> [Audit Static Files: check required paths & assets]
   --> [Audit Git History: verify commit message tags & count]
   --> [Run Test Suites: cargo test & npm run test]
   --> [Compile Audit Log]
   --> [Update docs/PROGRESS.md with check status]
         |-- Warnings Found --> [Set task status to Needs Action]
         |-- Clean Pass     --> [Set task status to Audit Passed]
```

### 1. Requirements Fetching
Load **[docs/BELT-REQUIREMENTS.md](file:///home/pablo-pica/Documents/programming/stellar-jtm/docs/BELT-REQUIREMENTS.md)** and parse the check items for the target belt level.

### 2. Static File Verification
Verify that required directories and configuration files exist. E.g., for White Belt, check that the main wallet hooks exist; for Yellow/Orange Belt, check that Soroban Rust structures (`Cargo.toml` and contract bindings) exist.

### 3. Git History Audit
Read local commit logs:
- Parse commit messages to verify conventional prefixes are used.
- Count total commits to ensure JTM minimums are met.
- Ensure no empty or placeholder commits are present.

### 4. Code & On-Chain Audit
- Verify contract address and explorer transaction hashes are logged inside the README file.
- Verify environment variable keys exist in `.env.example` and are not committed in code.

### 5. Report Compilation
- Check off items in **[docs/PROGRESS.md](file:///home/pablo-pica/Documents/programming/stellar-jtm/docs/PROGRESS.md)**.
- If warnings are found, write them clearly under the `⚠️ Warning Logs` section with actionable tips.
