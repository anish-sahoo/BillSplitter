import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { BOUNCY, TAP } from "../../constants/motion";
import type { PersonShare } from "../../lib/calc";
import type { Person } from "../../types";
import { colorBg } from "../../utils/color";
import { restingTilt } from "../../utils/crisp";
import { useTheme } from "../../hooks/useTheme";
import { fmt } from "../../utils/format";
import { AnimatedDollars } from "../motion/AnimatedNumber";
import { Avatar } from "../ui/Avatar";

// Sticker-like tile: name and total up front, tap to unfold their items.
export function PersonCard({
  person,
  color,
  share,
  paidCents,
  tilt,
}: {
  person: Person;
  color: string;
  share: PersonShare | undefined;
  paidCents: number;
  tilt: number;
}) {
  const [open, setOpen] = useState(false);
  const { flat } = useTheme();
  const rest = flat ? 0 : restingTilt(tilt);
  const items = share?.items ?? [];
  const subtotal = (share?.subtotalCents ?? 0) / 100;
  const taxShare = (share?.taxCents ?? 0) / 100;
  const tipShare = (share?.tipCents ?? 0) / 100;
  const paid = paidCents / 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.6, rotate: flat ? 0 : tilt * 4 }}
      animate={{ opacity: 1, scale: 1, rotate: open ? 0 : rest }}
      whileHover={flat ? undefined : { rotate: 0, y: -3 }}
      transition={BOUNCY}
      className={`rounded-3xl border overflow-hidden backdrop-blur-md ${
        open ? "basis-full" : "flex-grow basis-full sm:basis-52"
      }`}
      style={{ backgroundColor: colorBg(color, 0.16), borderColor: colorBg(color, 0.45) }}
    >
      <motion.button
        layout="position"
        onClick={() => setOpen(!open)}
        whileTap={TAP}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-3 text-left"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Avatar name={person.name} color={color} className="w-8 h-8 text-[11px]" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
            {person.name}
          </span>
        </span>
        <AnimatedDollars
          cents={share?.totalCents ?? 0}
          className="text-[15px] font-semibold text-zinc-900 dark:text-white flex-shrink-0"
        />
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={BOUNCY}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3 space-y-1">
              {items.map(({ item, cents, splitCount: n }) => (
                <div key={item.id} className="flex justify-between items-baseline gap-2">
                  <span className="text-xs text-zinc-600 dark:text-white/70 truncate">
                    {item.name || "Item"}
                    {n > 1 && <span className="text-zinc-400 dark:text-white/40"> ÷{n}</span>}
                  </span>
                  <span className="text-xs tabular-nums text-zinc-800 dark:text-white/90 flex-shrink-0">
                    ${fmt(cents / 100)}
                  </span>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-xs text-zinc-500 dark:text-white/50 italic">No items assigned</p>
              )}
              <div className="pt-1.5 mt-1.5 border-t border-black/5 dark:border-white/10 space-y-0.5">
                <Row label="Subtotal" value={`$${fmt(subtotal)}`} />
                {taxShare > 0 && <Row label="Tax" value={`+$${fmt(taxShare)}`} />}
                {tipShare > 0 && <Row label="Tip" value={`+$${fmt(tipShare)}`} />}
                {paid > 0 && <Row label="Paid" value={`$${fmt(paid)}`} />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs text-zinc-500 dark:text-white/50">{label}</span>
      <span className="text-xs tabular-nums text-zinc-600 dark:text-white/70">{value}</span>
    </div>
  );
}
