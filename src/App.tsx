import { createSignal, createEffect, onMount, For, Show } from 'solid-js';
import * as Lucide from 'lucide-solid';
import { cn } from './lib/utils';
import { ScribeLogo } from './components/ScribeLogo';

// Config & Components
import { MARKUP_CONFIG } from './config/markup';
import { ToolbarButton } from './components/ui/Button';
import { SettingsModal } from './features/settings/SettingsModal';
import { FileTreeNode } from './features/explorer/FileTree';
import { AuthDropdown } from './features/auth/AuthDropdown';
import { PreviewPane } from './features/simulator/PreviewPane';

// Safer IPC access for Electron environment
let ipcRenderer: any;
try {
  ipcRenderer = (window as any).require('electron').ipcRenderer;
} catch (e) {
  console.warn("IPC not available natively, using mock for development.");
  ipcRenderer = {
    invoke: async (channel: string, ...args: any[]) => {
      console.log(`[IPC Mock] ${channel}`, args);
      if (channel === 'setup:check-tools') return { git: true, gh: true, winget: true };
      if (channel === 'repo:check-auth') return { authenticated: true, username: 'scribe-dev' };
      if (channel === 'repo:list-profiles') return [{ id: 'github', name: 'GitHub', host: 'github.com' }];
      if (channel === 'setup:sample-repo') return 'C:/Users/mock/sample-content';
      return {};
    },
    on: () => {}
  };
}

export default function App() {
  const [repoPath, setRepoPath] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [toolStatus, setToolStatus] = createSignal({ git: true, gh: true, winget: true });
  const [profiles, setProfiles] = createSignal<any[]>([]);
  const [authStatuses, setAuthStatuses] = createSignal<Record<string, any>>({});
  const [ssgInfo, setSsgInfo] = createSignal<any>(null);
  const [fileTree, setFileTree] = createSignal<any[]>([]);
  const [currentFile, setCurrentFile] = createSignal<string | null>(null);
  const [previewUrl, setPreviewUrl] = createSignal<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = createSignal(true);
  const [authMenuOpen, setAuthMenuOpen] = createSignal(false);
  const [isCheckingAuth, setIsCheckingAuth] = createSignal(true);
  
  // Settings & Theme Signals
  const [settingsOpen, setSettingsOpen] = createSignal(false);
  const [theme, setTheme] = createSignal<'light' | 'dark' | 'auto'>('auto');
  const [autoSave, setAutoSave] = createSignal(true);

  // Theme Sync
  createEffect(() => {
    const root = document.documentElement;
    const isDark = theme() === 'dark' || (theme() === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('theme-light', !isDark);
    root.classList.toggle('theme-dark', isDark);
  });

  onMount(async () => {
    const tools = await ipcRenderer.invoke('setup:check-tools');
    setToolStatus(tools);
    const profs = await ipcRenderer.invoke('repo:list-profiles');
    setProfiles(profs);
    setIsCheckingAuth(true);
    const statuses: any = {};
    for (const p of profs) statuses[p.id] = await ipcRenderer.invoke('repo:check-auth', p.id);
    setAuthStatuses(statuses);
    setIsCheckingAuth(false);

    ipcRenderer.on('menu:open-settings', () => setSettingsOpen(true));
    ipcRenderer.on('menu:toggle-sidebar', () => setSidebarOpen(!sidebarOpen()));
    ipcRenderer.on('menu:open-sample', () => onOpenSample());
    ipcRenderer.on('menu:toggle-preview', () => { if (previewUrl()) setPreviewUrl(null); else (currentFile() && onOpenRepo()); });
  });

  const onLogout = async (id: string) => {
    const success = await ipcRenderer.invoke('repo:logout', id);
    if (success) {
      const status = await ipcRenderer.invoke('repo:check-auth', id);
      setAuthStatuses({ ...authStatuses(), [id]: status });
    }
  };

  const onConnect = async (id: string) => {
    await ipcRenderer.invoke('setup:auth-login', id);
    setTimeout(async () => {
      const status = await ipcRenderer.invoke('repo:check-auth', id);
      setAuthStatuses({ ...authStatuses(), [id]: status });
    }, 5000);
  };

  const onOpenSample = async () => {
    setLoading(true);
    const path = await ipcRenderer.invoke('setup:sample-repo');
    setRepoPath(path);
    await onOpenRepo(path);
  };

  const onOpenRepo = async (manualPath?: string) => {
    const activePath = manualPath || repoPath();
    if (!activePath) return;
    setLoading(true);
    try {
      const ssg = await ipcRenderer.invoke('ssg:detect', activePath);
      setSsgInfo(ssg);
      const tree = await ipcRenderer.invoke('fs:tree', activePath, ssg.contentRoots);
      setFileTree(tree || []);
      if (ssg.type !== 'Unknown') {
        const dev = await ipcRenderer.invoke('dev:start', activePath, ssg.type);
        setPreviewUrl(dev.url);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const getFileFormat = () => {
    const file = currentFile();
    if (!file) return 'md';
    const ext = file.split('.').pop()?.toLowerCase();
    if (ext === 'markdown' || ext === 'mdx') return 'md';
    if (ext === 'asciidoc') return 'adoc';
    if (ext === 'mediawiki') return 'wiki';
    if (MARKUP_CONFIG[ext || '']) return ext as string;
    return 'md';
  };

  const injectSnippet = (type: 'bold' | 'italic' | 'link' | 'code' | 'image') => {
    const format = getFileFormat();
    const config = MARKUP_CONFIG[format] || MARKUP_CONFIG.md;
    const textarea = document.querySelector('textarea');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.slice(start, end);

    let snippet = config[type](selectedText);
    textarea.setRangeText(snippet, start, end, 'select');
    textarea.focus();
  };

  return (
    <div class="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden selection:bg-primary/30 font-sans">
      <header class="h-14 border-b border-white/5 bg-secondary/50 backdrop-blur-xl flex items-center px-4 gap-4 flex-shrink-0 z-50">
        <ScribeLogo />
        <div class="flex-1 max-w-2xl relative">
          <Lucide.Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input 
            type="text" placeholder="Repository URL or Local Path" value={repoPath()}
            onInput={(e) => setRepoPath(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && onOpenRepo()}
            class="w-full bg-slate-800/40 hover:bg-slate-800/60 focus:bg-slate-900 border-white/5 border focus:border-primary/50 transition-all h-9 pl-10 pr-4 rounded-xl text-sm focus:outline-none placeholder:text-muted-foreground outline-none"
          />
        </div>
        <div class="flex items-center gap-3 relative">
          <button onClick={() => setAuthMenuOpen(!authMenuOpen())} class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/40 border border-white/5 hover:border-primary/30 transition-all active:scale-95 group">
             <Show when={isCheckingAuth()} fallback={<Lucide.User size={16} class="text-primary" />}><Lucide.Loader2 size={16} class="text-primary animate-spin" /></Show>
             <span class="text-[10px] font-bold uppercase tracking-widest text-slate-300">{isCheckingAuth() ? 'Verifying...' : 'Accounts'}</span>
             <Lucide.ChevronDown size={14} class={cn("text-slate-600 transition-transform", authMenuOpen() ? "rotate-180" : "")} />
          </button>
          <Show when={authMenuOpen()}><AuthDropdown profiles={profiles()} statuses={authStatuses()} onLogout={onLogout} onConnect={onConnect} /></Show>
          <Lucide.Settings onClick={() => setSettingsOpen(true)} size={18} class="text-muted-foreground hover:text-foreground cursor-pointer ml-2 transition-transform hover:rotate-90" />
        </div>
      </header>

      <main class="flex-1 flex overflow-hidden">
        <aside class={cn("border-r border-white/5 bg-secondary/10 flex flex-col transition-all duration-300 ease-in-out relative", sidebarOpen() ? "w-64" : "w-0 overflow-hidden")}>
          <div class="p-4 flex items-center justify-between"><h2 class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Explorer</h2><Lucide.Plus size={14} class="text-slate-700 hover:text-primary cursor-pointer" /></div>
          <div class="flex-1 overflow-y-auto px-2 space-y-0.5">
             <Show when={fileTree().length > 0} fallback={<div class="p-8 flex flex-col items-center justify-center gap-4 mt-10"><div class="text-xs text-muted-foreground text-center italic">No repository open</div><button onClick={onOpenSample} class="text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 px-4 py-2 rounded-xl transition-all">Try Sample Repo</button></div>}>
                <For each={fileTree()}>{(node) => <FileTreeNode node={node} onSelect={(p) => setCurrentFile(p)} active={currentFile() === node.path} level={0} />}</For>
             </Show>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen())} class="absolute -right-3 top-20 w-6 h-6 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center shadow-2xl z-40 hover:bg-slate-800">{sidebarOpen() ? <Lucide.ChevronLeft size={14} /> : <Lucide.ChevronRight size={14} />}</button>
        </aside>

        <div class="flex-1 flex flex-col min-w-0">
          <div class="h-10 border-b border-white/5 flex flex-col justify-center px-4 bg-slate-950/50 relative overflow-visible">
             <Show when={currentFile()} fallback={<div class="text-[10px] uppercase font-bold text-slate-700 tracking-widest">Workspace</div>}>
                <div class="flex items-center gap-2 overflow-hidden"><Lucide.FileText size={12} class="text-primary shrink-0" /><span class="text-[11px] font-medium truncate text-indigo-100">{currentFile()}</span></div>
             </Show>
          </div>
          
          <Show when={currentFile()}>
            <div class="h-9 border-b border-white/5 flex items-center px-4 bg-slate-950/30 gap-1">
               <ToolbarButton icon={<Lucide.Type size={12}/>} title={`Bold (${MARKUP_CONFIG[getFileFormat()]?.label})`} onClick={() => injectSnippet('bold')} />
               <ToolbarButton icon={<Lucide.Italic size={12}/>} title="Italic" onClick={() => injectSnippet('italic')} />
               <div class="w-px h-3 bg-white/5 mx-1" />
               <ToolbarButton icon={<Lucide.Link size={12}/>} title="Link" onClick={() => injectSnippet('link')} />
               <ToolbarButton icon={<Lucide.Code size={12}/>} title="Code" onClick={() => injectSnippet('code')} />
               <ToolbarButton icon={<Lucide.Image size={12}/>} title="Image" onClick={() => injectSnippet('image')} />
            </div>
          </Show>

          <div class="flex-1 flex overflow-hidden">
            <div class="flex-1 flex flex-col border-r border-white/5 bg-slate-950">
               <Show when={currentFile()} fallback={<div class="flex-1 flex flex-col items-center justify-center opacity-10"><Lucide.Shapes size={120} /></div>}>
                 <div class="flex-1 p-8 font-mono text-sm leading-relaxed overflow-y-auto">
                    <textarea class="w-full h-full bg-transparent outline-none resize-none text-slate-300 placeholder:text-slate-800" placeholder="Start drafting..." value={`# ${currentFile()?.split(/[/\\]/).pop()}\n\nContent segment for ${currentFile()}.`} />
                 </div>
               </Show>
               <div class="h-6 bg-slate-900/50 px-3 flex items-center justify-between text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                  <div class="flex items-center gap-4"><span class="flex items-center gap-1 text-primary/50"><Lucide.GitBranch size={10}/> main</span><span>UTF-8</span></div>
                  <div class="flex items-center gap-3"><Show when={ssgInfo()}><span class="text-primary">{MARKUP_CONFIG[getFileFormat()]?.label || 'Text'}</span></Show><span>{currentFile() ? 'Editing' : 'Standby'}</span></div>
               </div>
            </div>

            {/* Modular Preview Pane */}
            <PreviewPane 
              currentFile={currentFile()} 
              previewUrl={previewUrl()} 
              ssgInfo={ssgInfo()} 
              markupConfig={MARKUP_CONFIG}
              getFileFormat={getFileFormat}
              onOpenRepo={onOpenRepo}
            />
          </div>
        </div>
      </main>

      <Show when={settingsOpen()}><SettingsModal theme={theme()} setTheme={setTheme} autoSave={autoSave()} setAutoSave={setAutoSave} profiles={profiles()} authStatuses={authStatuses()} toolStatus={toolStatus()} onClose={() => setSettingsOpen(false)} /></Show>
    </div>
  );
}
