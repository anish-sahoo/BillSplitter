import { useEffect, useRef, useState } from "react";
import type { BillStore } from "../../hooks/useBillStore";
import { fmt } from "../../utils/format";
import { ReceiptSection } from "./ReceiptSection";

// Receipts sit side by side and snap into place when swiped. The tab row above
// shows what's off-screen and jumps to a receipt, which also covers desktop
// where there's no swipe gesture.
export function ReceiptCarousel({
  store,
  selectedIds,
}: {
  store: BillStore;
  selectedIds: Set<string>;
}) {
  const { receipts } = store.bill;
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const count = useRef(receipts.length);

  const scrollTo = (index: number) => {
    const card = scroller.current?.children[index] as HTMLElement | undefined;
    if (!card || !scroller.current) return;
    scroller.current.scrollTo({
      left: card.offsetLeft - scroller.current.offsetLeft,
      behavior: "smooth",
    });
  };

  // Jump to a receipt as soon as it's added
  useEffect(() => {
    if (receipts.length > count.current) scrollTo(receipts.length - 1);
    count.current = receipts.length;
  }, [receipts.length]);

  const handleScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const cards = Array.from(el.children) as HTMLElement[];
    // The active card is the one whose left edge is closest to the scroller's
    const nearest = cards.slice(0, receipts.length).reduce(
      (best, card, i) => {
        const distance = Math.abs(card.offsetLeft - el.offsetLeft - el.scrollLeft);
        return distance < best.distance ? { i, distance } : best;
      },
      { i: 0, distance: Infinity },
    );
    setActive(nearest.i);
  };

  return (
    <div className="space-y-2">
      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-3 px-3 sm:-mx-4 sm:px-4">
        {receipts.map((receipt, i) => {
          const total = store.totals.receipts.get(receipt.id)?.totalCents ?? 0;
          const on = i === active;
          return (
            <button
              key={receipt.id}
              onClick={() => scrollTo(i)}
              className={`flex-shrink-0 h-8 px-3 rounded-lg text-xs font-medium transition-colors flex items-center ${
                on
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              <span className="truncate max-w-[9rem]">
                {receipt.name.trim() || `Receipt ${i + 1}`}
              </span>
              {total > 0 && (
                <span className="ml-1.5 tabular-nums opacity-60">${fmt(total / 100)}</span>
              )}
            </button>
          );
        })}
        <button
          onClick={store.addReceipt}
          className="flex-shrink-0 h-8 px-3 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
        >
          + Add receipt
        </button>
      </div>

      {/* Cards */}
      <div
        ref={scroller}
        onScroll={handleScroll}
        className="flex items-start gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-3 px-3 sm:-mx-4 sm:px-4 scroll-px-3 sm:scroll-px-4"
      >
        {receipts.map((receipt, i) => (
          <div key={receipt.id} className="snap-start flex-shrink-0 w-[88%]">
            <ReceiptSection store={store} receipt={receipt} index={i} selectedIds={selectedIds} />
          </div>
        ))}
        <button
          onClick={store.addReceipt}
          className="snap-start flex-shrink-0 w-40 self-stretch min-h-[10rem] rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-500 hover:text-zinc-800 hover:border-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:border-zinc-500 transition-colors"
        >
          + Add receipt
        </button>
      </div>
    </div>
  );
}
