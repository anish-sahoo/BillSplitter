import type { Bill, Item } from "../types";
import { deleteBill, getBill, saveBill } from "./billStore";

// Dev-only sample bill, loaded by `main.tsx` under `npm run dev`. Prices are
// made up.

const ALL_SUPPLIES = ["anish", "rohanp", "rohanm", "will"];

const ALL_RIDES = ["anish", "sean", "rohanm", "zayj"];

function item(
  id: string,
  name: string,
  costCents: number,
  personIds: string[],
  quantity = 1,
): Item {
  return { id, name, costCents, quantity, personIds };
}

const SEED_BILL: Bill = {
  id: "seed-apartment-v2",
  title: "Apartment stuff",
  persons: [
    { id: "anish", name: "anish" },
    { id: "rohanp", name: "rohan p" },
    { id: "rohanm", name: "rohan m" },
    { id: "will", name: "will" },
    { id: "sean", name: "sean" },
    { id: "zayj", name: "zayj" },
  ],
  receipts: [
    {
      id: "supplies",
      name: "Apartment supplies",
      paidBy: "will",
      items: [
        item("bathmat", "bath mat", 2598, ALL_SUPPLIES, 2),
        item("curtains", "shower curtains", 2398, ALL_SUPPLIES, 2),
        item("rings", "shower curtain rings", 798, ALL_SUPPLIES, 2),
        item("trash", "trash bags", 1249, ALL_SUPPLIES),
        item("hooks", "towel hooks", 1475, ["anish", "rohanm"]),
        item("spray", "cleaner spray", 689, ALL_SUPPLIES),
        item("akaash", "akaash singh", 9000, ["anish", "rohanp", "rohanm"]),
      ],
      tax: 6.25,
      taxMode: "proportional",
      tip: 0,
      tipMode: "even",
    },
    {
      id: "rides",
      name: "Moving rides",
      paidBy: "anish",
      items: [
        item("storage-uber", "uber to storage on 9/1", 2743, ["anish", "zayj"]),
        item("storage-lyft", "lyft back from storage 9/1", 3118, ["anish", "zayj"]),
        item("uhaul-to", "uber to uhaul truck", 1452, ALL_RIDES),
        item("uhaul-back", "uber from uhaul back to house", 1687, ALL_RIDES),
      ],
      tax: 0,
      taxMode: "proportional",
      tip: 0,
      tipMode: "even",
    },
  ],
  createdAt: Date.parse("2026-09-01T12:00:00"),
  updatedAt: Date.parse("2026-09-01T12:00:00"),
};

// Only adds the bill if it's missing, so edits to it survive reloads.
// Delete it in the app to get a fresh copy on the next load.
export async function seedSampleBill(): Promise<void> {
  // Replaced by the current sample; drop it from browsers that loaded it
  await deleteBill("seed-apartment");

  if (!(await getBill(SEED_BILL.id))) await saveBill(SEED_BILL);
}
