import { createSignal, createEffect, For, Show } from 'solid-js';
import * as Lucide from 'lucide-solid';
import { cn } from '../../lib/utils';
import { ToolbarButton, ViewerProvisionButton } from '../../components/ui/Button';

export function PreviewPane(props: {
  currentFile: string | null;
  previewUrl: string | null;
  ssgInfo: any;
  markupConfig: any;
  getFileFormat: () => string;
  onOpenRepo: () => void;
}) {
  const [simWidth, setSimWidth] = createSignal(1200);
  const [previewScale, setPreviewScale] = createSignal(1);
  const [selectedViewer, setSelectedViewer] = createSignal<any>(null);
  let previewPaneRef: HTMLDivElement | undefined;

  // Clear selected viewer when file changes
  createEffect(() => { props.currentFile; setSelectedViewer(null); });

  // Scale Listener
  createEffect(() => {
    if (!previewPaneRef) return;
    const observer = new ResizeObserver(() => {
      const containerWidth = previewPaneRef!.clientWidth - 80;
      if (simWidth() > containerWidth) setPreviewScale(containerWidth / simWidth());
      else setPreviewScale(1);
    });
    observer.observe(previewPaneRef);
    return () => observer.disconnect();
  });

  const getFormatLabel = () => props.markupConfig[props.getFileFormat()]?.label || 'Text';

  return (
    <div ref={previewPaneRef} class="flex-1 bg-secondary/20 flex flex-col relative shadow-[-10px_0_30px_rgba(0,0,0,0.4)] overflow-auto p-10">
      {/* Top Slider Bar */}
      <div class="absolute top-0 left-0 right-0 h-10 bg-secondary/80 border-b border-white/5 backdrop-blur-md flex items-center px-6 gap-6 z-40">
        <div class="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">Page Width</div>
        <input 
          type="range" min="320" max="2560" value={simWidth()} 
          onInput={(e) => setSimWidth(parseInt(e.currentTarget.value))} 
          class="flex-1 accent-primary h-1 bg-slate-800 rounded-full appearance-none cursor-pointer" 
        />
        <div class="text-[10px] font-bold text-slate-500 w-16 text-right tabular-nums">{simWidth()}px</div>
        <div class="h-4 w-px bg-white/10 mx-2" />
        <div class="flex items-center gap-1">
           <Show when={props.previewUrl}>
              <For each={props.markupConfig[props.getFileFormat()]?.viewers || []}>
                 {(v:any) => <ToolbarButton icon={v.icon} title={v.label} onClick={() => props.onOpenRepo()} />}
              </For>
           </Show>
        </div>
      </div>

      <Show when={props.previewUrl} fallback={
        <div class="flex-1 flex flex-col items-center justify-start pt-20 gap-8">
          <Show when={props.currentFile} fallback={
             <div class="flex flex-col items-center text-slate-500 gap-4 mt-20">
                <Lucide.Monitor size={48} class="opacity-10" />
                <p class="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40">Select a file to preview</p>
             </div>
          }>
             <Lucide.Cpu size={48} class="text-primary/20 animate-pulse" />
             <div class="text-center">
                <h3 class="text-2xl font-black tracking-tight mb-2">Install Preview Engines</h3>
                <p class="text-xs text-muted-foreground uppercase tracking-widest">Available for {getFormatLabel()}</p>
             </div>

             <div class="w-full max-w-2xl flex flex-col gap-6">
                <div class="grid grid-cols-2 gap-4">
                  <For each={props.markupConfig[props.getFileFormat()]?.viewers || []}>
                     {(v:any) => (
                        <button 
                          onClick={() => setSelectedViewer(v)}
                          class={cn(
                            "flex items-center gap-4 p-5 rounded-2xl border transition-all text-left",
                            selectedViewer()?.id === v.id ? "bg-primary/20 border-primary shadow-lg shadow-primary/20" : "bg-secondary/40 border-white/5 hover:bg-secondary/60 hover:border-white/10"
                          )}
                        >
                           <div class={cn("w-10 h-10 rounded-xl flex items-center justify-center", selectedViewer()?.id === v.id ? "bg-primary text-white" : "bg-slate-800 text-primary")}>
                              {v.icon}
                           </div>
                           <div>
                              <div class="text-sm font-bold">{v.label}</div>
                              <div class="text-[10px] text-muted-foreground uppercase tracking-wider">Engine</div>
                           </div>
                        </button>
                     )}
                  </For>
                </div>

                <Show when={selectedViewer()}>
                   <div class="p-6 bg-slate-900 border border-white/10 rounded-3xl animate-in slide-in-from-bottom-2 duration-300">
                      <div class="flex items-start gap-4 mb-6">
                         <div class="p-3 bg-primary/10 text-primary rounded-xl shrink-0">{selectedViewer().icon}</div>
                         <div>
                            <h4 class="text-lg font-bold mb-1">{selectedViewer().label}</h4>
                            <p class="text-sm text-slate-400 leading-relaxed">{selectedViewer().description}</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => props.onOpenRepo()}
                        class="w-full py-4 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-3 hover:bg-primary-hover shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
                      >
                         <Lucide.Zap size={14} fill="currentColor" /> Install {selectedViewer().label}
                      </button>
                   </div>
                </Show>
             </div>
          </Show>
        </div>
      }>
        {/* Simulator Canvas */}
        <div 
          class="mx-auto bg-white shadow-2xl relative transition-all duration-300 origin-top" 
          style={{ 
            width: `${simWidth()}px`, 
            "min-height": `${simWidth() * (9/16)}px`, 
            height: 'max-content', 
            transform: `scale(${previewScale()})` 
          }}
        >
           <iframe 
             src={props.previewUrl!} 
             class="w-full h-full border-none pointer-events-auto" 
             style={{ "min-height": `${simWidth() * (9/16)}px` }} 
           />
        </div>
      </Show>
    </div>
  );
}
