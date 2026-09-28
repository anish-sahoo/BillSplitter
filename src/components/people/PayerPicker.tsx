import type { Person } from "../../types";
import { personColor } from "../../utils/color";
import { AvatarToggle } from "./AvatarToggle";

// Pick who paid a receipt: one face per person, the name shows on hover
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
      <p className="text-xs text-zinc-400 dark:text-white/45">Add people to choose who paid</p>
    );

  return (
    <div role="radiogroup" aria-label="Paid by" className="flex flex-wrap items-center gap-1.5">
      {persons.map((p, i) => (
        <AvatarToggle
          key={p.id}
          role="radio"
          person={p}
          color={personColor(i)}
          selected={p.id === value}
          onToggle={() => onChange(p.id)}
        />
      ))}
    </div>
  );
}
