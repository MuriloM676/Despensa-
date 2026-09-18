import { z } from "zod";

const expirationField = z
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

export const purchaseToStockSchema = z.object({
  itemId: z.string().min(1, "Item inválido"),
  listId: z.string().min(1, "Lista inválida"),
  expirationDate: expirationField,
});

export type PurchaseToStockInput = z.infer<typeof purchaseToStockSchema>;
