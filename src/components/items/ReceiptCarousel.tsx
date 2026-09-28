import { motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BOUNCY, SOFT, TAP } from "../../constants/motion";
import { useTheme } from "../../hooks/useTheme";
import type { BillStore } from "../../hooks/useBillStore";
import { fmt } from "../../utils/format";
import { ReceiptSection } from "./ReceiptSection";

// --pad (set on the wrapper below) lines the first card up with the page
// content: at least 1rem (the phone margin), or the 80rem column's side margin.
// pagePadding() is the same value, for measuring in JS.
function pagePadding(): number {
  return Math.max(16, (window.innerWidth - 1280) / 2 + 24);
}

// Receipts sit side by side and snap into place when swiped. The tab row above
// shows what's off-screen and jumps to a receipt, which also covers desktop
// where there's no swipe gesture.
export function ReceiptCarousel({
  store,
  selectedIds,
  onToggleSelect,
}: {
  store: BillStore;
  selectedIds: Set<string>;
  onToggleSelect: (personId: string) => void;
}) {
  const { receipts } = store.bill;
  const { flat } = useTheme();
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const tabs = useRef<HTMLDivElement>(null);

  // Keep the active receipt's tab in view; on phones the tab row is wider
  // than the screen. Scrolls only the tab row, never the page.
  useEffect(() => {
    const row = tabs.current;
    const tab = row?.querySelectorAll("[data-receipt-tab]")[active];

    if (!row || !(tab instanceof HTMLElement)) return;

    const box = row.getBoundingClientRect();
    const rect = tab.getBoundingClientRect();

    row.scrollTo({
      left: row.scrollLeft + rect.left - box.left - (box.width - rect.width) / 2,
      behavior: "smooth",
    });
  }, [active]);
  const count = useRef(receipts.length);

  const cards = useRef<HTMLDivElement>(null);
  // Whether every receipt fits on screen at once. If so the group is centred;
  // if not, the active receipt is centred with neighbours peeking either side.
  const [fits, setFits] = useState(true);

  useLayoutEffect(() => {
    const inner = cards.current;

    if (!inner) return;
    const measure = () => setFits(inner.offsetWidth <= window.innerWidth - 2 * pagePadding());
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(inner);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const cardAt = (index: number) => {
    const card = cards.current?.children[index];

    return card instanceof HTMLElement ? card : undefined;
  };

  // Centre the chosen card in the scroller
  const scrollTo = (index: number) => {
    const el = scroller.current;
    const card = cardAt(index);

    if (!el || !card) return;
    const box = el.getBoundingClientRect();
    const rect = card.getBoundingClientRect();
    el.scrollTo({
      left: el.scrollLeft + rect.left - box.left - (box.width - rect.width) / 2,
      behavior: "smooth",
    });
    setActive(index);
  };

  // Highlight a receipt the user is interacting with. Only scroll when the row
  // overflows; when everything fits, moving cards under the cursor would jar.
  const focusReceipt = (index: number) => {
    if (fits) setActive(index);
    else scrollTo(index);
  };

  // Jump to a receipt as soon as it's added
  useEffect(() => {
    // Wait a frame so the fits/overflow padding has settled before scrolling
    if (receipts.length > count.current) requestAnimationFrame(() => scrollTo(receipts.length - 1));
    count.current = receipts.length;
  }, [receipts.length]);

  // The active receipt is the card closest to the middle of the scroller
  const handleScroll = () => {
    const el = scroller.current;

    if (!el || el.scrollWidth <= el.clientWidth) return;
    const box = el.getBoundingClientRect();
    const middle = box.left + box.width / 2;
    let best = 0;
    let bestDistance = Infinity;

    for (let i = 0; i < receipts.length; i++) {
      const rect = cardAt(i)?.getBoundingClientRect();

      if (!rect) continue;
      const distance = Math.abs(rect.left + rect.width / 2 - middle);

      if (distance < bestDistance) {
        best = i;
        bestDistance = distance;
      }
    }

    setActive(best);
  };

  return (
    // Full-bleed: the row spans the whole viewport, while the inline padding
    // lines the first card up with the page content above it.
    <div className="space-y-2 mx-[calc(50%-50vw)] [--pad:max(1rem,calc((100vw-80rem)/2+1.5rem))] [--card:calc(100vw-2rem)] sm:[--card:440px] xl:[--card:480px]">
      {/* Tabs */}
      <div ref={tabs} className="overflow-x-auto no-scrollbar px-[var(--pad)] py-1">
        <div className="flex gap-2.5 w-max mx-auto">
          {receipts.map((receipt, i) => {
            const total = store.totals.receipts.get(receipt.id)?.totalCents ?? 0;
            const on = i === active;

            return (
              <motion.button
                key={receipt.id}
                data-receipt-tab
                layout
                whileTap={TAP}
                transition={BOUNCY}
                onClick={() => scrollTo(i)}
                className={`flex-shrink-0 h-9 px-3.5 rounded-full text-xs font-medium transition-colors flex items-center ${
                  on
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "bg-white/65 text-zinc-700 hover:bg-white/80 backdrop-blur-md dark:bg-[#0a0f2a]/55 dark:text-white/70 dark:hover:bg-[#0a0f2a]/70"
                }`}
              >
                <span className="truncate max-w-[9rem]">
                  {receipt.name.trim() || `Receipt ${i + 1}`}
                </span>
                {total > 0 && (
                  <span className="ml-1.5 tabular-nums opacity-60">${fmt(total / 100)}</span>
                )}
              </motion.button>
            );
          })}
          <button
            onClick={store.addReceipt}
            className="flex-shrink-0 h-9 px-4 rounded-full text-[13px] font-medium bg-white/40 backdrop-blur-md text-zinc-800 hover:bg-white/60 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15 transition-colors"
          >
            + Add receipt
          </button>
        </div>
      </div>

      {/* Cards */}
      <div
        ref={scroller}
        onScroll={handleScroll}
        className={`edge-fade overflow-x-auto no-scrollbar snap-x snap-mandatory py-6 -my-4 ${
          fits ? "px-[var(--pad)]" : "px-[calc(50vw-var(--card)/2)]"
        }`}
      >
        <div ref={cards} className={`flex items-start gap-4 w-max ${fits ? "mx-auto" : ""}`}>
          {receipts.map((receipt, i) => (
            // Receipts other than the highlighted one step back a little.
            // Clicking or typing into one makes it the highlighted receipt.
            <motion.div
              key={receipt.id}
              animate={
                i === active
                  ? // Drop the filter once settled: even saturate(1) keeps the card
                    // on its own layer, which renders text soft on phones
                    {
                      opacity: 1,
                      scale: 1,
                      filter: "saturate(1)",
                      transitionEnd: { filter: "none" },
                    }
                  : { opacity: 0.5, scale: 0.94, filter: "saturate(0)" }
              }
              transition={SOFT}
              onPointerDownCapture={() => i !== active && focusReceipt(i)}
              onFocusCapture={() => i !== active && focusReceipt(i)}
              className="snap-center flex-shrink-0 w-[var(--card)]"
            >
              <ReceiptSection
                store={store}
                receipt={receipt}
                index={i}
                selectedIds={selectedIds}
                onToggleSelect={onToggleSelect}
              />
            </motion.div>
          ))}
          <motion.button
            whileTap={TAP}
            whileHover={{ scale: 1.03, rotate: -1 }}
            transition={BOUNCY}
            onClick={store.addReceipt}
            className={`snap-center flex-shrink-0 w-40 self-stretch min-h-[10rem] border-2 border-dashed text-sm font-medium text-zinc-500 hover:text-zinc-800 hover:border-black/25 dark:text-white/60 dark:hover:text-white/90 dark:hover:border-white/35 transition-colors ${
              flat
                ? "rounded-2xl border-zinc-300 dark:border-zinc-700"
                : "rounded-[28px] border-white/70 bg-white/20 backdrop-blur-md dark:border-white/15"
            }`}
          >
            + Add receipt
          </motion.button>
        </div>
      </div>
    </div>
  );
}
