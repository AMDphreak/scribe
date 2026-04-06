# Scribe site (homepage + optional docs)

SolidJS + Vite homepage for [Scribe](https://github.com/AMDphreak/scribe). Built for GitHub Pages at **https://amdphreak.github.io/scribe/**.

## Homepage only

```bash
pnpm install
pnpm build
```

Output is in `dist/`. Deploy `dist/` to the `gh-pages` branch or to GitHub Pages from `/ (root)` or `/docs` folder.

## Homepage + Antora docs at `/docs`

To serve Antora-generated docs under **/scribe/docs/**:

1. Build the SolidJS site: `pnpm build` → `dist/`
2. Build Antora with a playbook that sets:
   - `site.url: https://amdphreak.github.io/scribe`
   - Output dir to `site/dist/docs` (or a staging dir you then copy into `dist/docs`)
3. Antora’s `start_path` (or equivalent) should be `/docs` so asset and nav links use `/scribe/docs/...`

Example Antora playbook fragment (e.g. in repo root or `docs/`):

```yaml
site:
  title: Scribe
  url: https://amdphreak.github.io/scribe
  start_page: docs::index.adoc
content:
  sources:
    - url: .
      start_path: docs
output:
  dir: site/dist/docs
```

Then run `antora playbook.yml` (or your playbook name) so that Antora output lands in `site/dist/docs/`. The same `dist/` then contains:

- `index.html` → homepage
- `docs/` → Antora HTML/assets

Deploy `dist/` as the full site; the homepage stays at `/scribe/` and docs at `/scribe/docs/`.
