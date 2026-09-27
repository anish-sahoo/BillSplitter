import { useEffect, useState } from "react";
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
      <div className="bg-white px-5 pt-6 pb-4 shadow-sm">
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

  return (
    <div className="min-h-screen bg-zinc-200 px-4 py-8 print:bg-white print:p-0">
      <div className="max-w-sm mx-auto">
        {bill === undefined && <p className="text-center text-sm text-zinc-500">Loading…</p>}
        {bill === null && (
          <p className="text-center text-sm text-zinc-600">
            This link is incomplete or invalid. Ask for the link again.
          </p>
        )}
        {bill && (
          <>
            <Receipt bill={bill} />
            <button
              onClick={() => window.print()}
              className="mt-6 w-full text-xs font-medium text-zinc-500 hover:text-zinc-800 print:hidden"
            >
              Print / Save as PDF
            </button>
          </>
        )}
      </div>
    </div>
  );
}
