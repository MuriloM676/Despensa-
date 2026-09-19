import { z } from "zod";
import { MAX_ALERT_WINDOW_DAYS, MIN_ALERT_WINDOW_DAYS } from "@/server/expiration";

export const updateAlertWindowSchema = z.object({
  alertWindowDays: z.coerce
    .number()
    .int("Janela de alerta deve ser um número inteiro de dias")
    .min(MIN_ALERT_WINDOW_DAYS, "Janela de alerta mínima: 1 dia")
    .max(MAX_ALERT_WINDOW_DAYS, "Janela de alerta máxima: 30 dias"),
});

export type UpdateAlertWindowInput = z.infer<typeof updateAlertWindowSchema>;
