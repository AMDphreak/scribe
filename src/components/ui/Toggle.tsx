import { cn } from '../../lib/utils';

export function PreferenceToggle(props: { label: string, description: string, active: boolean, onToggle: () => void }) {
  return (
    <div class="flex items-center justify-between group">
      <div><div class="text-sm font-bold">{props.label}</div><div class="text-[10px] text-slate-500">{props.description}</div></div>
      <button onClick={props.onToggle} class={cn("w-9 h-5 rounded-full flex items-center px-1 transition-colors", props.active ? "bg-primary" : "bg-slate-800")}><div class={cn("w-3 h-3 bg-white rounded-full transition-transform", props.active ? "translate-x-4" : "translate-x-0")} /></button>
    </div>
  );
}
