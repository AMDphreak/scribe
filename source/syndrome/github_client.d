/**
 * GitHub URL parsing, auth status, clone, and repo metadata (description/homepage).
 * Uses `gh` CLI when available for auth and API; falls back to git + token for clone.
 */
module syndrome.github_client;

import std.process : spawnProcess, wait, pipeProcess, Redirect;
import std.stdio : readln;
import std.string : strip;
import std.regex : regex, matchFirst, replace;

/// Parsed GitHub repo identifier.
struct GhRepo {
	string owner;
	string repo;
	string host; /// "github.com" or custom
	bool valid;
}

/// Result of checking clone/auth.
enum AuthStatus {
	notAuthenticated,
	authenticated,
	noGhCli,
}

/// Parse GitHub URL or "owner/repo" into GhRepo.
GhRepo parseRepoUrl(string url) {
	GhRepo r;
	r.valid = false;
	url = url.strip();
	// Match https://github.com/owner/repo or git@github.com:owner/repo or owner/repo
	auto m = matchFirst(url, regex(r"https?://([^/]+)/([^/]+)/([^/?#]+)"));
	if (m) {
		r.host = m.captures[1];
		r.owner = m.captures[2];
		r.repo = replace(m.captures[3], regex(r"\.git$"), "");
		r.valid = true;
		return r;
	}
	m = matchFirst(url, regex(r"git@([^:]+):([^/]+)/([^/]+)"));
	if (m) {
		r.host = m.captures[1];
		r.owner = m.captures[2];
		r.repo = replace(m.captures[3], regex(r"\.git$"), "");
		r.valid = true;
		return r;
	}
	m = matchFirst(url, regex(r"^([a-zA-Z0-9_.-]+)/([a-zA-Z0-9_.-]+)$"));
	if (m) {
		r.host = "github.com";
		r.owner = m.captures[1];
		r.repo = m.captures[2];
		r.valid = true;
		return r;
	}
	return r;
}

/// Check if gh is logged in. Returns status and optional username.
AuthStatus checkGhAuth(out string username) {
	username = null;
	try {
		auto pipes = pipeProcess(["gh", "api", "user", "--jq", ".login"], Redirect.stdout);
		auto exitCode = wait(pipes.pid);
		if (exitCode != 0) return AuthStatus.notAuthenticated;
		username = pipes.stdout.readln().strip();
		if (username.length > 0) return AuthStatus.authenticated;
		return AuthStatus.notAuthenticated;
	} catch (Exception) {
		return AuthStatus.noGhCli;
	}
}

/// Clone repo via gh repo clone or git clone. cloneDir = parent directory; repo will be cloned to cloneDir/owner-repo.
bool cloneRepo(GhRepo repo, string cloneDir, out string localPath) {
	import std.path : pathSeparator;
	import std.file : exists, isDir, mkdir;
	localPath = cloneDir ~ pathSeparator ~ repo.owner ~ "-" ~ repo.repo;
	if (!exists(cloneDir)) mkdir(cloneDir);
	try {
		auto proc = spawnProcess(["gh", "repo", "clone", repo.owner ~ "/" ~ repo.repo, localPath]);
		auto code = wait(proc);
		return code == 0;
	} catch (Exception) {
		// Fallback: git clone (requires token in URL or credential helper)
		try {
			auto proc = spawnProcess(["git", "clone", "https://github.com/" ~ repo.owner ~ "/" ~ repo.repo ~ ".git", localPath]);
			return wait(proc) == 0;
		} catch (Exception) {
			return false;
		}
	}
}

/// Fetch repo description and homepage from GitHub API (gh api).
void getRepoMeta(GhRepo repo, out string description, out string homepage) {
	description = null;
	homepage = null;
	try {
		auto pipesD = pipeProcess(["gh", "api", "repos/" ~ repo.owner ~ "/" ~ repo.repo, "--jq", ".description"], Redirect.stdout);
		wait(pipesD.pid);
		description = pipesD.stdout.readln().strip();
		if (description == "null" || description == "\"\"") description = null;
		auto pipesH = pipeProcess(["gh", "api", "repos/" ~ repo.owner ~ "/" ~ repo.repo, "--jq", ".homepage"], Redirect.stdout);
		wait(pipesH.pid);
		homepage = pipesH.stdout.readln().strip();
		if (homepage == "null" || homepage == "\"\"") homepage = null;
	} catch (Exception) {
	}
}
