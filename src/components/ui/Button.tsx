import { cn } from '../../lib/utils';

export function ToolbarButton(props: { icon: any, title: string, onClick: () => void }) {
  return (
    <button onClick={props.onClick} title={props.title} class="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-white/5 hover:text-primary rounded-lg transition-all">{props.icon}</button>
  );
}

export function ThemeButton(props: { active: boolean, label: string, onClick: () => void }) {
   return (
      <button onClick={props.onClick} class={cn("flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all", props.active ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-slate-500 hover:bg-white/5")}>{props.label}</button>
   );
}

export function ViewerProvisionButton(props: { icon: any, label: string, onClick: () => void }) {
   return (
      <button onClick={props.onClick} class="flex items-center gap-3 p-4 bg-secondary/40 border border-white/5 rounded-2xl hover:bg-primary/10 hover:border-primary/50 transition-all text-sm font-bold">
         <span class="text-primary">{props.icon}</span> {props.label}
      </button>
   );
}
