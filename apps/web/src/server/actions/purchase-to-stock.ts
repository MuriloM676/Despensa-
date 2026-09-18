"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { requireHousehold } from "@/server/household";
import { purchaseToStockSchema } from "@/lib/validations/purchase-to-stock";
import { purchaseToStock } from "@/server/purchase-to-stock";

export type PurchaseToStockActionState = { error?: string; success?: string };

export async function purchaseToStockAction(
  _prevState: PurchaseToStockActionState,
  formData: FormData,
): Promise<PurchaseToStockActionState> {
  const parsed = purchaseToStockSchema.safeParse({
    itemId: formData.get("itemId"),
    listId: formData.get("listId"),
    expirationDate: formData.get("expirationDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const user = await requireUser();
  const household = await requireHousehold(user.id);

  try {
    const result = await purchaseToStock(household.id, parsed.data);
    revalidatePath(`/shopping-lists/${parsed.data.listId}`);
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return {
      success: result.createdProduct
        ? "Produto criado e lançado no estoque"
        : "Lançado no estoque",
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao lançar no estoque" };
  }
}
