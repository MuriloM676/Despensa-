import { z } from "zod";

const productFields = {
  name: z.string().trim().min(1, "Informe o nome").max(120),
  brand: z.string().trim().max(120).optional().or(z.literal("")),
  unit: z.string().trim().min(1, "Informe a unidade").max(20).default("un"),
  categoryId: z.string().optional().or(z.literal("")),
};

export const createProductSchema = z.object(productFields);

export const updateProductSchema = z.object({
  productId: z.string().min(1, "Produto inválido"),
  ...productFields,
});

export const deleteProductSchema = z.object({
  productId: z.string().min(1, "Produto inválido"),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da categoria").max(120),
});

export const deleteCategorySchema = z.object({
  categoryId: z.string().min(1, "Categoria inválida"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type DeleteProductInput = z.infer<typeof deleteProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
