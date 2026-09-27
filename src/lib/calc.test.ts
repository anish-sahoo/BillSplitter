import { describe, expect, it } from "vitest";
import type { Bill, Receipt } from "../types";
import { billTotals, receiptTotals } from "./calc";

function receipt(overrides: Partial<Receipt>): Receipt {
  return {
    id: "r1",
    name: "",
    paidBy: "a",
    items: [],
    tax: 0,
    taxMode: "proportional",
    tip: 0,
    tipMode: "even",
    ...overrides,
  };
}

function bill(receipts: Receipt[]): Bill {
  return {
    id: "b1",
    title: "Test",
    persons: [
      { id: "a", name: "Ana" },
      { id: "b", name: "Ben" },
      { id: "c", name: "Cy" },
    ],
    receipts,
    createdAt: 0,
    updatedAt: 0,
  };
}

describe("receiptTotals", () => {
  it("splits items and tax to the cent", () => {
    const totals = receiptTotals(
      receipt({
        items: [
          { id: "i1", name: "Pizza", costCents: 1000, quantity: 1, personIds: ["a", "b", "c"] },
        ],
        tax: 10,
      }),
    );

    expect(totals.totalCents).toBe(1100);
    const owed = [...totals.shares.values()].map((s) => s.totalCents);
    expect(owed.reduce((x, y) => x + y, 0)).toBe(1100);
    // Rounding can land two leftover cents on the same person, never more.
    expect(Math.max(...owed) - Math.min(...owed)).toBeLessThanOrEqual(2);
  });

  it("splits tip evenly or by share", () => {
    const items = [
      { id: "i1", name: "", costCents: 3000, quantity: 1, personIds: ["a"] },
      { id: "i2", name: "", costCents: 1000, quantity: 1, personIds: ["b"] },
    ];

    const even = receiptTotals(receipt({ items, tip: 20, tipMode: "even" }));
    expect(even.shares.get("a")?.tipCents).toBe(400);

    const byShare = receiptTotals(receipt({ items, tip: 20, tipMode: "proportional" }));
    expect(byShare.shares.get("a")?.tipCents).toBe(600);
    expect(byShare.shares.get("b")?.tipCents).toBe(200);
  });
});

describe("billTotals", () => {
  it("nets receipts paid by different people", () => {
    const totals = billTotals(
      bill([
        receipt({
          id: "r1",
          paidBy: "a",
          items: [{ id: "i1", name: "", costCents: 3000, quantity: 1, personIds: ["a", "b", "c"] }],
        }),
        receipt({
          id: "r2",
          paidBy: "b",
          items: [{ id: "i2", name: "", costCents: 1500, quantity: 1, personIds: ["a", "b", "c"] }],
        }),
      ]),
    );

    // Everyone owes 1500. Ana paid 3000, Ben paid 1500, Cy paid nothing.
    expect(totals.transfers).toEqual([{ fromId: "c", toId: "a", cents: 1500 }]);
  });

  it("leaves unassigned items and payer-less receipts out of settle-up", () => {
    const totals = billTotals(
      bill([
        receipt({
          id: "r1",
          paidBy: "a",
          items: [
            { id: "i1", name: "", costCents: 1000, quantity: 1, personIds: ["b"] },
            { id: "i2", name: "", costCents: 500, quantity: 1, personIds: [] },
          ],
        }),
        receipt({
          id: "r2",
          paidBy: null,
          items: [{ id: "i3", name: "", costCents: 900, quantity: 1, personIds: ["c"] }],
        }),
      ]),
    );

    expect(totals.unassignedCents).toBe(500);
    expect(totals.receiptsWithoutPayer.map((r) => r.id)).toEqual(["r2"]);
    expect(totals.transfers).toEqual([{ fromId: "b", toId: "a", cents: 1000 }]);
  });
});
