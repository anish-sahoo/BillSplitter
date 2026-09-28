import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { billSchema, type Bill, type Receipt } from "../types";
import { createId } from "./ids";

interface BillSplitterDb extends DBSchema {
  bills: {
    key: string;
    value: Bill;
    indexes: { byUpdatedAt: number };
  };
}

let dbPromise: Promise<IDBPDatabase<BillSplitterDb>> | null = null;

function db(): Promise<IDBPDatabase<BillSplitterDb>> {
  dbPromise ??= openDB<BillSplitterDb>("bill-splitter", 2, {
    upgrade(database, oldVersion) {
      // Version 1 held bills in an older shape from before receipts existed.
      // It never shipped, so start clean rather than migrating.
      if (oldVersion === 1) database.deleteObjectStore("bills");
      const store = database.createObjectStore("bills", { keyPath: "id" });
      store.createIndex("byUpdatedAt", "updatedAt");
    },
  });

  return dbPromise;
}

export function newReceipt(paidBy: string | null): Receipt {
  return {
    id: createId(),
    name: "",
    paidBy,
    items: [],
    tax: 0,
    taxMode: "proportional",
    tip: 0,
    tipMode: "even",
  };
}

// Stored data can be stale or hand-edited in devtools, so every read is run
// through the schema and anything that doesn't match is treated as missing.

// Most recently edited first
export async function listBills(): Promise<Bill[]> {
  const stored = await (await db()).getAllFromIndex("bills", "byUpdatedAt");

  return stored
    .flatMap((raw) => {
      const result = billSchema.safeParse(raw);

      return result.success ? [result.data] : [];
    })
    .reverse();
}

export async function getBill(id: string): Promise<Bill | undefined> {
  const result = billSchema.safeParse(await (await db()).get("bills", id));

  return result.success ? result.data : undefined;
}

export async function saveBill(bill: Bill): Promise<void> {
  await (await db()).put("bills", bill);
}

export async function deleteBill(id: string): Promise<void> {
  await (await db()).delete("bills", id);
}

export async function createBill(): Promise<Bill> {
  const now = Date.now();

  const bill: Bill = {
    id: createId(),
    title: "",
    persons: [],
    receipts: [newReceipt(null)],
    createdAt: now,
    updatedAt: now,
  };

  await saveBill(bill);
  // Ask the browser not to evict our data under storage pressure. Safari mostly ignores this.
  void navigator.storage?.persist?.();

  return bill;
}
