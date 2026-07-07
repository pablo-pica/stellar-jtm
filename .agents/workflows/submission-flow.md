# 🚀 Belt Submission Playbook

This playbook defines the handoff process when a JTM belt level is finalized and ready for submission on the Rise In dashboard.

---

## 🤝 Handoff & Submission Lifecycle

```
[Belt Checker Passes Audit]
   --> [Agent updates docs/PROGRESS.md to 'Audit Passed']
   --> [Agent notifies USER to perform manual checklist]
   --> [USER: Verifies live Vercel deploy]
   --> [USER: Captures UI screenshots & video demo]
   --> [USER: Updates README with links & media]
   --> [USER: Pushes final README update]
   --> [USER: Fills out Rise In Submission Form]
   --> [USER: Submits & updates PROGRESS.md next level]
```

### 1. Checker Pass Notification
Once the `aethyr_checker` changes the active task status to `Audit Passed` in **[docs/PROGRESS.md](file:///home/pablo-pica/Documents/programming/stellar-jtm/docs/PROGRESS.md)**, the AI agent will notify you in chat that the workspace is compliant.

### 2. Live Environment Verification
You must access your live Vercel URL and run Freighter/multi-wallet connection flows. Test transaction transfers to verify network APIs are responding correctly in production.

### 3. Media & Assets Capture
- Capture required viewport screenshots showing the successful actions.
- Save assets to the `docs/assets/` directory (e.g. `docs/assets/screen1.png`).
- Record the 1-2 minute Loom or YouTube video walk-through demonstrating app functionality.

### 4. README update & Polish
Insert the screenshots, contract addresses, transaction hashes, and video links into the root `README.md` file using the guidelines in **[docs/README-TEMPLATE.md](file:///home/pablo-pica/Documents/programming/stellar-jtm/docs/README-TEMPLATE.md)**. Commit and push this final asset commit manually or via the Builder.

### 5. Platform Submission
Go to your **Rise In Dashboard**, select the active Belt Level, paste your public GitHub repository link, and submit the project.
Once submitted, update the status checklist in `docs/PROGRESS.md` and set the next milestone task to `Active`.
