import { z } from "zod";

export const priceHistorySchema = z.object({
  card_id: z.string().min(1, "Card ID is required"),
  market_price: z.number().positive("Price must be positive").nullable().optional(),
  recorded_at: z.string().min(1, "Recorded at is required"),
});

export type PriceHistoryFormData = z.infer<typeof priceHistorySchema>;
