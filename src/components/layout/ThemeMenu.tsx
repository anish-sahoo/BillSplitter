import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BOUNCY, SNAPPY, TAP } from "../../constants/motion";
import { useTheme, type ThemeName } from "../../hooks/useTheme";

function SunIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="w-[18px] h-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2v1.8M10 16.2V18M2 10h1.8M16.2 10H18M4.3 4.3l1.3 1.3M14.4 14.4l1.3 1.3M4.3 15.7l1.3-1.3M14.4 5.6l1.3-1.3" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="w-[18px] h-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    >
      <path d="M16.5 12.2A6.5 6.5 0 0 1 7.8 3.5a6.5 6.5 0 1 0 8.7 8.7Z" />
    </svg>
  );
}

function FlatIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="w-[18px] h-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="3.5" y="3.5" width="13" height="13" rx="3" />
      <path d="M10 3.5v13" />
    </svg>
  );
}

const OPTIONS: { name: ThemeName; label: string; hint: string; icon: ReactNode }[] = [
  { name: "dawn", label: "Dawn", hint: "Meadow under a morning sky", icon: <SunIcon /> },
  { name: "dusk", label: "Dusk", hint: "Blue hour, stars and fireflies", icon: <MoonIcon /> },
  { name: "flat", label: "Flat", hint: "Plain black and white", icon: <FlatIcon /> },
];

export function ThemeMenu({ onChange }: { onChange: (theme: ThemeName) => void }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = OPTIONS.find((o) => o.name === theme.name) ?? OPTIONS[0];

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;

    const onPointer = (e: PointerEvent) => {
      if (!(e.target instanceof Node && root.current?.contains(e.target))) setOpen(false);
    };

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <motion.button
        whileTap={TAP}
        transition={SNAPPY}
        onClick={() => setOpen(!open)}
        aria-label={`Theme: ${current.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-600 hover:bg-black/5 dark:text-white/75 dark:hover:bg-white/10 transition-colors"
      >
        {current.icon}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.9, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            // Opens with a bounce, closes quickly so it's out of the way
            exit={{ opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.12 } }}
            transition={BOUNCY}
            className="absolute right-0 top-12 w-60 p-1.5 origin-top-right rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-xl"
          >
            <p className="px-3 pt-2 pb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 dark:text-white/45">
              Theme
            </p>
            {OPTIONS.map((option) => {
              const selected = option.name === theme.name;

              return (
                <button
                  key={option.name}
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    onChange(option.name);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    selected
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "text-zinc-800 hover:bg-black/5 dark:text-white/85 dark:hover:bg-white/10"
                  }`}
                >
                  {option.icon}
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span
                      className={`block text-xs ${selected ? "opacity-70" : "text-zinc-500 dark:text-white/50"}`}
                    >
                      {option.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
