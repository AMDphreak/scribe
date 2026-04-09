import { spawn, ChildProcess } from 'child_process';

let activeServer: ChildProcess | null = null;
let watcher: ChildProcess | null = null;

export async function startDevServer(repoRoot: string, ssgType: string): Promise<{ url: string }> {
  stopDevServer(); // Kill existing

  return new Promise((resolve, _reject) => {
    if (ssgType === 'Antora') {
      // Simulate an Antora pipeline + browser-sync for non-refresh injection
      // In reality, you'd execute: npx browser-sync start --server build/site --files "build/site"
      // And a separate process: npx onchange "**/*.adoc" -- npx antora generate local-playbook.yml
      const bsPort = 3000;
      activeServer = spawn('npx', ['browser-sync', 'start', '--server', 'site/dist/docs', '--files', 'site/dist/docs', '--port', bsPort.toString()], { cwd: repoRoot, shell: true });
      
      // We would also spawn chokidar/onchange here to re-run antora.
      watcher = spawn('npx', ['onchange', '**/*.adoc', '--', 'npx', 'antora', '--fetch', 'antora-playbook.yml'], { cwd: repoRoot, shell: true });

      // Resolve early for demo
      setTimeout(() => resolve({ url: `http://localhost:${bsPort}` }), 1500);
      
    } else if (ssgType === 'Astro' || ssgType === 'Next.js' || ssgType === 'Nuxt') {
      // Modern SSGs have robust dev servers
      activeServer = spawn('npm', ['run', 'dev'], { cwd: repoRoot, shell: true });
      setTimeout(() => resolve({ url: `http://localhost:3000` }), 2500);
    } else {
      // Fallback
      resolve({ url: 'about:blank' });
    }
  });
}

export function stopDevServer() {
  if (activeServer) activeServer.kill();
  if (watcher) watcher.kill();
  activeServer = null;
  watcher = null;
}
