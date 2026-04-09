import fs from 'fs/promises';
import path from 'path';

export type SsgKind = 
  | 'Hugo' | 'Jekyll' | 'MkDocs' | 'Docusaurus' | 'Astro' 
  | 'Starlight' | 'Antora' | 'VitePress' | 'Eleventy' 
  | 'Next.js' | 'MDX' | 'Unknown';

export interface SsgInfo {
  type: SsgKind;
  contentRoots: string[];
  configHints: string[];
}

export interface NavEntry {
  label: string;
  path?: string;
  children?: NavEntry[];
}

export interface SsgNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  isContent: boolean;
  children?: SsgNode[];
}

const SSG_CONFIGS: Record<string, string[]> = {
  Hugo: ["hugo.toml", "hugo.yaml", "hugo.yml", "config.toml", "config.yaml"],
  Jekyll: ["_config.yml", "_config.yaml", "Gemfile"],
  MkDocs: ["mkdocs.yml", "mkdocs.yaml"],
  Docusaurus: ["docusaurus.config.js", "docusaurus.config.ts"],
  Astro: ["astro.config.mjs", "astro.config.mts", "astro.config.js", "astro.config.cjs"],
  Antora: ["antora.yml", "antora.yaml", "antora-playbook.yml"],
  Eleventy: ["eleventy.config.js", "eleventy.config.cjs", ".eleventy.js"],
  'Next.js': ["next.config.js", "next.config.mjs", "next.config.ts"],
};

const SSG_CONTENT_DIRS: Record<string, string[]> = {
  Hugo: ["content"],
  Jekyll: ["_posts", "_drafts", "_pages", ""],
  MkDocs: ["docs"],
  Docusaurus: ["docs", "blog", "src/pages"],
  Astro: ["src/pages", "content", "src/content/docs"],
  Starlight: ["src/content/docs", "src/content/config"],
  Antora: ["modules", "docs/modules"],
  VitePress: ["docs"],
  Eleventy: ["src", "input", "content", "pages", ""],
  'Next.js': ["pages", "src/pages", "app", "src/app", "content"],
  MDX: ["docs", "content", "src/content", "pages"],
};

export async function detectSsg(repoRoot: string): Promise<SsgInfo> {
  const files = await fs.readdir(repoRoot);
  let type: SsgKind = 'Unknown';
  let configHints: string[] = [];

  // 1. Detect by config files
  outer: for (const [kind, configs] of Object.entries(SSG_CONFIGS)) {
    for (const config of configs) {
      if (files.includes(config)) {
        type = kind as SsgKind;
        configHints.push(config);
        break outer;
      }
    }
  }

  // 2. Special cases (Starlight context)
  if (type === 'Astro') {
    try {
      await fs.access(path.join(repoRoot, 'src/content/docs'));
      type = 'Starlight';
    } catch {}
  }

  // 3. Fallback to common dirs
  if (type === 'Unknown') {
     if (files.includes('.vitepress') || (files.includes('docs') && (await fs.readdir(path.join(repoRoot, 'docs'))).includes('.vitepress'))) {
       type = 'VitePress' as any;
     }
  }

  const contentRoots: string[] = [];
  const rootsToTry = SSG_CONTENT_DIRS[type] || ["content", "docs", "src/content", "src/pages", "pages", "blog"];
  
  for (const dir of rootsToTry) {
    try {
      const fullPath = dir === "" ? repoRoot : path.join(repoRoot, dir);
      await fs.access(fullPath);
      contentRoots.push(dir);
      if (type === 'Unknown') type = 'MDX';
    } catch {}
  }

  return { type, contentRoots, configHints };
}

const CONTENT_EXT = ['.md', '.mdx', '.adoc', '.asciidoc', '.txt'];

export async function getFileTree(dir: string, contentRoots: string[], baseDir: string = dir): Promise<SsgNode[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nodes: SsgNode[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;

    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);
    
    // Check if this path is within any content root
    const isUnderContentRoot = contentRoots.some(root => 
      relPath === root || relPath.startsWith(root + path.sep) || root.startsWith(relPath + path.sep)
    );

    if (entry.isDirectory()) {
      const children = await getFileTree(fullPath, contentRoots, baseDir);
      if (children.length > 0 || isUnderContentRoot) {
        nodes.push({
          name: entry.name,
          path: relPath,
          type: 'directory',
          isContent: false,
          children
        });
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      const isContent = CONTENT_EXT.includes(ext);
      if (isContent || !isUnderContentRoot) {
         // In a content-focused view, we might filter non-content files
         // but for now let's include them if they're in a content root
         nodes.push({
           name: entry.name,
           path: relPath,
           type: 'file',
           isContent: isContent
         });
      }
    }
  }

  return nodes.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'directory' ? -1 : 1;
  });
}

export function buildNavFromTree(nodes: SsgNode[]): NavEntry[] {
  return nodes.map(n => ({
    label: n.name,
    path: n.type === 'file' ? n.path : undefined,
    children: n.children ? buildNavFromTree(n.children) : undefined
  }));
}

export async function writeSsgConfig(repoRoot: string, type: SsgKind, nav: NavEntry[]): Promise<boolean> {
  if (type !== 'MkDocs') return false; // Currently only MkDocs supported for auto-nav

  const configPath = path.join(repoRoot, 'mkdocs.yml');
  let content = '';
  try {
    content = await fs.readFile(configPath, 'utf-8');
  } catch {
    content = 'site_name: My Scribe Site\n';
  }

  const navYaml = 'nav:\n' + navToYaml(nav, 2);
  const navRegex = /\n?nav\s*:\s*\n(?:(?:  [ \t].*\n)*)?/;
  
  if (navRegex.test(content)) {
    content = content.replace(navRegex, '\n' + navYaml);
  } else {
    content += '\n' + navYaml;
  }

  await fs.writeFile(configPath, content);
  return true;
}

function navToYaml(entries: NavEntry[], indent: number): string {
  let result = '';
  const pad = ' '.repeat(indent);
  for (const e of entries) {
    if (e.children && e.children.length > 0) {
      result += `${pad}- "${e.label.replace(/"/g, '\\"')}":\n`;
      result += navToYaml(e.children, indent + 2);
    } else {
      result += `${pad}- "${e.label.replace(/"/g, '\\"')}": "${(e.path || '').replace(/"/g, '\\"')}"\n`;
    }
  }
  return result;
}
