import { z } from "zod";

export const STOCK_EVENT_KINDS = ["PURCHASE", "CONSUME", "REMOVE"] as const;

export type StockEventKind = (typeof STOCK_EVENT_KINDS)[number];

export const listStockEventsSchema = z.object({
  productId: z.string().trim().min(1).optional().or(z.literal("")),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

export const stockEventKindSchema = z.enum(STOCK_EVENT_KINDS);

export type ListStockEventsInput = z.infer<typeof listStockEventsSchema>;
