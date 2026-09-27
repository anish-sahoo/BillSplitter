import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BOUNCY } from "../constants/motion";
import { restingTilt } from "../utils/crisp";
import { useTheme } from "../hooks/useTheme";
import { useLocation } from "react-router-dom";
import { billTotals } from "../lib/calc";
import { decodeBill } from "../lib/shareLink";
import type { Bill } from "../types";
import { billLabel, fmt, trim } from "../utils/format";

// Read-only view of a shared bill, styled like a paper receipt. It ignores
// dark mode on purpose so it looks the same on every phone and when printed.

// Zigzag "torn paper" edge along the bottom of the receipt
const TORN_EDGE = {
  background:
    "linear-gradient(-45deg, transparent 8px, white 0) 0 0 / 16px 16px repeat-x, linear-gradient(45deg, transparent 8px, white 0) 0 0 / 16px 16px repeat-x",
};

function Divider() {
  return <div className="border-t border-dashed border-zinc-400 my-3" />;
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${bold ? "font-bold" : ""}`}>
      <span className="min-w-0 break-words">{label}</span>
      <span className="tabular-nums flex-shrink-0">{value}</span>
    </div>
  );
}

function Receipt({ bill }: { bill: Bill }) {
  const totals = billTotals(bill);
  const nameOf = (id: string | null) => bill.persons.find((p) => p.id === id)?.name ?? "—";
  const dollars = (cents: number) => `$${fmt(cents / 100)}`;

  return (
    <div className="font-mono text-[13px] leading-relaxed text-zinc-900">
      <div className="bg-white px-5 pt-6 pb-4">
        <div className="text-center space-y-1">
          <p className="text-[11px] tracking-[0.3em] text-zinc-500">BILL SPLITTER</p>
          <h1 className="text-lg font-bold uppercase break-words">{billLabel(bill)}</h1>
          <p className="text-[11px] text-zinc-500">
            {new Date(bill.updatedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        {bill.receipts.map((receipt, i) => {
          const r = totals.receipts.get(receipt.id);

          if (!r || receipt.items.length === 0) return null;

          return (
            <section key={receipt.id}>
              <Divider />
              <p className="font-bold uppercase">{receipt.name.trim() || `Receipt ${i + 1}`}</p>
              <p className="text-[11px] text-zinc-500 mb-2">PAID BY {nameOf(receipt.paidBy)}</p>

              <div className="space-y-1.5">
                {receipt.items.map((item) => (
                  <div key={item.id}>
                    <Line
                      label={`${item.quantity > 1 ? `${item.quantity} × ` : ""}${item.name || "Item"}`}
                      value={dollars(item.costCents)}
                    />
                    <p className="text-[11px] text-zinc-500 pl-3">
                      {item.personIds.length > 0
                        ? item.personIds.map(nameOf).join(", ")
                        : "unassigned"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-2 pt-2 border-t border-dotted border-zinc-300 space-y-0.5">
                <Line label="Subtotal" value={dollars(r.subtotalCents)} />
                {r.taxCents > 0 && (
                  <Line label={`Tax (${trim(receipt.tax)}%)`} value={dollars(r.taxCents)} />
                )}
                {r.tipCents > 0 && (
                  <Line label={`Tip (${trim(receipt.tip)}%)`} value={dollars(r.tipCents)} />
                )}
                <Line label="Total" value={dollars(r.totalCents)} bold />
              </div>
            </section>
          );
        })}

        <Divider />
        <div className="text-base">
          <Line label="GRAND TOTAL" value={dollars(totals.grandTotalCents)} bold />
        </div>

        {bill.persons.length > 0 && (
          <>
            <Divider />
            <p className="font-bold mb-1">EACH PERSON'S SHARE</p>
            <div className="space-y-0.5">
              {bill.persons.map((person) => (
                <Line
                  key={person.id}
                  label={person.name}
                  value={dollars(totals.shares.get(person.id)?.totalCents ?? 0)}
                />
              ))}
            </div>
          </>
        )}

        <Divider />
        <p className="font-bold text-center mb-2">SETTLE UP</p>
        {totals.transfers.length > 0 ? (
          <div className="space-y-1.5">
            {totals.transfers.map((t) => (
              <div
                key={`${t.fromId}-${t.toId}`}
                className="flex justify-between gap-3 text-[15px] font-bold"
              >
                <span className="min-w-0 break-words">
                  {nameOf(t.fromId)} → {nameOf(t.toId)}
                </span>
                <span className="tabular-nums flex-shrink-0">{dollars(t.cents)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center">Everyone's even.</p>
        )}

        <Divider />
        <p className="text-center text-[11px] text-zinc-500">*** THANK YOU ***</p>
      </div>
      <div className="h-4" style={TORN_EDGE} />
    </div>
  );
}

export function ReceiptView() {
  const { hash } = useLocation();
  const { flat } = useTheme();
  // undefined while decoding, null when the link can't be read
  const [bill, setBill] = useState<Bill | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    decodeBill(hash.slice(1)).then((decoded) => {
      if (!cancelled) setBill(decoded);
    });

    return () => {
      cancelled = true;
    };
  }, [hash]);

  // Print just the receipt: size the page to the paper and drop the margins,
  // which also makes browsers leave out their date/URL headers and footers.
  // Runs for the button and for Ctrl/Cmd+P alike.
  const paper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const style = document.createElement("style");

    const beforePrint = () => {
      const el = paper.current;

      if (!el) return;
      const toMm = (px: number) => ((px * 25.4) / 96).toFixed(2);
      style.textContent = `@page { size: ${toMm(el.offsetWidth)}mm ${toMm(el.offsetHeight + 2)}mm; margin: 0; }`;
      document.head.appendChild(style);
    };

    const afterPrint = () => style.remove();
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);

    return () => {
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
      style.remove();
    };
  }, []);

  return (
    <div className="min-h-screen px-4 py-10 print:bg-white print:p-0">
      <div className="max-w-sm mx-auto">
        {bill === undefined && (
          <p className="text-center text-sm text-zinc-500 dark:text-white/60">Loading…</p>
        )}
        {bill === null && (
          <p className="text-center text-sm text-zinc-600 dark:text-white/70">
            This link is incomplete or invalid. Ask for the link again.
          </p>
        )}
        {bill && (
          <>
            {/* The paper drops in and settles, like it was just torn off */}
            <motion.div
              initial={{ opacity: 0, y: flat ? 12 : -60, rotate: flat ? 0 : -4 }}
              animate={{ opacity: 1, y: 0, rotate: flat ? 0 : restingTilt(-0.6) }}
              whileHover={flat ? undefined : { rotate: 0, y: -4 }}
              transition={BOUNCY}
              className="drop-shadow-2xl print:drop-shadow-none print:!transform-none"
            >
              <div ref={paper}>
                <Receipt bill={bill} />
              </div>
            </motion.div>
            <button
              onClick={() => window.print()}
              className="mt-8 w-full text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-white/70 dark:hover:text-white print:hidden"
            >
              Print / Save as PDF
            </button>
          </>
        )}
      </div>
    </div>
  );
}
