import { createSignal, Show, For, Switch, Match } from 'solid-js';
import * as Lucide from 'lucide-solid';
import { cn } from '../../lib/utils';
import { ThemeButton } from '../../components/ui/Button';
import { PreferenceToggle } from '../../components/ui/Toggle';

// Assume ipcRenderer is provided or globally available
declare const ipcRenderer: any;

export function SettingsModal(props: { 
  theme: string, 
  setTheme: (t: any) => void, 
  autoSave: boolean, 
  setAutoSave: (v: boolean) => void, 
  profiles: any[], 
  authStatuses: any, 
  toolStatus: any, 
  onClose: () => void 
}) {
   const [tab, setTab] = createSignal('general');
   return (
      <div class="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 text-slate-100">
         <div class="max-w-2xl w-full bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex h-[600px] animate-in zoom-in-95 duration-200">
            {/* Sidebar */}
            <div class="w-48 border-r border-white/5 bg-slate-950/50 p-6 flex flex-col gap-2">
               <h3 class="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Settings</h3>
               <button onClick={() => setTab('general')} class={cn("w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-all", tab() === 'general' ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-white/5")}>General</button>
               <button onClick={() => setTab('profiles')} class={cn("w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-all", tab() === 'profiles' ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-white/5")}>Profiles</button>
               <button onClick={() => setTab('tools')} class={cn("w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-all", tab() === 'tools' ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-white/5")}>Tools</button>
            </div>
            
            {/* Content */}
            <div class="flex-1 flex flex-col">
               <div class="p-8 flex-1 overflow-y-auto">
                  <Switch>
                     <Match when={tab() === 'general'}>
                        <h2 class="text-xl font-bold mb-6">General Preferences</h2>
                        <div class="space-y-8">
                           <div>
                              <div class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Theme System</div>
                              <div class="flex p-1 bg-slate-950 rounded-2xl gap-1">
                                 <ThemeButton active={props.theme === 'light'} label="Light" onClick={() => props.setTheme('light')} />
                                 <ThemeButton active={props.theme === 'dark'} label="Dark" onClick={() => props.setTheme('dark')} />
                                 <ThemeButton active={props.theme === 'auto'} label="Auto" onClick={() => props.setTheme('auto')} />
                              </div>
                           </div>
                           <PreferenceToggle label="Auto-save Drafts" description="Persist unsaved changes to local cache" active={props.autoSave} onToggle={() => props.setAutoSave(!props.autoSave)} />
                        </div>
                     </Match>
                     <Match when={tab() === 'profiles'}>
                        <div class="flex items-center justify-between mb-6">
                           <h2 class="text-xl font-bold">VCS Profiles</h2>
                           <button class="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase rounded-lg">Add New</button>
                        </div>
                        <div class="space-y-4">
                           <For each={props.profiles}>
                              {(p) => {
                                 const status = props.authStatuses[p.id] || { authenticated: false };
                                 return (
                                    <div class="p-4 bg-slate-800/40 border border-white/5 rounded-2xl flex items-center justify-between group">
                                       <div>
                                          <div class="text-sm font-bold flex items-center gap-2">
                                             {p.name}
                                             <div class={cn("px-1.5 py-[1px] rounded-[4px] text-[8px] font-black uppercase", status.authenticated ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-700 text-slate-500")}>
                                                {status.authenticated ? 'Connected' : 'Offline'}
                                             </div>
                                          </div>
                                          <div class="text-[10px] text-slate-500">{p.host}</div>
                                       </div>
                                       <Lucide.ChevronRight size={14} class="text-slate-700 group-hover:text-primary transition-all" />
                                    </div>
                                 );
                              }}
                           </For>
                        </div>
                     </Match>
                     <Match when={tab() === 'tools'}>
                        <h2 class="text-xl font-bold mb-6">System Toolkit</h2>
                        <div class="space-y-3">
                           <ToolStatusItem label="Git Engine" installed={props.toolStatus.git} id="Git.Git" />
                           <ToolStatusItem label="GitHub CLI" installed={props.toolStatus.gh} id="GitHub.cli" />
                        </div>
                     </Match>
                  </Switch>
               </div>
               <div class="p-6 border-t border-white/5 bg-slate-950/50 flex justify-end">
                  <button onClick={props.onClose} class="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl">Close</button>
               </div>
            </div>
         </div>
      </div>
   );
}

function ToolStatusItem(props: { label: string, installed: boolean, id: string }) {
  const [working, setWorking] = createSignal(false);
  const [path, setPath] = createSignal<string | null>(null);
  
  // Use window.ipcRenderer for modularity
  const _ipc = (window as any).require ? (window as any).require('electron').ipcRenderer : { invoke: async () => 'Mock Path' };

  const handleShowPath = async () => setPath(await _ipc.invoke('setup:get-tool-path', props.label.toLowerCase().includes('git engine') ? 'git' : 'gh'));
  const handleInstall = async () => { setWorking(true); await _ipc.invoke('setup:install-tool', props.id); setWorking(false); };
  
  return (
    <div class="p-4 bg-slate-800/40 rounded-xl border border-white/5">
      <div class="flex items-center justify-between mb-1">
         <div class="flex items-center gap-4">
            <Show when={props.installed} fallback={<Lucide.AlertTriangle size={18} class="text-slate-600" />}>
               <Lucide.CheckCircle2 size={18} class="text-emerald-500" />
            </Show>
            <span class="text-sm font-bold tracking-tight cursor-help hover:text-primary transition-colors" onClick={handleShowPath}>{props.label}</span>
         </div>
         <Show when={!props.installed}>
            <button onClick={handleInstall} disabled={working()} class="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 bg-primary/10 text-primary border border-primary/30 rounded-full hover:bg-primary transition-all disabled:opacity-30">{working() ? '...' : 'Install'}</button>
         </Show>
      </div>
      <Show when={path()}>
         <div class="pl-8 text-[9px] font-mono text-slate-600 truncate">{path()}</div>
      </Show>
    </div>
  );
}
