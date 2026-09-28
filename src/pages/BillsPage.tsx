import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { AnimatedDollars } from "../components/motion/AnimatedNumber";
import { Card } from "../components/motion/Card";
import { Avatar } from "../components/ui/Avatar";
import { HINT_CLASS } from "../components/ui/styles";
import { BOUNCY, SNAPPY, TAP } from "../constants/motion";
import { billTotals } from "../lib/calc";
import { createBill, deleteBill, listBills } from "../lib/billStore";
import type { Bill } from "../types";
import { useTheme, type ThemeName } from "../hooks/useTheme";
import { personColor } from "../utils/color";
import { billLabel, plural } from "../utils/format";

function BillCard({
  bill,
  index,
  onDelete,
}: {
  bill: Bill;
  index: number;
  onDelete: (bill: Bill) => void;
}) {
  const receipts = bill.receipts.filter((r) => r.items.length > 0).length;

  return (
    <Link to={`/bills/${bill.id}`} className="group block break-inside-avoid mb-6">
      <Card seed={bill.id} delay={0.05 * index} lean>
        {/* Shows on hover with a mouse; always visible on touch screens */}
        <motion.button
          whileTap={TAP}
          transition={SNAPPY}
          onClick={(e) => {
            // The whole card is a link; don't open the bill
            e.preventDefault();
            e.stopPropagation();
            onDelete(bill);
          }}
          aria-label={`Delete ${billLabel(bill)}`}
          title="Delete bill"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-500/10 dark:text-white/40 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
        >
          <svg
            viewBox="0 0 16 16"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2.5 4h11M6.5 4V2.5h3V4M4 4l.7 9.5h6.6L12 4M6.8 6.5v4.5M9.2 6.5v4.5" />
          </svg>
        </motion.button>
        <div className="px-5 py-5 space-y-4">
          <div>
            <p className="font-serif text-3xl leading-tight text-zinc-900 dark:text-white truncate">
              {billLabel(bill)}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500 dark:text-white/50 mt-1">
              {plural(receipts, "receipt")} · edited {new Date(bill.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="flex -space-x-2">
              {bill.persons.slice(0, 6).map((p, i) => (
                <Avatar
                  key={p.id}
                  name={p.name}
                  color={personColor(i)}
                  className="w-8 h-8 text-[11px] ring-2 ring-white/70 dark:ring-black/30"
                />
              ))}
            </div>
            <AnimatedDollars
              cents={billTotals(bill).grandTotalCents}
              className="font-serif text-4xl leading-none text-zinc-900 dark:text-white"
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function BillsPage({ onThemeChange }: { onThemeChange: (theme: ThemeName) => void }) {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[] | null>(null);
  const { flat } = useTheme();

  useEffect(() => {
    listBills().then(setBills);
  }, []);

  const handleDelete = async (bill: Bill) => {
    if (!confirm(`Delete "${billLabel(bill)}"? This can't be undone.`)) return;
    await deleteBill(bill.id);
    setBills(await listBills());
  };

  const handleNew = async () => {
    const bill = await createBill();
    navigate(`/bills/${bill.id}`);
  };

  return (
    <div className="min-h-screen">
      <Header onThemeChange={onThemeChange} />

      <main
        className={`mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-6 ${flat ? "max-w-2xl" : "max-w-7xl"}`}
      >
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={BOUNCY}
          className="font-serif text-6xl sm:text-8xl leading-none text-zinc-900 dark:text-white mb-8 sm:mb-12 drop-shadow-[0_2px_12px_rgba(0,0,0,0.15)]"
        >
          Your bills
        </motion.h1>

        {/* Loose masonry: cards keep their own height and flow into columns */}
        <div className={flat ? "" : "columns-1 sm:columns-2 lg:columns-3 gap-6"}>
          <motion.button
            onClick={handleNew}
            whileTap={TAP}
            whileHover={{ scale: 1.02, rotate: -1 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={BOUNCY}
            className={`w-full mb-6 h-36 border-2 border-dashed font-serif text-3xl text-zinc-900 dark:text-white transition-colors break-inside-avoid ${
              flat
                ? "rounded-2xl border-zinc-300 dark:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/5"
                : "rounded-[28px] border-white/70 dark:border-white/25 bg-white/20 dark:bg-white/[0.03] backdrop-blur-md hover:bg-white/35 dark:hover:bg-white/10"
            }`}
          >
            + New bill
          </motion.button>

          {bills?.map((bill, i) => (
            <BillCard key={bill.id} bill={bill} index={i} onDelete={handleDelete} />
          ))}
        </div>

        {bills && bills.length === 0 && (
          <p className={`${HINT_CLASS} text-center py-6`}>No bills yet — start one above</p>
        )}

        <p className={`${HINT_CLASS} text-center mt-6`}>
          Bills are saved in this browser only and don't sync between devices.
        </p>

        <div className="mt-6">
          <Footer />
        </div>
      </main>
    </div>
  );
}
