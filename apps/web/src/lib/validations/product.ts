import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(120),
  brand: z.string().trim().max(120).optional().or(z.literal("")),
  unit: z.string().trim().min(1, "Informe a unidade").max(20).default("un"),
  categoryId: z.string().optional().or(z.literal("")),
});

export const deleteProductSchema = z.object({
  productId: z.string().min(1, "Produto inválido"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type DeleteProductInput = z.infer<typeof deleteProductSchema>;
