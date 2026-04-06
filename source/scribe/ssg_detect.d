/**
 * Static site generator discovery heuristics.
 * Detects SSG type and content vs non-content tree from repo layout.
 * Supports: Hugo, Jekyll, MkDocs, Docusaurus, Astro, Starlight, Antora, VitePress, 11ty, Next (static), MDX.
 */
module scribe.ssg_detect;

import std.algorithm : canFind, filter, map, sort, stripLeft, startsWith;
import std.array : array;
import std.file : dirEntries, isDir, isFile, SpanMode;
import std.path : baseName, extension, pathSeparator;
import std.string : format;

/// Known SSG types for UI and preview selection.
enum SsgKind {
	unknown,
	hugo,
	jekyll,
	mkdocs,
	docusaurus,
	astro,
	starlight,
	antora,
	vitepress,
	eleventy,
	nextStatic,
	mdxOnly,
}

/// One node in the discovered tree (file or directory).
struct SsgNode {
	string path;       /// Relative path from repo root
	string displayName;
	bool isContent;    /// true if editable content (md/mdx/adoc)
	bool isDir;
	SsgKind inferredFrom;
	SsgNode[] children; /// Direct children (for dirs)
}

/// Result of scanning a repo root.
struct SsgScan {
	SsgKind kind;
	string[] contentRoots;   /// e.g. ["content/", "src/content/docs/"]
	string[] configHints;    /// e.g. ["hugo.toml", "mkdocs.yml"]
	SsgNode[] contentTree;   /// Flattened content nodes for tree widget
	SsgNode[] otherTree;     /// Non-content (layouts, static, config) for separate tree
	string homepageHint;      /// From README or description, if discovered
}

/// File extensions we treat as content.
immutable string[] CONTENT_EXT = ["md", "mdx", "markdown", "adoc", "asciidoc"];

/// Config file patterns that identify an SSG.
static immutable string[][SsgKind] SSG_CONFIGS = [
	SsgKind.hugo: ["hugo.toml", "hugo.yaml", "hugo.yml", "config.toml", "config.yaml"],
	SsgKind.jekyll: ["_config.yml", "_config.yaml", "Gemfile"],
	SsgKind.mkdocs: ["mkdocs.yml", "mkdocs.yaml"],
	SsgKind.docusaurus: ["docusaurus.config.js", "docusaurus.config.ts"],
	SsgKind.astro: ["astro.config.mjs", "astro.config.mts", "astro.config.js", "astro.config.cjs"],
	SsgKind.starlight: ["astro.config.mjs", "astro.config.mts"], // + src/content/docs
	SsgKind.antora: ["antora.yml", "antora.yaml"],
	SsgKind.vitepress: ["docs/package.json", ".vitepress/config.mts", ".vitepress/config.js"],
	SsgKind.eleventy: ["eleventy.config.js", "eleventy.config.cjs", ".eleventy.js"],
	SsgKind.nextStatic: ["next.config.js", "next.config.mjs", "next.config.ts"],
];

/// Content directory patterns per SSG (relative to repo root).
static immutable string[][SsgKind] SSG_CONTENT_DIRS = [
	SsgKind.hugo: ["content"],
	SsgKind.jekyll: ["_posts", "_drafts", "_pages", ""], // root for _config
	SsgKind.mkdocs: ["docs"],
	SsgKind.docusaurus: ["docs", "blog", "src/pages"],
	SsgKind.astro: ["src/pages", "content", "src/content/docs"],
	SsgKind.starlight: ["src/content/docs", "src/content/config"],
	SsgKind.antora: ["modules"], // antora: modules/*/pages, examples, etc.
	SsgKind.vitepress: ["docs"],
	SsgKind.eleventy: ["src", "input", "content", "pages", ""],
	SsgKind.nextStatic: ["pages", "src/pages", "app", "src/app", "content"],
	SsgKind.mdxOnly: ["docs", "content", "src/content", "pages"],
];

/** Detect SSG and build content/other trees from repo path (local filesystem). */
SsgScan scanRepo(string repoRoot) {
	SsgScan scan;
	scan.kind = SsgKind.unknown;

	string[] files;
	string[] dirs;
	foreach (e; dirEntries(repoRoot, SpanMode.shallow)) {
		string n = baseName(e.name);
		if (n.length > 0 && n[0] == '.') continue; // skip .git etc.
		if (isDir(e.name)) dirs ~= n;
		else if (isFile(e.name)) files ~= n;
	}

	// Detect by config files
	foreach (kind, configs; SSG_CONFIGS) {
		foreach (c; configs) {
			if (files.canFind(c)) {
				scan.kind = kind;
				scan.configHints ~= c;
				break;
			}
		}
		if (scan.kind != SsgKind.unknown) break;
	}

	// Starlight: astro + src/content/docs
	if (scan.kind == SsgKind.astro && dirs.canFind("src")) {
		foreach (e; dirEntries(repoRoot ~ pathSeparator ~ "src", SpanMode.shallow)) {
			if (isDir(e.name) && baseName(e.name) == "content") {
				scan.kind = SsgKind.starlight;
				break;
			}
		}
	}

	// VitePress: .vitepress or docs/package.json
	if (scan.kind == SsgKind.unknown) {
		if (dirs.canFind("docs") || files.canFind("package.json")) {
			// Check docs/.vitepress or root .vitepress
			// Simplified: if we see docs/ and no other SSG, treat as possible vitepress/mdx
			scan.kind = SsgKind.mdxOnly;
			scan.contentRoots ~= "docs";
		}
	}

	// Resolve content roots
	if (scan.kind != SsgKind.unknown && (scan.kind in SSG_CONTENT_DIRS)) {
		foreach (d; SSG_CONTENT_DIRS[scan.kind]) {
			string full = d.length ? (repoRoot ~ pathSeparator ~ d) : repoRoot;
			if (full.length > 0 && isDir(full))
				scan.contentRoots ~= d;
		}
	}
	// Fallback: common content dirs
	if (scan.contentRoots.length == 0) {
		foreach (d; ["content", "docs", "src/content", "src/pages", "pages", "blog"]) {
			string full = repoRoot ~ pathSeparator ~ d;
			if (isDir(full)) { scan.contentRoots ~= d; scan.kind = SsgKind.mdxOnly; }
		}
	}

	// Build content and other trees
	scan.contentTree = buildTree(repoRoot, repoRoot, scan.contentRoots, true);
	scan.otherTree = buildTree(repoRoot, repoRoot, scan.contentRoots, false);
	return scan;
}

private SsgNode[] buildTree(string repoRoot, string currentPath, string[] contentRoots, bool contentOnly) {
	SsgNode[] result;
	string rel = currentPath.length >= repoRoot.length ? currentPath[repoRoot.length .. $] : "";
	while (rel.length > 0 && rel.startsWith(pathSeparator))
		rel = rel[pathSeparator.length .. $];

	bool isContentDir(string p) {
		foreach (root; contentRoots) {
			if (root.length == 0) return true;
			if (p == root || p.startsWith(root ~ pathSeparator)) return true;
			if (root.startsWith(p ~ pathSeparator)) return true; // e.g. p="src", root="src/content/docs"
		}
		return false;
	}

	foreach (e; dirEntries(currentPath, SpanMode.shallow)) {
		string name = baseName(e.name);
		if (name.length > 0 && name[0] == '.') continue;
		string childRel = rel.length ? (rel ~ pathSeparator ~ name) : name;
		bool contentFile = false;
		if (isFile(e.name)) {
			string ext = extension(name).stripLeft('.');
			contentFile = canFind(CONTENT_EXT, ext);
		}
		bool contentDir = isDir(e.name) && isContentDir(childRel);
		bool include = contentOnly ? (contentFile || contentDir) : (!contentFile && !contentDir);
		if (!include) continue;

		SsgNode n;
		n.path = childRel;
		n.displayName = name;
		n.isDir = isDir(e.name);
		n.isContent = contentFile;
		n.inferredFrom = SsgKind.unknown;
		if (n.isDir) {
			n.children = buildTree(repoRoot, e.name, contentRoots, contentOnly);
		}
		result ~= n;
	}
	return result.sort!((a, b) => a.displayName < b.displayName).array;
}

/// Placeholder for later: parse README for homepage URL.
string extractHomepageFromReadme(string readmePath) {
	// TODO: simple regex or line scan for first http URL
	return null;
}
