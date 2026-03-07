/**
 * Simplified page structure (nav) for SSGs. Build from content tree and write
 * config on the user's behalf so they don't edit YAML/TOML by hand.
 */
module syndrome.ssg_config;

import syndrome.ssg_detect;
import std.algorithm : canFind, startsWith;
import std.file : readText, write, exists, isFile;
import std.path : pathSeparator;
import std.regex : regex, matchFirst, replaceFirst;
import std.string : format, replace;

/// One nav entry: either a leaf (label -> path) or a section (label -> children).
struct NavEntry {
	string label;
	string path;        /// For leaves: content path. Empty for sections.
	NavEntry[] children; /// For sections. Empty for leaves.
	bool isSection() const { return children.length > 0; }
}

/// Build a default nav from the content tree (display order = file system order).
NavEntry[] buildDefaultNav(const SsgNode[] nodes) {
	NavEntry[] result;
	foreach (n; nodes) {
		NavEntry e;
		e.label = n.displayName;
		e.path = n.path;
		if (n.isDir) {
			e.children = buildDefaultNav(n.children);
			e.path = null; // section
		}
		result ~= e;
	}
	return result;
}

/// Get the config file path for nav (e.g. mkdocs.yml). Returns null if not supported.
string getNavConfigPath(SsgKind kind, string repoRoot) {
	string[] candidates;
	switch (kind) {
		case SsgKind.mkdocs: candidates = ["mkdocs.yml", "mkdocs.yaml"]; break;
		case SsgKind.vitepress: candidates = ["docs/.vitepress/config.mts", "docs/.vitepress/config.js", ".vitepress/config.mts"]; break;
		default: return null;
	}
	foreach (c; candidates) {
		string p = repoRoot ~ pathSeparator ~ c;
		if (exists(p) && isFile(p)) return p;
	}
	// MkDocs: create mkdocs.yml if missing
	if (kind == SsgKind.mkdocs) return repoRoot ~ pathSeparator ~ "mkdocs.yml";
	return null;
}

/// Write MkDocs nav block (YAML). Preserves rest of file if present; else creates minimal file.
bool writeMkDocsNav(string repoRoot, const NavEntry[] nav) {
	string path = repoRoot ~ pathSeparator ~ "mkdocs.yml";
	string content;
	if (exists(path) && isFile(path))
		content = readText(path);
	else
		content = "site_name: Site\n";

	// Generate nav YAML (indent 2 spaces for top-level list)
	string navBlock = "nav:\n" ~ navToMkDocsYaml(nav, 2);
	// Replace or append nav
	auto navRegex = regex(r"\n?nav\s*:\s*\n(?:(?:  [ \t].*\n)*)?");
	if (matchFirst(content, navRegex))
		content = replaceFirst(content, navRegex, "\n" ~ navBlock);
	else
		content ~= "\n" ~ navBlock;
	write(path, content);
	return true;
}

private string navToMkDocsYaml(const NavEntry[] entries, int indent) {
	string result;
	string pad = repeat(" ", indent);
	foreach (e; entries) {
		if (e.isSection()) {
			// "Label:\n  - item1\n  - item2"
			result ~= pad ~ "- " ~ escapeYamlStr(e.label) ~ ":\n";
			result ~= navToMkDocsYaml(e.children, indent + 2);
		} else {
			result ~= pad ~ "- " ~ escapeYamlStr(e.label) ~ ": " ~ escapeYamlStr(e.path) ~ "\n";
		}
	}
	return result;
}

private string escapeYamlStr(string s) {
	if (s.length == 0) return "''";
	// If contains special chars, quote
	bool needQuote = s.canFind(':') || s.canFind('#') || s.canFind('\n') || s.canFind('"') || s.startsWith(" ");
	if (needQuote) return "\"" ~ replace(s, "\"", "\\\"") ~ "\"";
	return s;
}

private string repeat(string s, int n) {
	string r;
	foreach (i; 0 .. n) r ~= s;
	return r;
}

/// Apply default nav to the repo's SSG config. Returns true if updated.
bool applyDefaultNavToConfig(string repoRoot, SsgKind kind, const NavEntry[] nav) {
	string path = getNavConfigPath(kind, repoRoot);
	if (path is null) return false;
	switch (kind) {
		case SsgKind.mkdocs: return writeMkDocsNav(repoRoot, nav);
		default: return false;
	}
}
