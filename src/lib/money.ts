export const MAX_CENTS = 1_000_000_000;

export function parseUsdCents(value: string): number | null {
  const normalized = value.trim();
  const match = /^(?:0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(normalized);

  if (!match) return null;

  const [dollars, fractional = ""] = normalized.split(".");
  const cents = Number(dollars) * 100 + Number(fractional.padEnd(2, "0"));

  return Number.isSafeInteger(cents) && cents <= MAX_CENTS ? cents : null;
}

export function formatUsdCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function allocateCents(
  totalCents: number,
  weightedIds: ReadonlyArray<{ id: string; weight: number }>,
): Map<string, number> {
  const totalWeight = weightedIds.reduce((sum, entry) => sum + entry.weight, 0);
  const allocation = new Map<string, number>();

  if (totalWeight <= 0) return allocation;

  let allocated = 0;

  const remainders = weightedIds.map((entry) => {
    const numerator = totalCents * entry.weight;
    const cents = Math.floor(numerator / totalWeight);

    allocated += cents;
    allocation.set(entry.id, cents);

    return { id: entry.id, remainder: numerator % totalWeight };
  });

  remainders
    // Stable sort: ties go to whoever comes first in `weightedIds`
    .sort((left, right) => right.remainder - left.remainder)
    .slice(0, totalCents - allocated)
    .forEach(({ id }) => allocation.set(id, (allocation.get(id) ?? 0) + 1));

  return allocation;
}
