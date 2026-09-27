import { AnimatePresence, motion } from "framer-motion";
import { BOUNCY } from "../../constants/motion";
import type { BillStore } from "../../hooks/useBillStore";
import { personColor } from "../../utils/color";
import { fmt } from "../../utils/format";
import { AnimatedDollars } from "../motion/AnimatedNumber";
import { Card } from "../motion/Card";
import { Avatar } from "../ui/Avatar";
import { HINT_CLASS } from "../ui/styles";

// The answer people came for, so it gets the biggest type on the page.
export function SettleUpSection({ store, delay }: { store: BillStore; delay?: number }) {
  const { persons } = store.bill;
  const { transfers, unassignedCents, receiptsWithoutPayer } = store.totals;

  const indexOf = (id: string) => persons.findIndex((p) => p.id === id);
  const nameOf = (id: string) => persons[indexOf(id)]?.name ?? "Someone";

  return (
    <Card seed="settle-up" delay={delay} lean>
      <div className="px-5 sm:px-6 pt-6 pb-2">
        <p className="font-serif text-4xl leading-none text-zinc-900 dark:text-white">Settle up</p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 dark:text-white/50">
          Who pays who
        </p>
      </div>
      <div className="px-5 sm:px-6 pt-3 pb-6 space-y-3">
        <ul className="space-y-2.5">
          <AnimatePresence initial={false}>
            {transfers.map((t, i) => (
              <motion.li
                key={`${t.fromId}-${t.toId}`}
                layout
                initial={{ opacity: 0, x: -24, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.9 }}
                transition={{ ...BOUNCY, delay: i * 0.05 }}
                className="flex items-center gap-2.5 min-w-0"
              >
                <Avatar
                  name={nameOf(t.fromId)}
                  color={personColor(indexOf(t.fromId))}
                  className="w-8 h-8 text-[11px]"
                />
                <span className="text-[15px] text-zinc-900 dark:text-white truncate">
                  <span className="font-semibold">{nameOf(t.fromId)}</span>
                  <span className="text-zinc-400 dark:text-white/45"> → </span>
                  <span className="font-semibold">{nameOf(t.toId)}</span>
                </span>
                <AnimatedDollars
                  cents={t.cents}
                  className="ml-auto font-serif text-3xl leading-none text-zinc-900 dark:text-white flex-shrink-0"
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {transfers.length === 0 && (
          <p className="font-serif text-2xl text-zinc-700 dark:text-white/80">Everyone's even</p>
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
    </Card>
  );
}
