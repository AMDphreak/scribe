export default function App() {
  return (
    <div class="page">
      <header class="hero">
        <h1 class="title">Scribe</h1>
        <p class="tagline">Edit static site content from GitHub — no terminal required.</p>
        <p class="sub">
          Paste a repo URL, click to install tools once, then edit Markdown and AsciiDoc in a tree. Save locally, push when ready.
        </p>
        <div class="ctas">
          <a href="https://github.com/AMDphreak/Scribe" class="btn btn-primary" target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
          <a href="docs/" class="btn btn-secondary">Docs</a>
        </div>
      </header>

      <section class="about">
        <h2>Why Scribe?</h2>
        <p>
          Named for <strong>“Markdown Scribe”</strong> — and for the{" "}
          <a href="https://www.dsamt.org/" target="_blank" rel="noopener noreferrer">Down Scribe Association of Memphis & the Mid-South</a>.
          We built it so non-technical folks can help keep documentation and content up to date without touching git or the command line.
        </p>
      </section>

      <section class="features">
        <h2>What it does</h2>
        <ul>
          <li>Paste a GitHub repo URL and open it in one click</li>
          <li>Auto-detects Hugo, Jekyll, MkDocs, Docusaurus, Astro, Starlight, Antora, VitePress, Eleventy, and more</li>
          <li>Content tree (editable .md / .mdx / .adoc) separate from layouts and config</li>
          <li>Save files locally, then “Commit” to push to GitHub</li>
          <li>Onboarding installs GitHub CLI and Git via winget and walks you through login</li>
        </ul>
      </section>

      <footer class="footer">
        <p>
          <a href="https://github.com/AMDphreak/Scribe">Repository</a>
          {" · "}
          <a href="docs/">Documentation</a>
          {" · "}
          AGPL-3.0-or-later
        </p>
      </footer>
    </div>
  );
}

