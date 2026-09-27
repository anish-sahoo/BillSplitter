import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { BreakdownSection } from "../components/breakdown/BreakdownSection";
import { SettleUpSection } from "../components/breakdown/SettleUpSection";
import { ReceiptCarousel } from "../components/items/ReceiptCarousel";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { PeopleSection } from "../components/people/PeopleSection";
import { useBillStore } from "../hooks/useBillStore";
import { useSelectedPersons } from "../hooks/useSelectedPersons";
import { deleteBill } from "../lib/billStore";
import { shareUrl } from "../lib/shareLink";
import { billLabel } from "../utils/format";
import { Loading } from "./Loading";

export function BillEditor({ dark, onToggleDark }: { dark: boolean; onToggleDark: () => void }) {
  const { billId = "" } = useParams<{ billId: string }>();
  const navigate = useNavigate();
  const store = useBillStore(billId);
  const { selected, toggle, deselect, clear } = useSelectedPersons();
  const [shareLabel, setShareLabel] = useState("Share");

  useEffect(() => {
    clear();
  }, [billId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (store === undefined) return <Loading />;
  if (store === null) return <Navigate to="/" replace />;

  const { bill } = store;
  const hasItems = bill.receipts.some((r) => r.items.length > 0);

  const handleRemovePerson = (id: string) => {
    store.removePerson(id);
    deselect(id);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${bill.title.trim() || "this bill"}"? This can't be undone.`)) return;
    await deleteBill(bill.id);
    navigate("/", { replace: true });
  };

  const handleShare = async () => {
    const url = await shareUrl(bill);
    try {
      await navigator.clipboard.writeText(url);
      setShareLabel("Link copied");
      setTimeout(() => setShareLabel("Share"), 2000);
    } catch {
      window.prompt("Copy this read-only link:", url);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
      <Header
        dark={dark}
        onToggleDark={onToggleDark}
        crumb={billLabel(bill)}
        onDelete={handleDelete}
        onShare={handleShare}
        shareLabel={shareLabel}
      />

      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        <input
          type="text"
          value={bill.title}
          onChange={(e) => store.setTitle(e.target.value)}
          placeholder="What's this bill for?"
          aria-label="Bill name"
          autoComplete="off"
          className="w-full bg-transparent px-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none"
        />

        <PeopleSection
          persons={bill.persons}
          selectedIds={selected}
          onAdd={store.addPerson}
          onRemove={handleRemovePerson}
          onToggleSelect={toggle}
        />

        <ReceiptCarousel store={store} selectedIds={selected} />

        {bill.persons.length > 0 && hasItems && <BreakdownSection store={store} />}
        {bill.persons.length > 0 && hasItems && <SettleUpSection store={store} />}

        <Footer />
      </main>
    </div>
  );
}
