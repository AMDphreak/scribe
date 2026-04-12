import {
  type Accessor,
  type ParentProps,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";

export const SCRIBE_COLOR_STORAGE_KEY = "scribe-color-mode";

export type ColorPreference = "system" | "light" | "dark";

type Ctx = {
  preference: Accessor<ColorPreference>;
  resolved: Accessor<"light" | "dark">;
  setPreference: (p: ColorPreference) => void;
  toggleManual: () => void;
};

const ColorModeContext = createContext<Ctx>();

function readStoredPreference(): ColorPreference {
  if (typeof window === "undefined") return "system";
  try {
    const v = localStorage.getItem(SCRIBE_COLOR_STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "system";
}

export function ColorModeProvider(props: ParentProps) {
  const [preference, setPreferenceSignal] = createSignal<ColorPreference>(readStoredPreference());
  const [systemDark, setSystemDark] = createSignal(
    typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : false,
  );

  const resolved = () => {
    const p = preference();
    if (p === "light") return "light";
    if (p === "dark") return "dark";
    return systemDark() ? "dark" : "light";
  };

  const setPreference = (p: ColorPreference) => {
    setPreferenceSignal(p);
    try {
      localStorage.setItem(SCRIBE_COLOR_STORAGE_KEY, p);
    } catch {
      /* ignore */
    }
  };

  const toggleManual = () => {
    setPreference(resolved() === "dark" ? "light" : "dark");
  };

  createEffect(() => {
    const r = resolved();
    document.documentElement.dataset.scribeTheme = r;
    document.documentElement.style.colorScheme = r;
  });

  onMount(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onSchemeChange = () => {
      setSystemDark(mql.matches);
      try {
        const stored = localStorage.getItem(SCRIBE_COLOR_STORAGE_KEY);
        if (stored === "light" || stored === "dark") {
          setPreferenceSignal("system");
          localStorage.setItem(SCRIBE_COLOR_STORAGE_KEY, "system");
        }
      } catch {
        /* ignore */
      }
    };
    mql.addEventListener("change", onSchemeChange);
    onCleanup(() => mql.removeEventListener("change", onSchemeChange));
  });

  const value: Ctx = {
    preference,
    resolved,
    setPreference,
    toggleManual,
  };

  return <ColorModeContext.Provider value={value}>{props.children}</ColorModeContext.Provider>;
}

export function useColorMode() {
  const ctx = useContext(ColorModeContext);
  if (!ctx) {
    throw new Error("useColorMode must be used within ColorModeProvider");
  }
  return ctx;
}

function SunIcon(props: { class?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon(props: { class?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 90 1 1-9-9Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const { resolved, toggleManual } = useColorMode();

  return (
    <button
      type="button"
      class="theme-toggle"
      onClick={() => toggleManual()}
      aria-label={resolved() === "dark" ? "Use light appearance" : "Use dark appearance"}
    >
      <SunIcon class="theme-toggle-icon theme-toggle-sun" />
      <MoonIcon class="theme-toggle-icon theme-toggle-moon" />
    </button>
  );
}
