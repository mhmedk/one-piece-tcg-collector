import { z } from "zod";

export const userSchema = z.object({
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  is_premium: z.boolean(),
  role: z.enum(["user", "admin"]),
});

export type UserFormData = z.infer<typeof userSchema>;
