import { z } from "zod";

export const collectionEntrySchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  card_id: z.string().min(1, "Card ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  condition: z.string().min(1, "Condition is required"),
  purchase_price: z.number().positive().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export type CollectionEntryFormData = z.infer<typeof collectionEntrySchema>;
