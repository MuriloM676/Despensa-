import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(120),
  brand: z.string().trim().max(120).optional().or(z.literal("")),
  unit: z.string().trim().max(20).default("un"),
  categoryId: z.string().optional().or(z.literal("")),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
