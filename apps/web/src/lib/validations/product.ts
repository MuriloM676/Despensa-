import { z } from "zod";

/**
 * Minimum stock level (MVP 2, BR-001 of `replenishment.md`): non-negative,
 * up to 3 decimal places. Unlike inventory quantities it may be zero, which
 * means "no minimum" (BR-004).
 */
const minStockLevelField = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === "") {
      return 0;
    }
    return typeof value === "string" ? value.trim().replace(",", ".") : value;
  },
  z
    .coerce
    .number()
    .min(0, "Estoque mínimo não pode ser negativo")
    .max(1_000_000)
    .refine((n) => Math.abs(n * 1000 - Math.round(n * 1000)) < 1e-6, {
      message: "Use no máximo 3 casas decimais",
    })
    .transform((n) => Math.round(n * 1000) / 1000),
);

const productFields = {
  name: z.string().trim().min(1, "Informe o nome").max(120),
  brand: z.string().trim().max(120).optional().or(z.literal("")),
  unit: z.string().trim().min(1, "Informe a unidade").max(20).default("un"),
  categoryId: z.string().optional().or(z.literal("")),
  // Optional for callers (defaults to 0 = "no minimum"); always a number after parse.
  minStockLevel: minStockLevelField.default(0),
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
