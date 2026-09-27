import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { Section } from "../components/ui/Section";
import { HINT_CLASS, PRIMARY_BUTTON_CLASS } from "../components/ui/styles";
import { billTotals } from "../lib/calc";
import { createBill, listBills } from "../lib/billStore";
import type { Bill } from "../types";
import { billLabel, fmt } from "../utils/format";

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function BillsPage({ dark, onToggleDark }: { dark: boolean; onToggleDark: () => void }) {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[] | null>(null);

  useEffect(() => {
    listBills().then(setBills);
  }, []);

  const handleNew = async () => {
    const bill = await createBill();
    navigate(`/bills/${bill.id}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
      <Header dark={dark} onToggleDark={onToggleDark} />

      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        <button onClick={handleNew} className={`${PRIMARY_BUTTON_CLASS} w-full`}>
          New bill
        </button>

        {bills && bills.length > 0 && (
          <Section title="Your Bills" subtitle="Saved in this browser">
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {bills.map((bill) => {
                const receipts = bill.receipts.filter((r) => r.items.length > 0).length;
                return (
                  <li key={bill.id}>
                    <Link
                      to={`/bills/${bill.id}`}
                      className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {billLabel(bill)}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {plural(bill.persons.length, "person", "people")} ·{" "}
                          {plural(receipts, "receipt")} · edited{" "}
                          {new Date(bill.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums flex-shrink-0">
                        ${fmt(billTotals(bill).grandTotalCents / 100)}
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-600 flex-shrink-0">›</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        {bills && bills.length === 0 && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-6">
            No bills yet — start one above
          </p>
        )}

        <p className={`${HINT_CLASS} text-center`}>
          Bills are saved in this browser only and don't sync between devices.
        </p>

        <Footer />
      </main>
    </div>
  );
}
