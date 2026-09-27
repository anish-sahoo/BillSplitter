import type { BillStore } from "../../hooks/useBillStore";
import { personColor } from "../../utils/color";
import { fmt } from "../../utils/format";
import { Avatar } from "../ui/Avatar";
import { Section } from "../ui/Section";
import { HINT_CLASS } from "../ui/styles";

export function SettleUpSection({ store }: { store: BillStore }) {
  const { persons } = store.bill;
  const { transfers, unassignedCents, receiptsWithoutPayer } = store.totals;

  const indexOf = (id: string) => persons.findIndex((p) => p.id === id);
  const nameOf = (id: string) => persons[indexOf(id)]?.name ?? "Someone";

  return (
    <Section title="Settle Up" subtitle="Who owes who">
      <div className="px-4 sm:px-5 py-4 space-y-3">
        {transfers.length > 0 && (
          <ul className="space-y-2">
            {transfers.map((t) => (
              <li key={`${t.fromId}-${t.toId}`} className="flex items-center gap-2 min-w-0">
                <Avatar name={nameOf(t.fromId)} color={personColor(indexOf(t.fromId))} />
                <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                  <span className="font-semibold">{nameOf(t.fromId)}</span>
                  <span className="text-zinc-400 dark:text-zinc-500"> pays </span>
                  <span className="font-semibold">{nameOf(t.toId)}</span>
                </span>
                <span className="ml-auto text-base font-bold tabular-nums text-zinc-900 dark:text-zinc-100 flex-shrink-0">
                  ${fmt(t.cents / 100)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {transfers.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Everyone's even.</p>
        )}

        {receiptsWithoutPayer.length > 0 && (
          <p className={HINT_CLASS}>
            {receiptsWithoutPayer.length === 1
              ? "One receipt doesn't have a payer yet, so it's left out."
              : `${receiptsWithoutPayer.length} receipts don't have a payer yet, so they're left out.`}
          </p>
        )}
        {unassignedCents > 0 && (
          <p className={HINT_CLASS}>
            ${fmt(unassignedCents / 100)} of items aren't assigned to anyone, so they're left out.
          </p>
        )}
      </div>
    </Section>
  );
}
