import { useLayoutEffect, useRef } from "react";
import type { BillStore } from "../../hooks/useBillStore";
import { AnimatedDollars } from "../motion/AnimatedNumber";
import { Card } from "../motion/Card";
import { SUBTITLE_CLASS } from "../ui/styles";
import { plural } from "../../utils/format";
import { useTheme } from "../../hooks/useTheme";

// Bill title as big editable type, with the grand total underneath.
export function HeroCard({ store }: { store: BillStore }) {
  const { bill, totals } = store;
  const receipts = bill.receipts.filter((r) => r.items.length > 0).length;
  const title = useRef<HTMLTextAreaElement>(null);

  const { flat } = useTheme();

  // A textarea so long titles wrap instead of clipping; grow it to fit. The
  // wrap point moves with the width, the theme's font, and late font loads.
  useLayoutEffect(() => {
    const el = title.current;

    if (!el) return;

    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    document.fonts?.ready.then(fit);

    return () => observer.disconnect();
  }, [bill.title, flat]);

  return (
    <Card seed="hero" lean>
      <div className="px-6 sm:px-8 pt-7 pb-6 sm:pt-9 sm:pb-8">
        <p className={SUBTITLE_CLASS}>
          {plural(bill.persons.length, "person", "people")} · {plural(receipts, "receipt")}
        </p>
        <textarea
          ref={title}
          rows={1}
          value={bill.title}
          onChange={(e) => store.setTitle(e.target.value.replace(/\n/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          placeholder="What's this bill for?"
          aria-label="Bill name"
          className="mt-3 w-full resize-none overflow-hidden bg-transparent font-serif text-[2.75rem] sm:text-6xl xl:text-7xl leading-[1.02] tracking-[-0.01em] text-zinc-900 dark:text-white placeholder:text-zinc-400/80 dark:placeholder:text-white/30 focus:outline-none"
        />
        <div className="mt-5 pt-5 border-t border-black/10 dark:border-white/10 flex items-baseline justify-between gap-4">
          <span className={SUBTITLE_CLASS}>Total</span>
          <AnimatedDollars
            cents={totals.grandTotalCents}
            className="font-serif text-5xl sm:text-6xl leading-none text-zinc-900 dark:text-white"
          />
        </div>
      </div>
    </Card>
  );
}
