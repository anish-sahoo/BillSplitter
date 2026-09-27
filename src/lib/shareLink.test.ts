import { describe, expect, it } from "vitest";
import type { Bill } from "../types";
import { decodeBill, encodeBill } from "./shareLink";

const bill: Bill = {
  id: "bill1",
  title: "Apartment stuff",
  persons: [
    { id: "a", name: "Ana" },
    { id: "b", name: "Ben" },
  ],
  receipts: [
    {
      id: "r1",
      name: "IKEA",
      paidBy: "a",
      items: [{ id: "i1", name: "Lamp", costCents: 4900, quantity: 2, personIds: ["a", "b"] }],
      tax: 6.25,
      taxMode: "proportional",
      tip: 0,
      tipMode: "even",
    },
  ],
  createdAt: 1,
  updatedAt: 2,
};

describe("share links", () => {
  it("round-trips a bill", async () => {
    const encoded = await encodeBill(bill);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await decodeBill(encoded)).toEqual(bill);
  });

  it("returns null for garbage", async () => {
    expect(await decodeBill("not-a-bill")).toBeNull();
  });

  it("returns null for a truncated link", async () => {
    const encoded = await encodeBill(bill);
    expect(await decodeBill(encoded.slice(0, encoded.length / 2))).toBeNull();
  });
});
