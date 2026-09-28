import { trim } from "../../utils/format";

export function PercentPresets({
  options,
  value,
  onSelect,
}: {
  options: number[];
  value: number;
  onSelect: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = Math.abs(value - opt) < 0.005;

        return (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            className={`px-3 h-8 rounded-lg text-xs font-medium tabular-nums transition-colors ${
              active
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-black/5 text-zinc-600 hover:bg-black/10 dark:bg-white/10 dark:text-white/60 dark:hover:bg-white/15"
            }`}
          >
            {trim(opt)}%
          </button>
        );
      })}
    </div>
  );
}
