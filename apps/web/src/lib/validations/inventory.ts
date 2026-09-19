import { z } from "zod";

/**
 * Fractional quantities (B12): accepts inputs like `0,5` (pt-BR) or `0.5`,
 * requires a positive value with at most 3 decimal places, and normalizes
 * to a 3dp-rounded number so Prisma `Decimal(10,3)` writes stay exact.
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
    quantity: quantityField,
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
  quantity: quantityField,
});

export const removeInventoryItemSchema = z.object({
  itemId: z.string().min(1, "Item inválido"),
});

export type AddInventoryItemInput = z.infer<typeof addInventoryItemSchema>;
export type ConsumeInventoryInput = z.infer<typeof consumeInventorySchema>;
export type RemoveInventoryItemInput = z.infer<typeof removeInventoryItemSchema>;
