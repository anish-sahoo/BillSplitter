import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { BreakdownSection } from "../components/breakdown/BreakdownSection";
import { SettleUpSection } from "../components/breakdown/SettleUpSection";
import { ReceiptCarousel } from "../components/items/ReceiptCarousel";
import { ReceiptList } from "../components/items/ReceiptList";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { HeroCard } from "../components/layout/HeroCard";
import { PeopleSection } from "../components/people/PeopleSection";
import { useBillStore } from "../hooks/useBillStore";
import { useSelectedPersons } from "../hooks/useSelectedPersons";
import { shareUrl } from "../lib/shareLink";
import { billLabel } from "../utils/format";
import { useTheme, type ThemeName } from "../hooks/useTheme";
import { Loading } from "./Loading";

export function BillEditor({ onThemeChange }: { onThemeChange: (theme: ThemeName) => void }) {
  const { billId = "" } = useParams<{ billId: string }>();
  const store = useBillStore(billId);
  const { flat, name: themeName } = useTheme();
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

  const handleShare = async () => {
    const url = await shareUrl(bill, themeName);

    // Phones get the native share sheet (Messages, WhatsApp, AirDrop, ...).
    // Desktop browsers with a share API tend to show a clunky dialog, so they
    // copy the link instead.
    const touch = window.matchMedia("(pointer: coarse)").matches;

    if (touch && navigator.share) {
      try {
        await navigator.share({ title: billLabel(bill), url });
      } catch {
        // Dismissing the share sheet rejects; nothing to do
      }

      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareLabel("Link copied");
      setTimeout(() => setShareLabel("Share"), 2000);
    } catch {
      window.prompt("Copy this read-only link:", url);
    }
  };

  const showTotals = bill.persons.length > 0 && hasItems;

  const header = (
    <Header
      onThemeChange={onThemeChange}
      crumb={billLabel(bill)}
      onShare={handleShare}
      shareLabel={shareLabel}
    />
  );

  const people = (
    <PeopleSection persons={bill.persons} onAdd={store.addPerson} onRemove={handleRemovePerson} />
  );

  // Flat theme: one plain column, top to bottom, like v1
  if (flat)
    return (
      <div className="min-h-screen">
        {header}
        <main className="max-w-2xl mx-auto px-3 sm:px-4 pt-6 pb-6 space-y-4">
          <HeroCard store={store} />
          {people}
          <ReceiptList store={store} selectedIds={selected} onToggleSelect={toggle} />
          {showTotals && <SettleUpSection store={store} />}
          {showTotals && <BreakdownSection store={store} />}
          <div className="pt-6">
            <Footer />
          </div>
        </main>
      </div>
    );

  // Two loose columns on wide screens. Below `lg` the column wrappers become
  // `display: contents`, so the cards join one stack and `order` sets the
  // phone order: hero, settle up, people, receipts, breakdown.
  return (
    <div className="min-h-screen">
      {header}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-6">
        {/* Below `lg` every wrapper is `display: contents`, so the cards join
            one stack and `order` sets the phone order. */}
        <div className="flex flex-col gap-6 lg:gap-10">
          <div className="contents lg:flex lg:flex-row lg:items-start lg:gap-10">
            <div className="contents lg:flex lg:flex-col lg:gap-10 lg:flex-none lg:w-[46%]">
              <div className="order-1 lg:order-none">
                <HeroCard store={store} />
              </div>
              {showTotals && (
                <div className="order-2 lg:order-none lg:ml-10">
                  <SettleUpSection store={store} delay={0.08} />
                </div>
              )}
            </div>

            <div className="contents lg:flex lg:flex-col lg:gap-10 lg:flex-1 lg:min-w-0 lg:pt-16">
              <div className="order-3 lg:order-none lg:mr-6">{people}</div>
              {showTotals && (
                <div className="order-5 lg:order-none lg:ml-8">
                  <BreakdownSection store={store} delay={0.16} />
                </div>
              )}
            </div>
          </div>

          <div className="order-4 lg:order-none min-w-0">
            <ReceiptCarousel store={store} selectedIds={selected} onToggleSelect={toggle} />
          </div>
        </div>

        <div className="mt-12">
          <Footer />
        </div>
      </main>
    </div>
  );
}
