import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { TAX_PRESETS, TIP_PRESETS } from "../../constants/presets";
import type { BillStore } from "../../hooks/useBillStore";
import type { Receipt } from "../../types";
import { personColor } from "../../utils/color";
import { fmt, trim } from "../../utils/format";
import { AnimatedDollars } from "../motion/AnimatedNumber";
import { Card } from "../motion/Card";
import { Collapsible } from "../motion/Collapsible";
import { PayerPicker } from "../people/PayerPicker";
import { AvatarToggle } from "../people/AvatarToggle";
import { TaxTipRow } from "../taxtip/TaxTipRow";
import { Avatar } from "../ui/Avatar";
import { HINT_CLASS, SUBTITLE_CLASS } from "../ui/styles";
import { AddItemForm } from "./AddItemForm";
import { ItemRow } from "./ItemRow";
import { BOUNCY } from "../../constants/motion";

const HEADER_INPUT_CLASS =
  "min-w-0 bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/40 focus:outline-none";

const DIVIDER = "border-t border-black/5 dark:border-white/10";

export function ReceiptSection({
  store,
  receipt,
  index,
  selectedIds,
  onToggleSelect,
}: {
  store: BillStore;
  receipt: Receipt;
  index: number;
  selectedIds: Set<string>;
  onToggleSelect: (personId: string) => void;
}) {
  const { persons } = store.bill;
  const totals = store.totals.receipts.get(receipt.id);
  const canRemove = store.bill.receipts.length > 1;
  const payerIndex = persons.findIndex((p) => p.id === receipt.paidBy);
  const payer = persons[payerIndex];
  const selectedNames = persons.filter((p) => selectedIds.has(p.id)).map((p) => p.name);
  const [payerOpen, setPayerOpen] = useState(false);

  const colorFor = (personId: string) => personColor(persons.findIndex((p) => p.id === personId));

  const handleAdd = (name: string, unitPrice: number, quantity: number) =>
    store.addItem(receipt.id, name, unitPrice, [...selectedIds], quantity);

  // Clicking a row assigns every selected person, or clears them all if they're
  // already on the item.
  const handleToggleAssignment = (itemId: string, assigned: Set<string>) => {
    if (selectedIds.size === 0) return;
    const allOn = [...selectedIds].every((id) => assigned.has(id));

    for (const personId of selectedIds) store.setItemSplit(receipt.id, itemId, personId, !allOn);
  };

  const removeReceipt = () => {
    if (receipt.items.length > 0 && !confirm("Remove this receipt and its items?")) return;
    store.removeReceipt(receipt.id);
  };

  const taxTipSummary = [
    receipt.tax > 0 ? `Tax ${trim(receipt.tax)}%` : "No tax",
    receipt.tip > 0 ? `Tip ${trim(receipt.tip)}%` : "No tip",
  ].join(" · ");

  return (
    <Card seed={receipt.id} delay={0.1}>
      {/* Header: receipt name + running total */}
      <div className="px-4 sm:px-5 pt-5 pb-3 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={receipt.name}
            onChange={(e) => store.setReceiptName(receipt.id, e.target.value)}
            placeholder={`Receipt ${index + 1}`}
            aria-label="Receipt name"
            autoComplete="off"
            className={`flex-1 font-serif text-2xl sm:text-3xl ${HEADER_INPUT_CLASS}`}
          />
          <AnimatedDollars
            cents={totals?.totalCents ?? 0}
            className="font-serif text-2xl sm:text-3xl leading-none text-zinc-900 dark:text-white"
          />
        </div>

        <Collapsible
          // Stays open until someone is picked, so a missing payer is hard to miss
          open={payerOpen || (receipt.paidBy === null && persons.length > 0)}
          onOpenChange={setPayerOpen}
          summary={
            <span className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-white/70">
              Paid by
              {payer ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-white">
                  <Avatar
                    name={payer.name}
                    color={personColor(payerIndex)}
                    className="w-6 h-6 text-[10px]"
                  />
                  {payer.name}
                </span>
              ) : (
                <span className="font-semibold text-amber-600 dark:text-amber-300">nobody yet</span>
              )}
            </span>
          }
        >
          <PayerPicker
            persons={persons}
            value={receipt.paidBy}
            onChange={(personId) => {
              store.setPaidBy(receipt.id, personId);
              setPayerOpen(false);
            }}
          />
        </Collapsible>
      </div>

      <div className={`px-4 sm:px-5 py-4 space-y-3 ${DIVIDER}`}>
        <AddItemForm onAdd={handleAdd} />

        {persons.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-xs text-zinc-500 dark:text-white/60 truncate">
              Split new items between{" "}
              <span className="font-medium text-zinc-800 dark:text-white/90">
                {selectedNames.length > 0 ? selectedNames.join(", ") : "nobody yet"}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {persons.map((p, i) => (
                <AvatarToggle
                  key={p.id}
                  person={p}
                  color={personColor(i)}
                  selected={selectedIds.has(p.id)}
                  onToggle={() => onToggleSelect(p.id)}
                />
              ))}
            </div>
            {selectedIds.size > 0 && receipt.items.length > 0 && (
              <p className={HINT_CLASS}>Tap an item to add or remove them</p>
            )}
          </div>
        )}

        {receipt.items.length > 0 && (
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {receipt.items.map((item) => {
                const assignees = persons.filter((p) => item.personIds.includes(p.id));
                const assigned = new Set(item.personIds);
                const clickable = selectedIds.size > 0;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.85, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, height: 0 }}
                    transition={BOUNCY}
                  >
                    <ItemRow
                      item={item}
                      assignees={assignees}
                      colorFor={colorFor}
                      clickable={clickable}
                      allSelectedOn={clickable && [...selectedIds].every((id) => assigned.has(id))}
                      someSelectedOn={clickable && [...selectedIds].some((id) => assigned.has(id))}
                      onToggleAssignment={() => handleToggleAssignment(item.id, assigned)}
                      onUnlink={(personId) =>
                        store.setItemSplit(receipt.id, item.id, personId, false)
                      }
                      onRemove={() => store.removeItem(receipt.id, item.id)}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <div className="flex justify-between items-center px-3 pt-2">
              <span className="text-xs font-medium text-zinc-500 dark:text-white/60">Subtotal</span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums">
                ${fmt((totals?.subtotalCents ?? 0) / 100)}
              </span>
            </div>
          </div>
        )}

        {receipt.items.length === 0 && (
          <p className={`${HINT_CLASS} text-center py-6`}>
            No items yet — add the first line from this receipt
          </p>
        )}
      </div>

      {receipt.items.length > 0 && totals && (
        <div className={`px-4 sm:px-5 py-4 ${DIVIDER}`}>
          <Collapsible
            summary={
              <span className="flex items-center justify-between gap-3 text-sm">
                <span className="text-zinc-600 dark:text-white/70">{taxTipSummary}</span>
                {totals.taxCents + totals.tipCents > 0 && (
                  <span className="font-semibold tabular-nums text-zinc-900 dark:text-white">
                    +${fmt((totals.taxCents + totals.tipCents) / 100)}
                  </span>
                )}
              </span>
            }
          >
            <div className="space-y-5">
              <TaxTipRow
                label="Tax"
                percent={receipt.tax}
                amount={totals.taxCents / 100}
                base={totals.subtotalCents / 100}
                presets={TAX_PRESETS}
                mode={receipt.taxMode}
                onPercentChange={(n) => store.setTax(receipt.id, n)}
                onModeChange={(m) => store.setTaxMode(receipt.id, m)}
                hint={
                  receipt.taxMode === "proportional"
                    ? "Each person pays tax proportional to their items"
                    : "Tax divided equally among everyone on this receipt"
                }
              />
              <div className={DIVIDER} />
              <TaxTipRow
                label="Tip / Charges"
                percent={receipt.tip}
                amount={totals.tipCents / 100}
                base={totals.subtotalCents / 100}
                presets={TIP_PRESETS}
                mode={receipt.tipMode}
                onPercentChange={(n) => store.setTip(receipt.id, n)}
                onModeChange={(m) => store.setTipMode(receipt.id, m)}
                hint={
                  receipt.tipMode === "proportional"
                    ? "Each person tips proportional to their subtotal"
                    : "Tip divided equally among everyone on this receipt"
                }
              />
            </div>
          </Collapsible>

          {totals.unassignedCents > 0 && (
            <p className={`${HINT_CLASS} mt-3`}>
              ${fmt(totals.unassignedCents / 100)} of items aren't assigned to anyone yet, so
              they're left out of settle up.
            </p>
          )}
        </div>
      )}

      {canRemove && (
        <div className={`px-4 sm:px-5 py-3 ${DIVIDER}`}>
          <button
            onClick={removeReceipt}
            className={`${SUBTITLE_CLASS} hover:text-red-500 dark:hover:text-red-400 transition-colors`}
          >
            Remove receipt
          </button>
        </div>
      )}
    </Card>
  );
}
