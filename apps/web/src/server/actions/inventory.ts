"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { requireHousehold } from "@/server/household";
import {
  addInventoryItemSchema,
  consumeInventorySchema,
} from "@/lib/validations/inventory";
import { addInventoryItem, consumeInventory, removeInventoryItem } from "@/server/inventory";

export type InventoryActionState = { error?: string };

export async function addInventoryItemAction(
  _prevState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const parsed = addInventoryItemSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    purchaseDate: formData.get("purchaseDate"),
    expirationDate: formData.get("expirationDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const user = await requireUser();
  const household = await requireHousehold(user.id);

  await addInventoryItem(household.id, parsed.data);

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return {};
}

export async function consumeInventoryAction(
  _prevState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const parsed = consumeInventorySchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const user = await requireUser();
  const household = await requireHousehold(user.id);

  try {
    await consumeInventory(household.id, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao consumir" };
  }

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return {};
}

export async function removeInventoryItemAction(formData: FormData) {
  const user = await requireUser();
  const household = await requireHousehold(user.id);
  const itemId = formData.get("itemId");
  if (typeof itemId !== "string") {
    return;
  }
  await removeInventoryItem(household.id, itemId);
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
