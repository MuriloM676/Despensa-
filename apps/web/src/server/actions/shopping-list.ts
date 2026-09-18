"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { requireHousehold } from "@/server/household";
import {
  addShoppingListItemSchema,
  createShoppingListSchema,
  toggleShoppingListItemSchema,
  deleteShoppingListItemSchema,
  deleteShoppingListSchema,
  renameShoppingListSchema,
} from "@/lib/validations/shopping-list";
import {
  addShoppingListItem,
  createShoppingList,
  deleteShoppingList,
  deleteShoppingListItem,
  renameShoppingList,
  toggleShoppingListItem,
} from "@/server/shopping-list";

export type ShoppingListActionState = { error?: string };

export async function createShoppingListAction(
  _prevState: ShoppingListActionState,
  formData: FormData,
): Promise<ShoppingListActionState> {
  const parsed = createShoppingListSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const user = await requireUser();
  const household = await requireHousehold(user.id);

  await createShoppingList(household.id, parsed.data);

  revalidatePath("/shopping-lists");
  return {};
}

export async function addShoppingListItemAction(
  _prevState: ShoppingListActionState,
  formData: FormData,
): Promise<ShoppingListActionState> {
  const parsed = addShoppingListItemSchema.safeParse({
    listId: formData.get("listId"),
    name: formData.get("name"),
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const user = await requireUser();
  const household = await requireHousehold(user.id);

  await addShoppingListItem(household.id, parsed.data);

  revalidatePath(`/shopping-lists/${parsed.data.listId}`);
  revalidatePath("/shopping-lists");
  return {};
}

export async function toggleShoppingListItemAction(formData: FormData) {
  const parsed = toggleShoppingListItemSchema.safeParse({
    itemId: formData.get("itemId"),
    listId: formData.get("listId"),
    done: formData.get("done") === "true",
  });
  if (!parsed.success) {
    return;
  }

  const user = await requireUser();
  const household = await requireHousehold(user.id);

  await toggleShoppingListItem(household.id, parsed.data.itemId, parsed.data.done);

  revalidatePath(`/shopping-lists/${parsed.data.listId}`);
}

export async function deleteShoppingListAction(formData: FormData) {
  const parsed = deleteShoppingListSchema.safeParse({
    listId: formData.get("listId"),
  });
  if (!parsed.success) {
    return;
  }
  const user = await requireUser();
  const household = await requireHousehold(user.id);
  await deleteShoppingList(household.id, parsed.data.listId);
  revalidatePath("/shopping-lists");
}

export async function deleteShoppingListItemAction(formData: FormData) {
  const parsed = deleteShoppingListItemSchema.safeParse({
    itemId: formData.get("itemId"),
    listId: formData.get("listId"),
  });
  if (!parsed.success) {
    return;
  }
  const user = await requireUser();
  const household = await requireHousehold(user.id);
  await deleteShoppingListItem(household.id, parsed.data.itemId);
  revalidatePath(`/shopping-lists/${parsed.data.listId}`);
}

export async function renameShoppingListAction(
  _prevState: ShoppingListActionState,
  formData: FormData,
): Promise<ShoppingListActionState> {
  const parsed = renameShoppingListSchema.safeParse({
    listId: formData.get("listId"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const user = await requireUser();
  const household = await requireHousehold(user.id);

  try {
    await renameShoppingList(household.id, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao renomear lista" };
  }

  revalidatePath(`/shopping-lists/${parsed.data.listId}`);
  revalidatePath("/shopping-lists");
  return {};
}
