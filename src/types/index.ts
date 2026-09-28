import { z } from "zod";

// Schemas double as validation for anything read back from IndexedDB or
// decoded from a share link. Money is integer cents throughout.

export const splitModeSchema = z.enum(["proportional", "even"]);

export type SplitMode = z.infer<typeof splitModeSchema>;

const idSchema = z.string().min(1).max(64);

export const personSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(120),
});

export type Person = z.infer<typeof personSchema>;

export const itemSchema = z.object({
  id: idSchema,
  name: z.string().max(120), // empty string = no label
  costCents: z.number().int().min(0), // total cost = unit price × quantity
  quantity: z.number().int().min(1),
  personIds: z.array(idSchema),
});

export type Item = z.infer<typeof itemSchema>;

export const receiptSchema = z.object({
  id: idSchema,
  name: z.string().max(120),
  paidBy: idSchema.nullable(),
  items: z.array(itemSchema),
  tax: z.number().min(0), // percent
  taxMode: splitModeSchema,
  tip: z.number().min(0), // percent
  tipMode: splitModeSchema,
});

export type Receipt = z.infer<typeof receiptSchema>;

export const billSchema = z.object({
  id: idSchema,
  title: z.string().max(160),
  persons: z.array(personSchema),
  receipts: z.array(receiptSchema).min(1),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});

export type Bill = z.infer<typeof billSchema>;
