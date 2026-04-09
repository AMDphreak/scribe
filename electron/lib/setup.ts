import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export interface ToolStatus {
  git: boolean;
  gh: boolean;
  winget: boolean;
}

export async function checkTools(): Promise<ToolStatus> {
  const status: ToolStatus = { git: false, gh: false, winget: false };
  
  try {
    const { stdout } = await execAsync('git --version');
    status.git = stdout.includes('git version');
  } catch {}
  
  try {
    await execAsync('gh --version');
    status.gh = true;
  } catch {}
  
  try {
    await execAsync('winget --version');
    status.winget = true;
  } catch {}
  
  return status;
}

export async function getToolPath(cmd: string): Promise<string> {
  try {
    const { stdout } = await execAsync(process.platform === 'win32' ? `where.exe ${cmd}` : `which ${cmd}`);
    return stdout.trim().split('\n')[0];
  } catch {
    return 'Not found in PATH';
  }
}

export async function installTool(id: 'Git.Git' | 'GitHub.cli'): Promise<boolean> {
  try {
    await execAsync(`winget install --id ${id} --accept-package-agreements --accept-source-agreements`);
    return true;
  } catch (error) {
    console.error(`Installation error for ${id}:`, error);
    return false;
  }
}

export async function createSampleRepo(rootDir: string): Promise<string> {
  const samplePath = path.join(rootDir, 'sample-content');
  try {
    await fs.mkdir(samplePath, { recursive: true });
    
    // Create initial content
    await fs.writeFile(path.join(samplePath, 'index.md'), '# Welcome to Scribe\n\nThis is a sample repository to help you get started with **Modern Technical Writing**.\n\n## Features\n- Live Responsive Preview\n- Multi-provider Auth\n- Advanced Settings');
    await fs.writeFile(path.join(samplePath, 'features.adoc'), '= Advanced Features\n:toc:\n\n== Real-time Simulation\n\nScribe allows you to preview your content in a responsive canvas.\n\n== Toolchain Integration\n\nGit and GitHub CLI are first-class citizens here.');
    
    // Initialize git repo if not exists
    try {
       await execAsync('git init', { cwd: samplePath });
    } catch {}
    
    return samplePath;
  } catch (err) {
    console.error('Error creating sample repo:', err);
    throw err;
  }
}
