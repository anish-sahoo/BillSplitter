import { describe, expect, it } from "vitest";

import { allocateCents, parseUsdCents } from "./money";

describe("money", () => {
  it("parses dollars without floating-point arithmetic", () => {
    expect(parseUsdCents("12.34")).toBe(1234);
    expect(parseUsdCents("12.345")).toBeNull();
  });

  it("allocates remainder cents deterministically", () => {
    expect([
      ...allocateCents(10, [
        { id: "a", weight: 1 },
        { id: "b", weight: 1 },
        { id: "c", weight: 1 },
      ]),
    ]).toEqual([
      ["a", 4],
      ["b", 3],
      ["c", 3],
    ]);
  });
});
