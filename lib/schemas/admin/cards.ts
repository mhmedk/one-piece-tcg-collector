import { z } from "zod";

export const cardSchema = z.object({
  id: z.string().min(1, "Card ID is required"),
  pack_id: z.string().min(1, "Pack ID is required"),
  name: z.string().min(1, "Name is required"),
  rarity: z.string().min(1, "Rarity is required"),
  category: z.string().min(1, "Category is required"),
  colors: z.array(z.string()).min(1, "At least one color is required"),
  cost: z.number().int().nullable().optional(),
  power: z.number().int().nullable().optional(),
  counter: z.number().int().nullable().optional(),
  life: z.number().int().nullable().optional(),
  attributes: z.array(z.string()),
  types: z.array(z.string()),
  effect: z.string().nullable().optional(),
  trigger_text: z.string().nullable().optional(),
  img_url: z.string().min(1, "Image URL is required"),
  block_number: z.number().int().nullable().optional(),
});

export type CardFormData = z.infer<typeof cardSchema>;
