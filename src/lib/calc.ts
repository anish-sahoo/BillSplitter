import type { Bill, Item, Receipt } from "../types";
import { allocateCents } from "./money";

export interface PersonShare {
  items: { item: Item; receiptId: string; cents: number; splitCount: number }[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
}

export interface ReceiptTotals {
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  /** Cost of items nobody is assigned to; left out of settle-up */
  unassignedCents: number;
  shares: Map<string, PersonShare>;
}

export interface Transfer {
  fromId: string;
  toId: string;
  cents: number;
}

export interface BillTotals {
  receipts: Map<string, ReceiptTotals>;
  shares: Map<string, PersonShare>;
  paidCents: Map<string, number>;
  grandTotalCents: number;
  unassignedCents: number;
  /** Receipts left out of settle-up because nobody is marked as the payer */
  receiptsWithoutPayer: Receipt[];
  transfers: Transfer[];
}

function emptyShare(): PersonShare {
  return { items: [], subtotalCents: 0, taxCents: 0, tipCents: 0, totalCents: 0 };
}

function percentOf(cents: number, percent: number): number {
  return Math.round((cents * percent) / 100);
}

export function receiptTotals(receipt: Receipt): ReceiptTotals {
  const shares = new Map<string, PersonShare>();

  const shareFor = (personId: string) => {
    let share = shares.get(personId);

    if (!share) {
      share = emptyShare();
      shares.set(personId, share);
    }

    return share;
  };

  let subtotalCents = 0;
  let unassignedCents = 0;

  receipt.items.forEach((item, index) => {
    subtotalCents += item.costCents;

    if (item.personIds.length === 0) {
      unassignedCents += item.costCents;

      return;
    }

    // Leftover cents go to whoever is first, so rotate the order per item to
    // keep one person from collecting every extra cent.
    const offset = index % item.personIds.length;
    const rotated = [...item.personIds.slice(offset), ...item.personIds.slice(0, offset)];

    const split = allocateCents(
      item.costCents,
      rotated.map((id) => ({ id, weight: 1 })),
    );

    for (const [personId, cents] of split) {
      const share = shareFor(personId);
      share.items.push({
        item,
        receiptId: receipt.id,
        cents,
        splitCount: item.personIds.length,
      });
      share.subtotalCents += cents;
    }
  });

  const taxCents = percentOf(subtotalCents, receipt.tax);
  const tipCents = percentOf(subtotalCents, receipt.tip);

  // Tax and tip are shared by the people on this receipt, either by how much
  // they ordered or evenly.
  const weights = (mode: Receipt["taxMode"]) =>
    [...shares].map(([id, share]) => ({
      id,
      weight: mode === "even" ? 1 : share.subtotalCents,
    }));

  for (const [id, cents] of allocateCents(taxCents, weights(receipt.taxMode)))
    shareFor(id).taxCents = cents;

  for (const [id, cents] of allocateCents(tipCents, weights(receipt.tipMode)))
    shareFor(id).tipCents = cents;

  for (const share of shares.values())
    share.totalCents = share.subtotalCents + share.taxCents + share.tipCents;

  return {
    subtotalCents,
    taxCents,
    tipCents,
    totalCents: subtotalCents + taxCents + tipCents,
    unassignedCents,
    shares,
  };
}

// Greedy: the biggest debtor pays the biggest creditor until everyone is even.
// Not always the fewest possible transfers, but close and easy to follow.
export function settle(balances: Map<string, number>): Transfer[] {
  const byAmount = (sign: 1 | -1) =>
    [...balances]
      .flatMap(([id, cents]) => (cents * sign > 0 ? [{ id, cents: cents * sign }] : []))
      .sort((a, b) => b.cents - a.cents || a.id.localeCompare(b.id));

  const creditors = byAmount(1);
  const debtors = byAmount(-1);
  const transfers: Transfer[] = [];
  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const cents = Math.min(debtors[d].cents, creditors[c].cents);
    transfers.push({ fromId: debtors[d].id, toId: creditors[c].id, cents });
    debtors[d].cents -= cents;
    creditors[c].cents -= cents;

    if (debtors[d].cents === 0) d++;

    if (creditors[c].cents === 0) c++;
  }

  return transfers;
}

export function billTotals(bill: Bill): BillTotals {
  const receipts = new Map<string, ReceiptTotals>();
  const shares = new Map(bill.persons.map((p) => [p.id, emptyShare()]));
  const paidCents = new Map(bill.persons.map((p) => [p.id, 0]));
  const balances = new Map(bill.persons.map((p) => [p.id, 0]));
  const receiptsWithoutPayer: Receipt[] = [];
  let grandTotalCents = 0;
  let unassignedCents = 0;

  for (const receipt of bill.receipts) {
    const totals = receiptTotals(receipt);
    receipts.set(receipt.id, totals);
    grandTotalCents += totals.totalCents;
    unassignedCents += totals.unassignedCents;

    for (const [personId, share] of totals.shares) {
      const combined = shares.get(personId);

      if (!combined) continue;
      combined.items.push(...share.items);
      combined.subtotalCents += share.subtotalCents;
      combined.taxCents += share.taxCents;
      combined.tipCents += share.tipCents;
      combined.totalCents += share.totalCents;
    }

    const payerKnown = receipt.paidBy !== null && paidCents.has(receipt.paidBy);

    if (!payerKnown) {
      if (totals.totalCents > 0) receiptsWithoutPayer.push(receipt);
      continue;
    }

    // The payer is only credited for what's actually been split, so unassigned
    // items don't leave anyone owed money that nobody owes.
    const splitCents = [...totals.shares.values()].reduce((sum, s) => sum + s.totalCents, 0);
    paidCents.set(receipt.paidBy!, (paidCents.get(receipt.paidBy!) ?? 0) + totals.totalCents);
    balances.set(receipt.paidBy!, (balances.get(receipt.paidBy!) ?? 0) + splitCents);

    for (const [personId, share] of totals.shares)
      balances.set(personId, (balances.get(personId) ?? 0) - share.totalCents);
  }

  return {
    receipts,
    shares,
    paidCents,
    grandTotalCents,
    unassignedCents,
    receiptsWithoutPayer,
    transfers: settle(balances),
  };
}
