import { useEffect, useRef, useState } from "react";
import { billTotals, type BillTotals } from "../lib/calc";
import { getBill, newReceipt, saveBill } from "../lib/billStore";
import { createId } from "../lib/ids";
import type { Bill, Receipt, SplitMode } from "../types";

export interface BillStore {
  bill: Bill;
  totals: BillTotals;
  setTitle: (title: string) => void;
  addPerson: (name: string) => void;
  removePerson: (personId: string) => void;
  addReceipt: () => void;
  removeReceipt: (receiptId: string) => void;
  setReceiptName: (receiptId: string, name: string) => void;
  setPaidBy: (receiptId: string, personId: string | null) => void;
  addItem: (
    receiptId: string,
    name: string,
    unitPrice: number,
    assignTo: string[],
    quantity: number,
  ) => void;
  removeItem: (receiptId: string, itemId: string) => void;
  setItemSplit: (receiptId: string, itemId: string, personId: string, included: boolean) => void;
  setTax: (receiptId: string, percent: number) => void;
  setTaxMode: (receiptId: string, mode: SplitMode) => void;
  setTip: (receiptId: string, percent: number) => void;
  setTipMode: (receiptId: string, mode: SplitMode) => void;
}

// Loads one bill from IndexedDB and saves it back after every edit.
// `store` is undefined while loading and null if the bill doesn't exist.
export function useBillStore(billId: string): BillStore | null | undefined {
  const [bill, setBill] = useState<Bill | null | undefined>(undefined);
  const edited = useRef(false);

  useEffect(() => {
    let cancelled = false;
    edited.current = false;
    getBill(billId).then((loaded) => {
      if (!cancelled) setBill(loaded ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [billId]);

  useEffect(() => {
    if (bill && edited.current) saveBill(bill).catch(console.error);
  }, [bill]);

  // Hide a previously loaded bill while the next one loads
  if (bill === undefined || (bill !== null && bill.id !== billId)) return undefined;

  if (bill === null) return null;

  const update = (change: (current: Bill) => Bill) => {
    edited.current = true;
    setBill((current) => (current ? { ...change(current), updatedAt: Date.now() } : current));
  };

  const updateReceipt = (receiptId: string, change: (receipt: Receipt) => Receipt) =>
    update((b) => ({
      ...b,
      receipts: b.receipts.map((r) => (r.id === receiptId ? change(r) : r)),
    }));

  const updateItemPeople = (
    receiptId: string,
    itemId: string,
    change: (personIds: string[]) => string[],
  ) =>
    updateReceipt(receiptId, (r) => ({
      ...r,
      items: r.items.map((i) => (i.id === itemId ? { ...i, personIds: change(i.personIds) } : i)),
    }));

  return {
    bill,
    totals: billTotals(bill),

    setTitle: (title) => update((b) => ({ ...b, title })),

    addPerson: (name) => {
      const trimmed = name.trim();
      const taken = bill.persons.some((p) => p.name.toLowerCase() === trimmed.toLowerCase());

      if (!trimmed || taken) return;
      const person = { id: createId(), name: trimmed };
      update((b) => ({
        ...b,
        persons: [...b.persons, person],
        // The first person added becomes the payer of any receipt without one
        receipts: b.receipts.map((r) => (r.paidBy ? r : { ...r, paidBy: person.id })),
      }));
    },

    removePerson: (personId) =>
      update((b) => ({
        ...b,
        persons: b.persons.filter((p) => p.id !== personId),
        receipts: b.receipts.map((r) => ({
          ...r,
          paidBy: r.paidBy === personId ? null : r.paidBy,
          items: r.items.map((i) => ({
            ...i,
            personIds: i.personIds.filter((id) => id !== personId),
          })),
        })),
      })),

    addReceipt: () =>
      update((b) => ({
        ...b,
        receipts: [...b.receipts, newReceipt(b.persons[0]?.id ?? null)],
      })),

    removeReceipt: (receiptId) =>
      update((b) =>
        b.receipts.length > 1
          ? { ...b, receipts: b.receipts.filter((r) => r.id !== receiptId) }
          : b,
      ),

    setReceiptName: (receiptId, name) => updateReceipt(receiptId, (r) => ({ ...r, name })),

    setPaidBy: (receiptId, paidBy) => updateReceipt(receiptId, (r) => ({ ...r, paidBy })),

    addItem: (receiptId, name, unitPrice, assignTo, quantity) => {
      if (isNaN(unitPrice) || unitPrice <= 0) return;
      const qty = Math.max(1, Math.round(quantity));

      const item = {
        id: createId(),
        name: name.trim(),
        costCents: Math.round(unitPrice * 100) * qty,
        quantity: qty,
        personIds: assignTo,
      };

      updateReceipt(receiptId, (r) => ({ ...r, items: [...r.items, item] }));
    },

    removeItem: (receiptId, itemId) =>
      updateReceipt(receiptId, (r) => ({ ...r, items: r.items.filter((i) => i.id !== itemId) })),

    setItemSplit: (receiptId, itemId, personId, included) =>
      updateItemPeople(receiptId, itemId, (ids) => {
        const without = ids.filter((id) => id !== personId);

        return included ? [...without, personId] : without;
      }),

    setTax: (receiptId, tax) => updateReceipt(receiptId, (r) => ({ ...r, tax })),
    setTaxMode: (receiptId, taxMode) => updateReceipt(receiptId, (r) => ({ ...r, taxMode })),
    setTip: (receiptId, tip) => updateReceipt(receiptId, (r) => ({ ...r, tip })),
    setTipMode: (receiptId, tipMode) => updateReceipt(receiptId, (r) => ({ ...r, tipMode })),
  };
}
