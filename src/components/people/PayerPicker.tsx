import type { Person } from "../../types";
import { colorBg, personColor } from "../../utils/color";
import { Avatar } from "../ui/Avatar";

// One-of-many pill picker for who paid a receipt
export function PayerPicker({
  persons,
  value,
  onChange,
}: {
  persons: Person[];
  value: string | null;
  onChange: (personId: string) => void;
}) {
  if (persons.length === 0)
    return (
      <p className="text-xs text-zinc-400 dark:text-zinc-500">Add people to choose who paid</p>
    );

  return (
    <div role="radiogroup" aria-label="Paid by" className="flex flex-wrap gap-1.5">
      {persons.map((p, i) => {
        const color = personColor(i);
        const selected = p.id === value;
        return (
          <button
            key={p.id}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(p.id)}
            className={`inline-flex items-center gap-1.5 pl-1 pr-2.5 h-8 rounded-full border text-xs font-medium max-w-full transition-colors ${
              selected
                ? "text-zinc-900 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800"
            }`}
            style={
              selected ? { backgroundColor: colorBg(color, 0.2), borderColor: color } : undefined
            }
          >
            <Avatar
              name={p.name}
              color={selected ? color : colorBg(color, 0.5)}
              className="w-6 h-6 text-[10px]"
            />
            <span className="truncate">{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}
