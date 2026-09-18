import { z } from "zod";

const dateField = z
  .union([z.string().trim(), z.date(), z.undefined(), z.null(), z.literal("")])
  .transform((value) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }
    const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
    return date;
  })
  .refine((date) => date === undefined || !Number.isNaN(date.getTime()), {
    message: "Data inválida",
  });

export const addInventoryItemSchema = z
  .object({
    productId: z.string().min(1, "Selecione um produto"),
    quantity: z.coerce.number().int().positive("Quantidade deve ser maior que zero").max(1_000_000),
    purchaseDate: dateField,
    expirationDate: dateField,
  })
  .refine(
    (data) =>
      data.purchaseDate === undefined ||
      data.expirationDate === undefined ||
      data.expirationDate >= data.purchaseDate,
    {
      message: "Validade deve ser igual ou posterior à data da compra",
      path: ["expirationDate"],
    },
  );

export const consumeInventorySchema = z.object({
  productId: z.string().min(1, "Selecione um produto"),
  quantity: z.coerce.number().int().positive("Quantidade deve ser maior que zero").max(1_000_000),
});

export const removeInventoryItemSchema = z.object({
  itemId: z.string().min(1, "Item inválido"),
});

export type AddInventoryItemInput = z.infer<typeof addInventoryItemSchema>;
export type ConsumeInventoryInput = z.infer<typeof consumeInventorySchema>;
export type RemoveInventoryItemInput = z.infer<typeof removeInventoryItemSchema>;
