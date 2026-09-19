import { z } from "zod";

/**
 * Fractional quantities (B12): accepts `0,5` (pt-BR) or `0.5`, positive,
 * at most 3 decimal places, normalized to a 3dp-rounded number for
 * Prisma `Decimal(10,3)` writes.
 */
const quantityField = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().replace(",", ".") : value),
  z
    .coerce
    .number()
    .positive("Quantidade deve ser maior que zero")
    .max(1_000_000)
    .refine((n) => Math.abs(n * 1000 - Math.round(n * 1000)) < 1e-6, {
      message: "Use no máximo 3 casas decimais",
    })
    .transform((n) => Math.round(n * 1000) / 1000),
);

export const createShoppingListSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(120),
});

export const addShoppingListItemSchema = z.object({
  listId: z.string().min(1),
  name: z.string().trim().max(120).optional().or(z.literal("")),
  productId: z.string().optional().or(z.literal("")),
  quantity: quantityField,
}).refine((data) => data.productId || data.name, {
  message: "Informe o nome ou selecione um produto",
  path: ["name"],
});

export const toggleShoppingListItemSchema = z.object({
  itemId: z.string().min(1, "Item inválido"),
  listId: z.string().min(1, "Lista inválida"),
  done: z.boolean(),
});

export const deleteShoppingListItemSchema = z.object({
  itemId: z.string().min(1, "Item inválido"),
  listId: z.string().min(1, "Lista inválida"),
});

export const deleteShoppingListSchema = z.object({
  listId: z.string().min(1, "Lista inválida"),
});

export const renameShoppingListSchema = z.object({
  listId: z.string().min(1, "Lista inválida"),
  name: z.string().trim().min(1, "Informe o nome").max(120),
});

export type CreateShoppingListInput = z.infer<typeof createShoppingListSchema>;
export type AddShoppingListItemInput = z.infer<typeof addShoppingListItemSchema>;
export type DeleteShoppingListInput = z.infer<typeof deleteShoppingListSchema>;
export type RenameShoppingListInput = z.infer<typeof renameShoppingListSchema>;
