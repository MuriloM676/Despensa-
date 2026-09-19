"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { requireHousehold, updateAlertWindowDays } from "@/server/household";
import { updateAlertWindowSchema } from "@/lib/validations/household";

export type HouseholdActionState = { error?: string };

export async function updateAlertWindowAction(
  _prevState: HouseholdActionState,
  formData: FormData,
): Promise<HouseholdActionState> {
  const parsed = updateAlertWindowSchema.safeParse({
    alertWindowDays: formData.get("alertWindowDays"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const user = await requireUser();
  const household = await requireHousehold(user.id);

  try {
    await updateAlertWindowDays(household.id, parsed.data.alertWindowDays);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao salvar janela de alerta" };
  }

  revalidatePath("/dashboard");
  return {};
}
