import { z } from "zod";

export const createShoppingListSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(120),
});

export const addShoppingListItemSchema = z.object({
  listId: z.string().min(1),
  name: z.string().trim().max(120).optional().or(z.literal("")),
  productId: z.string().optional().or(z.literal("")),
  quantity: z.coerce.number().int().positive("Quantidade deve ser maior que zero").max(1_000_000),
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

export type CreateShoppingListInput = z.infer<typeof createShoppingListSchema>;
export type AddShoppingListItemInput = z.infer<typeof addShoppingListItemSchema>;
export type DeleteShoppingListInput = z.infer<typeof deleteShoppingListSchema>;
