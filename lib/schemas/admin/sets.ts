import { z } from "zod";

export const setSchema = z.object({
  id: z.string().min(1, "ID is required"),
  label: z.string().nullable().optional(),
  name: z.string().min(1, "Name is required"),
  prefix: z.string().nullable().optional(),
  raw_title: z.string().min(1, "Raw title is required"),
});

export type SetFormData = z.infer<typeof setSchema>;
