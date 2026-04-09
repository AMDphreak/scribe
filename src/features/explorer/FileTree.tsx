import { createSignal, Show, For } from 'solid-js';
import * as Lucide from 'lucide-solid';
import { cn } from '../../lib/utils';

interface SsgNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  isContent: boolean;
  children?: SsgNode[];
}

export function FileTreeNode(props: { node: SsgNode, onSelect: (p: string) => void, active: boolean, level: number }) {
  const [open, setOpen] = createSignal(props.level === 0 || props.node.path === 'content' || props.node.path === 'docs');
  return (
    <div>
      <button 
        onClick={() => props.node.type === 'directory' ? setOpen(!open()) : props.onSelect(props.node.path)} 
        class={cn(
          "w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all group", 
          props.active ? "bg-primary/20 text-primary" : "hover:bg-slate-800/40 text-slate-500 hover:text-slate-200"
        )} 
        style={{ "padding-left": `${(props.level * 14) + 8}px` }}
      >
        <span class="w-4 h-4 flex items-center justify-center shrink-0">
          <Show when={props.node.type === 'directory'}>
            <Show when={open()} fallback={<Lucide.ChevronRight size={14} class="opacity-20" />}>
               <Lucide.ChevronDown size={14} class="opacity-20" />
            </Show>
          </Show>
        </span>
        {props.node.type === 'directory' ? (
          <Lucide.Folder size={14} class={cn("shrink-0", props.active ? "text-primary" : "text-primary/30")} />
        ) : (
          <Lucide.FileIcon size={14} class={cn("shrink-0", props.active ? "text-primary" : "text-slate-400/40")} />
        )}
        <span class={cn("text-xs truncate", props.active ? "font-bold" : "font-medium")}>{props.node.name}</span>
      </button>
      <Show when={props.node.type === 'directory' && open()}>
        <div class="mt-0.5">
          <For each={props.node.children}>{(child) => <FileTreeNode node={child!} onSelect={props.onSelect} active={false} level={props.level + 1} />}</For>
        </div>
      </Show>
    </div>
  );
}
