import { For, Show } from 'solid-js';
import { cn } from '../../lib/utils';

export function AuthDropdown(props: { 
  profiles: any[], 
  statuses: any, 
  onLogout: (id: string) => void, 
  onConnect: (id: string) => void 
}) {
   return (
      <div class="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[60] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
         <For each={props.profiles}>
            {(p) => { 
               const status = props.statuses[p.id] || { authenticated: false }; 
               return (
                  <div class="px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                     <div class="flex items-center justify-between mb-1">
                        <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">{p.name}</span>
                        <Show when={status.authenticated}>
                           <button 
                              onClick={() => props.onLogout(p.id)} 
                              class="text-[9px] font-bold text-rose-500 hover:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded uppercase"
                           >
                              Logout
                           </button>
                        </Show>
                     </div>
                     <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                           <div class={cn("w-1.5 h-1.5 rounded-full", status.authenticated ? "bg-emerald-500" : "bg-slate-700")} />
                           <span class="text-xs font-medium text-slate-200">{status.authenticated ? status.username : 'Not connected'}</span>
                        </div>
                        <Show when={!status.authenticated}>
                           <button 
                              onClick={() => props.onConnect(p.id)} 
                              class="text-[10px] font-bold text-primary hover:underline"
                           >
                              Connect
                           </button>
                        </Show>
                     </div>
                  </div>
               ); 
            }}
         </For>
      </div>
   );
}
