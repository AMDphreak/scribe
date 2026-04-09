# Scribe Technical Specification

Scribe is a high-performance, user-friendly writing environment for static site content, designed for non-technical users. It migrates the original Dlang-based Syndrome UI into a modern Electron + SolidJS architecture.

## 1. Core Architecture (3-Pane Workspace)

The application follows a professional 3-pane layout designed for productivity:

1. **Left Pane (Explorer)**:
    * **Content Tree**: Displays only editable content files (Markdown, AsciiDoc, MDX) organized by their logical SSG content roots.
    * **Management Tree**: (Collapsible/Secondary) Displays layout, static assets, and configuration files.
    * **Breadcrumbs**: Navigation path for the currently active file.
2. **Center Pane (Editor)**:
    * High-fidelity text editor (Monaco or specialized textarea) with syntax highlighting.
    * Local auto-save to temporary drafts.
3. **Right Pane (Live Preview)**:
    * Integrated WebView/Iframe showing the output of the local SSG dev server.
    * Support for "Sandbox mode" (mock preview) when no dev server is active.

## 2. Backend Systems (Electron Main)

### 2.1 VCS Profile System

Scribe uses a "Profiles" system to manage Git hosts without user-facing complexity.

* **Storage**: SDL files in the `profiles/` directory (e.g., `github.sdl`, `gitlab.sdl`).
* **Properties**: `name`, `host`, `binary`, `authUrl`, `tokenUrl`, `apiUrl`, `setupGuide`.
* **Authentication**: Hybrid use of GitHub CLI (`gh`) for auth and Git for operations.

### 2.2 SSG Detection Engine

A comprehensive heuristic engine detects the project type and content locations:

* **Supported SSGs**: Hugo, Jekyll, MkDocs, Docusaurus, Astro, Starlight, Antora, VitePress, 11ty, Next.js.
* **Detection**: Scans for specific config files (e.g., `mkdocs.yml`, `hugo.toml`).
* **Mapping**: Maps logical "Content" to physical directories (e.g., `docs/` in MkDocs, `content/` in Hugo).

### 2.3 Onboarding & Tooling

* **Pre-flight Check**: Detects if `git` and `gh` are installed.
* **Automated Install**: Uses `winget install --id <id> --accept-package-agreements --accept-source-agreements` to install missing tools.
* **Auth Flow**: Triggers `gh auth login --web` to connect accounts.

## 3. IPC API Reference

| Channel | Parameters | Description |
| :--- | :--- | :--- |
| `repo:parse` | `url: string` | Parses owner/repo/host from URL. |
| `repo:clone` | `repo: GhRepo, dir: string` | Clones or opens a repository. |
| `repo:check-auth` | | Returns current GitHub authentication status. |
| `ssg:detect` | `dir: string` | Returns detected SSG type and content roots. |
| `fs:tree` | `dir: string, roots: string[]` | Returns a content-aware file tree. |
| `setup:check-tools` | | Checks for Git/GH CLI installation. |
| `setup:install-tool` | `id: string` | Triggers a winget installation. |

## 4. UI/UX Design System

* **Theme**: Dark mode Indigo (Premium aesthetics).
* **Typography**: Inter or System Sans-Serif.
* **Icons**: Lucide (Indigo-tinted).
* **Aesthetics**: Glassmorphism headers, subtle micro-animations for pane toggling.
