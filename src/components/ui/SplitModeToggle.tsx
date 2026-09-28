import type { SplitMode } from "../../types";

const BASE = "px-3 py-2 sm:py-1.5 transition-colors";

const ON = "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900";

const OFF =
  "bg-white/70 text-zinc-500 hover:text-zinc-800 dark:bg-white/10 dark:text-white/60 dark:hover:text-white/90";

export function SplitModeToggle({
  value,
  onChange,
}: {
  value: SplitMode;
  onChange: (m: SplitMode) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-black/10 dark:border-white/15 overflow-hidden text-xs font-medium flex-shrink-0">
      <button
        onClick={() => onChange("proportional")}
        className={`${BASE} ${value === "proportional" ? ON : OFF}`}
      >
        By share
      </button>
      <button
        onClick={() => onChange("even")}
        className={`${BASE} border-l border-black/10 dark:border-white/15 ${
          value === "even" ? ON : OFF
        }`}
      >
        Split even
      </button>
    </div>
  );
}
