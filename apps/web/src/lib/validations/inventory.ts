import { z } from "zod";

const optionalDate = z
  .union([z.string().trim(), z.date(), z.undefined()])
  .transform((value) => {
    if (value === undefined || value === "") {
      return undefined;
    }
    const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }
    return date;
  });

export const addInventoryItemSchema = z.object({
  productId: z.string().min(1, "Selecione um produto"),
  quantity: z.coerce.number().int().positive("Quantidade deve ser maior que zero").max(1_000_000),
  purchaseDate: optionalDate,
  expirationDate: optionalDate,
});

export const consumeInventorySchema = z.object({
  productId: z.string().min(1, "Selecione um produto"),
  quantity: z.coerce.number().int().positive("Quantidade deve ser maior que zero").max(1_000_000),
});

export const removeInventoryItemSchema = z.object({
  itemId: z.string().min(1),
});

export type AddInventoryItemInput = z.infer<typeof addInventoryItemSchema>;
export type ConsumeInventoryInput = z.infer<typeof consumeInventorySchema>;
