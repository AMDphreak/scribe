# Syndrome — Session progress summary

Summary of work done in this folder for future context (session date: 2025-03-07).

---

## Project overview

**Syndrome** is a desktop app (D + DlangUI) that lets non-technical users edit Markdown/AsciiDoc content in GitHub-hosted static site repos. The name plays on "Markdown Syndrome" and was chosen for a Down Syndrome non-profit use case in Memphis, TN.

- **Repo:** https://github.com/AMDphreak/syndrome  
- **License:** AGPL-3.0-or-later (source-available, copyleft)

---

## What was built

### 1. Initial scaffold and core features

- **DUB project** (`dub.json`): executable, dlangui ~>0.9.82, configurations default/console/sdl.
- **Source layout:**
  - `source/app.d` — Entry point, main window, menu, and SyndromeFrame.
  - `source/syndrome/ssg_detect.d` — Static site generator discovery (Hugo, Jekyll, MkDocs, Docusaurus, Astro, Starlight, Antora, VitePress, Eleventy, Next.js, generic MD/MDX/AsciiDoc). Builds **content tree** (editable .md/.mdx/.adoc) vs **other tree** (layouts, config, static).
  - `source/syndrome/github_client.d` — Parse GitHub URL (`owner/repo`, https, git@), `checkGhAuth()` (via `gh api user`), `cloneRepo()` (`gh repo clone` or `git clone`), `getRepoMeta()` (description/homepage), `commitAndPush()`, `hasUncommittedChanges()`.
- **Main UI:** URL bar + Open repo, Content tree | Other tree, editor, preview (raw for now). Open repo → clone into `appDataPath("syndrome")/repos/owner-repo` → scan SSG → fill trees; select file to edit.
- **Docs:** `README.adoc` (Diátaxis-style), `LICENSE` (AGPL-3.0-or-later), `.gitignore`.
- **Repo:** `git init`, `gh repo create amdphreak/syndrome`, initial push.

### 2. Second pass: tooling, save/commit, CI

- **dprint.jsonc** — Format config (JSON + Markdown plugins, line width 100, excludes bin/.dub).
- **syndrome.code-workspace** — Single-folder workspace, format-on-save, dprint + Code-D recommendations.
- **Save vs Commit (terminology):**
  - **Save** — Writes current file to disk (local only). Toolbar + File → Save (Ctrl+S).
  - **Commit** — Runs `git add -A`, `git commit -m "Update content from Syndrome"`, `git push` in repo root (so "Commit" = push to GitHub). Toolbar + File → Commit.
- **GitHub Actions:** `.github/workflows/dlang.yml` — On push/PR to main|master: matrix build (ubuntu-latest, windows-latest × dmd, ldc) with `dlang-community/setup-dlang@v2` and `dub build`.

### 3. Onboarding (no manual `gh auth login`)

- **Goal:** Users are not expected to run `gh auth login` or configure their machine by hand. Onboarding runs setup via buttons and shows progress in the UI.
- **Assumption:** Windows with **winget** for installs.
- **DlangUI fork (dev-centr):** New widget for future upstream:
  - **`ProcessOutputWidget`** (`Z:\code\github.com\dev-centr\.forks\dlangui\src\dlangui\widgets\processoutput.d`): Runs a command in a background thread, streams stdout/stderr into a mutex buffer, and drains it into a **LogWidget** on the UI thread via **setTimer()**. Public API: `runCommand(string[] args)`, `clearOutput()`, `logWidget`. Added to `dlangui.package.d`. Note in file points to Syndrome workaround until PR is merged.
- **Syndrome workaround (no dependency on new widget):**
  - **`source/syndrome/onboarding.d`** — **OnboardingDialog** (extends Dialog): Same thread + mutex + timer pattern; uses **LogWidget** for output. Buttons:
    - **1. Install GitHub CLI** → `winget install --id GitHub.cli --accept-package-agreements --accept-source-agreements`
    - **2. Install Git** → `winget install --id Git.Git ...`
    - **3. Log in to GitHub** → `gh auth login --web --git-protocol https` (opens browser).
  - **Done** closes dialog. Hint text: after installing, restart Syndrome so PATH picks up new tools.
- **Startup:** If `checkGhAuth()` returns no CLI or not authenticated, **runOnboarding(window)** is called right after the main window is shown (modal dialog).
- **Help → Set up tools** — Opens the same onboarding dialog anytime.
- **Status line** — Updated to direct users to Help → Set up tools when needed.

---

## Current state

- **Committed (pushed or local):** Initial app, dprint/workspace, Save/Commit flow, Dlang CI.
- **Uncommitted (as of this summary):** Onboarding integration in `app.d` (startup + Help menu), and new file `source/syndrome/onboarding.d`. Consider committing as one change: "Add onboarding: auto-show when gh missing/not auth, Help → Set up tools, winget install + gh auth login with streaming log."
- **DlangUI fork:** ProcessOutputWidget and package.d change are in `dev-centr\.forks\dlangui`; Syndrome does **not** depend on that fork (uses registry dlangui); workaround is self-contained in Syndrome.

---

## Possible next steps

- Richer preview (Markdown/AsciiDoc/MDX rendering; optional Antora).
- Optional use of local dlangui fork in Syndrome (path dependency in dub.json) to switch to ProcessOutputWidget once comfortable.
- Open PR from dev-centr dlangui fork for ProcessOutputWidget (and any doc tweaks).
- Non-Windows: detect OS and show different install instructions or skip winget buttons.
