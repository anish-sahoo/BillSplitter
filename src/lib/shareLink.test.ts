import { describe, expect, it } from "vitest";
import type { Bill } from "../types";
import { decodeBill, encodeBill, openBill, sealBill, sharedTheme } from "./shareLink";

function fromBase64Url(encoded: string): Uint8Array {
  return Uint8Array.from(atob(encoded.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
    c.charCodeAt(0),
  );
}

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

describe("sealed share links", () => {
  it("round-trips a bill", async () => {
    const { sealed, key } = await sealBill(bill);
    expect(key).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(await openBill(sealed, key)).toEqual(bill);
  });

  it("seals the same bill to the same bytes", async () => {
    const reordered: Bill = { ...bill, updatedAt: 2, title: "Apartment stuff", id: "bill1" };
    const first = await sealBill(bill);
    const second = await sealBill(reordered);
    expect(second.key).toBe(first.key);
    expect(second.sealed).toEqual(first.sealed);
  });

  it("seals a changed bill differently", async () => {
    const changed = await sealBill({ ...bill, title: "Apartment things" });
    expect(changed.key).not.toBe((await sealBill(bill)).key);
  });

  it("rejects a different bill encrypted under a link's key", async () => {
    const { key } = await sealBill(bill);
    const packed = fromBase64Url(await encodeBill({ ...bill, title: "Pay me instead" }));
    const iv = new Uint8Array(12);

    const cryptoKey = await crypto.subtle.importKey("raw", fromBase64Url(key), "AES-GCM", false, [
      "encrypt",
    ]);

    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, packed);
    const sealed = new Uint8Array([...iv, ...new Uint8Array(ciphertext)]);
    expect(await openBill(sealed, key)).toBeNull();
  });

  it("returns null for the wrong key", async () => {
    const { sealed } = await sealBill(bill);
    const other = await sealBill({ ...bill, title: "Other" });
    expect(await openBill(sealed, other.key)).toBeNull();
  });
});

describe("shared theme", () => {
  it("reads the theme from a short link's fragment", () => {
    expect(sharedTheme("/s", "", "#wgVce9BKGf.Q2x8pLmZ3RtYv0aKcW1sNe.dusk")).toBe("dusk");
  });

  it("reads the theme from a long link's query string", () => {
    expect(sharedTheme("/view", "?theme=flat", "#hZLLbuQg")).toBe("flat");
  });

  it("ignores unknown themes and other pages", () => {
    expect(sharedTheme("/s", "", "#wgVce9BKGf.Q2x8pLmZ3RtYv0aKcW1sNe.neon")).toBeUndefined();
    expect(sharedTheme("/", "?theme=dusk", "")).toBeUndefined();
  });
});
