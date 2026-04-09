import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export interface GhRepo {
  owner: string;
  repo: string;
  host: string;
  valid: boolean;
  description?: string;
  homepage?: string;
}

export interface AuthStatus {
  authenticated: boolean;
  username?: string;
  error?: string;
}

export function parseRepoUrl(url: string): GhRepo {
  const result: GhRepo = { owner: '', repo: '', host: 'github.com', valid: false };
  url = url.trim();
  
  const m1 = url.match(/https?:\/\/([^/]+)\/([^/]+)\/([^/?#]+)/);
  if (m1) {
    result.host = m1[1];
    result.owner = m1[2];
    result.repo = m1[3].replace(/\.git$/, '');
    result.valid = true;
    return result;
  }
  
  const m2 = url.match(/git@([^:]+):([^/]+)\/([^/]+)/);
  if (m2) {
    result.host = m2[1];
    result.owner = m2[2];
    result.repo = m2[3].replace(/\.git$/, '');
    result.valid = true;
    return result;
  }
  
  const m3 = url.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (m3) {
    result.owner = m3[1];
    result.repo = m3[2];
    result.valid = true;
    return result;
  }
  
  return result;
}

export async function cloneRepo(repo: GhRepo, cloneDir: string): Promise<{ success: boolean, localPath?: string }> {
  try {
    const localPath = path.join(cloneDir, `${repo.owner}-${repo.repo}`);
    await fs.mkdir(cloneDir, { recursive: true });
    
    // Check if already cloned
    try {
      const stats = await fs.stat(localPath);
      if (stats.isDirectory()) {
         return { success: true, localPath }; // already there
      }
    } catch (e) {
      // not exists, proceed to clone
    }

    try {
      await execAsync(`gh repo clone ${repo.owner}/${repo.repo} "${localPath}"`);
      return { success: true, localPath };
    } catch {
      // Fallback
      await execAsync(`git clone https://github.com/${repo.owner}/${repo.repo}.git "${localPath}"`);
      return { success: true, localPath };
    }
  } catch (error) {
    console.error('Clone error:', error);
    return { success: false };
  }
}

export async function hasUncommittedChanges(repoRoot: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`git -C "${repoRoot}" status --porcelain`);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export async function commitAndPush(repoRoot: string, message: string): Promise<boolean> {
  try {
    await execAsync(`git -C "${repoRoot}" add -A`);
    await execAsync(`git -C "${repoRoot}" commit -m "${message}"`);
    await execAsync(`git -C "${repoRoot}" push`);
    return true;
  } catch (error) {
    return false;
  }
}

export async function checkAuth(providerId: string): Promise<AuthStatus> {
  try {
    if (providerId === 'github') {
      const { stdout } = await execAsync('gh api user --jq ".login"');
      const username = stdout.trim();
      return username.length > 0 ? { authenticated: true, username } : { authenticated: false };
    }
    if (providerId === 'gitlab') {
      const { stdout } = await execAsync('glab api user --jq ".username"');
      const username = stdout.trim();
      return username.length > 0 ? { authenticated: true, username } : { authenticated: false };
    }
    return { authenticated: false };
  } catch (error: any) {
    return { authenticated: false, error: error.message };
  }
}

export async function logout(providerId: string): Promise<boolean> {
  try {
    if (providerId === 'github') {
      await execAsync('gh auth logout -h github.com --yes');
      return true;
    }
    if (providerId === 'gitlab') {
      // glab doesn't have a direct "--yes" logout, but we can clear config
      await execAsync('glab auth logout');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function getRepoMeta(repo: GhRepo): Promise<{ description?: string, homepage?: string }> {
  try {
    const { stdout } = await execAsync(`gh api repos/${repo.owner}/${repo.repo} --jq "{description: .description, homepage: .homepage}"`);
    const meta = JSON.parse(stdout);
    return {
      description: meta.description === null || meta.description === "" ? undefined : meta.description,
      homepage: meta.homepage === null || meta.homepage === "" ? undefined : meta.homepage
    };
  } catch {
    return {};
  }
}
