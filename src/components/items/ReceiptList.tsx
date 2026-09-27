import type { BillStore } from "../../hooks/useBillStore";
import { ReceiptSection } from "./ReceiptSection";

// Flat theme: receipts stacked top to bottom, like v1's single column.
export function ReceiptList({
  store,
  selectedIds,
  onToggleSelect,
}: {
  store: BillStore;
  selectedIds: Set<string>;
  onToggleSelect: (personId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {store.bill.receipts.map((receipt, i) => (
        <ReceiptSection
          key={receipt.id}
          store={store}
          receipt={receipt}
          index={i}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
        />
      ))}
      <button
        onClick={store.addReceipt}
        className="w-full h-11 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-500 hover:text-zinc-800 hover:border-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:border-zinc-500 transition-colors"
      >
        + Add receipt
      </button>
    </div>
  );
}
