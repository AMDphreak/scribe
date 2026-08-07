<a id="readme-top"></a>
<div align="center">
  <a href="https://github.com/AMDphreak/scribe/graphs/contributors"><img src="https://img.shields.io/github/contributors/AMDphreak/scribe.svg?style=for-the-badge" alt="Contributors"></a>
  <a href="https://github.com/AMDphreak/scribe/network/members"><img src="https://img.shields.io/github/forks/AMDphreak/scribe.svg?style=for-the-badge" alt="Forks"></a>
  <a href="https://github.com/AMDphreak/scribe/stargazers"><img src="https://img.shields.io/github/stars/AMDphreak/scribe.svg?style=for-the-badge" alt="Stargazers"></a>
  <a href="https://github.com/AMDphreak/scribe/issues"><img src="https://img.shields.io/github/issues/AMDphreak/scribe.svg?style=for-the-badge" alt="Issues"></a>
  <a href="https://github.com/AMDphreak/scribe/blob/main/LICENSE"><img src="https://img.shields.io/github/license/AMDphreak/scribe.svg?style=for-the-badge" alt="License"></a>

  <h1>Scribe — Write. Publish. Done.</h1>
  <p>Edit Markdown/AsciiDoc in GitHub static site repos — for non-technical users.</p>
  <p>
    <a href="http://ryanjohnson.dev/scribe/"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/AMDphreak/scribe/issues">Report Bug</a>
    &middot;
    <a href="https://github.com/AMDphreak/scribe/issues">Request Feature</a>
  </p>
</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li><a href="#features">Features</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

## About The Project

Scribe is a user-friendly, non-technical environment for editing website content. It's designed for people who want to manage their static sites (built with Astro, Hugo, Jekyll, etc.) without needing to understand Git, Markdown, or the command line.

![Scribe Screenshot](docs/images/scribe-screenshot.png)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

* **Desktop app** — [![Electron][Electron.com]][Electron-url]
  * [![TypeScript][TypeScript.com]][TypeScript-url]
* **Docs** — Antora manual published to GitHub Pages

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Features

* **Visual Editing**: Edit your site's content like a regular document.
* **Direct Publishing**: Click "Publish" to save changes directly to your site's repository (GitHub or GitLab).
* **Automatic Navigation**: Scribe automatically manages your site's menu and structure.
* **No Git Knowledge Required**: We handle the technical stuff in the background.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started

1. Download the latest version for your system from the **Releases** page.
2. Open Scribe and paste your **Site Address** (e.g., `https://github.com/user/my-cool-site`).
3. Click **Open Site**.
4. Log in when prompted (the app will open your web browser).
5. Start editing!

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

### Changelog

See [Changelog](docs/modules/ROOT/pages/CHANGELOG.adoc) in the repository, or the published timeline at [Changelog (GitHub Pages)](https://amdphreak.github.io/scribe/docs/CHANGELOG.html).

### Documentation

The Antora manual (overview, changelog hub, OAuth guide) is published at [Scribe documentation](https://amdphreak.github.io/scribe/docs/).

For advanced setup, see the [OAuth and API access](docs/modules/ROOT/pages/oauth-setup.adoc) page in the docs module.

### Configuration (Advanced)

Scribe supports custom VCS providers and Git configurations via SDLang profiles. By default, it supports GitHub and GitLab.

See [OAuth and API access](docs/modules/ROOT/pages/oauth-setup.adoc) for registering your own OAuth application and editing `profiles/*.sdl`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contributing

Contributions are welcome. Open an issue to discuss larger changes before submitting a pull request.

### Top contributors

<a href="https://github.com/AMDphreak/scribe/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=AMDphreak/scribe" alt="contributors" />
</a>

For per-person profile links, prefer [all-contributors](https://allcontributors.org/).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## License

Scribe is licensed under the **AGPL-3.0-or-later**.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contact

Ryan Johnson — [@amdphreak](https://twitter.com/amdphreak)

Project Link: [https://github.com/AMDphreak/scribe](https://github.com/AMDphreak/scribe)

Site: [http://ryanjohnson.dev/scribe/](http://ryanjohnson.dev/scribe/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[Electron.com]: https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white
[Electron-url]: https://www.electronjs.org/
[TypeScript.com]: https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
