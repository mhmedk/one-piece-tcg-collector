import { z } from "zod";

export const conditionOptions = [
  "Near Mint",
  "Lightly Played",
  "Moderately Played",
  "Heavily Played",
  "Damaged",
] as const;

export const addToCollectionSchema = z.object({
  cardId: z.string().min(1, "Card ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  condition: z.enum(conditionOptions),
  purchasePrice: z.number().positive("Price must be positive").optional(),
  notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
});

export const updateCollectionEntrySchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1").optional(),
  condition: z.enum(conditionOptions).optional(),
  purchasePrice: z.number().positive("Price must be positive").nullable().optional(),
  notes: z.string().max(500, "Notes must be 500 characters or less").nullable().optional(),
});

export type AddToCollectionData = z.infer<typeof addToCollectionSchema>;
export type UpdateCollectionEntryData = z.infer<typeof updateCollectionEntrySchema>;
export type CardCondition = (typeof conditionOptions)[number];
