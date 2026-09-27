import { TAX_PRESETS, TIP_PRESETS } from "../../constants/presets";
import type { BillStore } from "../../hooks/useBillStore";
import type { Receipt } from "../../types";
import { personColor } from "../../utils/color";
import { fmt } from "../../utils/format";
import { PayerPicker } from "../people/PayerPicker";
import { TaxTipRow } from "../taxtip/TaxTipRow";
import { CARD_CLASS, HINT_CLASS } from "../ui/styles";
import { AddItemForm } from "./AddItemForm";
import { ItemRow } from "./ItemRow";

const HEADER_INPUT_CLASS =
  "min-w-0 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none";

export function ReceiptSection({
  store,
  receipt,
  index,
  selectedIds,
}: {
  store: BillStore;
  receipt: Receipt;
  index: number;
  selectedIds: Set<string>;
}) {
  const { persons } = store.bill;
  const totals = store.totals.receipts.get(receipt.id);
  const canRemove = store.bill.receipts.length > 1;

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

  return (
    <section className={CARD_CLASS}>
      {/* Header: receipt name + who paid */}
      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={receipt.name}
            onChange={(e) => store.setReceiptName(receipt.id, e.target.value)}
            placeholder={`Receipt ${index + 1}`}
            aria-label="Receipt name"
            autoComplete="off"
            className={`flex-1 text-sm font-semibold ${HEADER_INPUT_CLASS}`}
          />
          {canRemove && (
            <button
              onClick={removeReceipt}
              className="text-xs font-medium text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors px-1 py-1"
            >
              Remove
            </button>
          )}
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Paid by</p>
          <PayerPicker
            persons={persons}
            value={receipt.paidBy}
            onChange={(personId) => store.setPaidBy(receipt.id, personId)}
          />
        </div>
      </div>

      <div className="px-4 sm:px-5 py-4 space-y-3">
        <AddItemForm onAdd={handleAdd} />

        {receipt.items.length > 0 && (
          <div className="space-y-1.5">
            {receipt.items.map((item) => {
              const assignees = persons.filter((p) => item.personIds.includes(p.id));
              const assigned = new Set(item.personIds);
              const clickable = selectedIds.size > 0;
              return (
                <ItemRow
                  key={item.id}
                  item={item}
                  assignees={assignees}
                  colorFor={colorFor}
                  clickable={clickable}
                  allSelectedOn={clickable && [...selectedIds].every((id) => assigned.has(id))}
                  someSelectedOn={clickable && [...selectedIds].some((id) => assigned.has(id))}
                  onToggleAssignment={() => handleToggleAssignment(item.id, assigned)}
                  onUnlink={(personId) => store.setItemSplit(receipt.id, item.id, personId, false)}
                  onRemove={() => store.removeItem(receipt.id, item.id)}
                />
              );
            })}

            {/* Subtotal row */}
            <div className="flex justify-between items-center px-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Subtotal</span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                ${fmt((totals?.subtotalCents ?? 0) / 100)}
              </span>
            </div>
          </div>
        )}

        {receipt.items.length === 0 && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-6">
            No items yet — add the first line from this receipt
          </p>
        )}
      </div>

      {receipt.items.length > 0 && totals && (
        <div className="px-4 sm:px-5 py-4 space-y-5 border-t border-zinc-100 dark:border-zinc-800">
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

          <div className="border-t border-zinc-100 dark:border-zinc-800" />

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

          <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Receipt total
            </span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
              ${fmt(totals.totalCents / 100)}
            </span>
          </div>
          {totals.unassignedCents > 0 && (
            <p className={HINT_CLASS}>
              ${fmt(totals.unassignedCents / 100)} of items aren't assigned to anyone yet, so
              they're left out of settle up.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
