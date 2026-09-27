import type { BillStore } from "../../hooks/useBillStore";
import { personColor } from "../../utils/color";
import { fmt } from "../../utils/format";
import { Section } from "../ui/Section";
import { PersonCard } from "./PersonCard";

export function BreakdownSection({ store }: { store: BillStore }) {
  const { totals } = store;
  let subtotalCents = 0;
  let taxCents = 0;
  let tipCents = 0;
  for (const receipt of totals.receipts.values()) {
    subtotalCents += receipt.subtotalCents;
    taxCents += receipt.taxCents;
    tipCents += receipt.tipCents;
  }

  return (
    <Section title="Breakdown" subtitle="What everyone owes">
      {/* One card per column on mobile, two from sm up */}
      <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {store.bill.persons.map((person, i) => (
          <PersonCard
            key={person.id}
            person={person}
            color={personColor(i)}
            share={totals.shares.get(person.id)}
            paidCents={totals.paidCents.get(person.id) ?? 0}
          />
        ))}
      </div>

      {/* Grand total bar */}
      <div className="px-4 sm:px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
        <div className="flex justify-between items-center gap-3">
          <div className="min-w-0">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Grand Total
            </span>
            {(taxCents > 0 || tipCents > 0) && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                {subtotalCents > 0 && `$${fmt(subtotalCents / 100)} items`}
                {taxCents > 0 && ` + $${fmt(taxCents / 100)} tax`}
                {tipCents > 0 && ` + $${fmt(tipCents / 100)} tip`}
              </p>
            )}
          </div>
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums flex-shrink-0">
            ${fmt(totals.grandTotalCents / 100)}
          </span>
        </div>
      </div>
    </Section>
  );
}
