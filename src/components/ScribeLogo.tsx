import { JSX } from 'solid-js';

export function ScribeLogo() {
  return (
    <div class="flex items-center gap-3 group cursor-default">
      {/* Vector Scroll Icon */}
      <div class="relative w-10 h-10 flex items-center justify-center">
        {/* Glow effect */}
        <div class="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full group-hover:bg-indigo-500/40 transition-all duration-700" />
        
        <svg 
          viewBox="0 0 24 24" 
          class="w-8 h-8 relative z-10 drop-shadow-2xl" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Bottom curl */}
          <path 
            d="M7 19C7 20.1046 7.89543 21 9 21H17C18.1046 21 19 20.1046 19 19V6" 
            stroke="currentColor" 
            stroke-width="1.5" 
            class="text-indigo-400"
          />
          {/* Main body */}
          <path 
            d="M5 5V18C5 19.1046 5.89543 20 7 20H15" 
            stroke="currentColor" 
            stroke-width="1.5" 
            class="text-indigo-200"
          />
          {/* Top curl */}
          <path 
            d="M5 5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V19" 
            stroke="currentColor" 
            stroke-width="1.5" 
            class="text-indigo-500"
          />
          {/* Internal lines (content) */}
          <path d="M8 7H16M8 11H16M8 15H13" stroke="currentColor" stroke-width="1" class="text-indigo-400/40" />
        </svg>
      </div>

      {/* Faux-Paper Title Container */}
      <div class="relative px-4 py-1 flex items-center">
        {/* SVG Paper Background (Jagged Edges) */}
        <svg 
          class="absolute inset-0 w-full h-full -z-10" 
          preserveAspectRatio="none" 
          viewBox="0 0 120 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Parchment/Torn Paper Vector Path */}
          <path 
            d="M2.5 5.5C5 4 8.5 6 12 5C15.5 4 19 7 22.5 6C26 5 29.5 3 33 4C36.5 5 40 7.5 43.5 6.5C47 5.5 50.5 3.5 54 4.5C57.5 5.5 61 8 64.5 7C68 6 71.5 4 75 5C78.5 6 82 8.5 85.5 7.5C89 6.5 92.5 4.5 96 5.5C99.5 6.5 103 9 106.5 8C110 7 113.5 5 117 6V34C114.5 35 111 33 107.5 34C104 35 100.5 32 97 33C93.5 34 90 36 86.5 35C83 34 79.5 31.5 76 32.5C72.5 33.5 69 35.5 65.5 34.5C62 33.5 58.5 31 55 32C51.5 33 48 35 44.5 34C41 33 37.5 30.5 34 31.5C30.5 32.5 27 34.5 23.5 33.5C20 32.5 16.5 30 13 31C9.5 32 6 34 2.5 33V5.5Z" 
            fill="currentColor" 
            class="text-slate-900/40"
          />
          {/* Subtle highlight border */}
          <path 
            d="M2.5 5.5C5 4 8.5 6 12 5C15.5 4 19 7 22.5 6" 
            stroke="currentColor" 
            stroke-width="0.5" 
            class="text-indigo-500/20"
          />
        </svg>

        {/* Text with Pinyon Script */}
        <span 
          style={{ "font-family": "'Pinyon Script', cursive" }} 
          class="text-2xl tracking-wide flex items-baseline gap-0.5 pointer-events-none drop-shadow-lg"
        >
          <span class="text-indigo-400 text-3xl font-bold">S</span>
          <span class="text-indigo-100 bg-clip-text">cribe</span>
        </span>
      </div>
    </div>
  );
}
