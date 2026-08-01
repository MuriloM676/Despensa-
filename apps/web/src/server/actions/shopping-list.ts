"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { requireHousehold } from "@/server/household";
import {
  addShoppingListItemSchema,
  createShoppingListSchema,
  toggleShoppingListItemSchema,
  deleteShoppingListItemSchema,
} from "@/lib/validations/shopping-list";
import {
  addShoppingListItem,
  createShoppingList,
  deleteShoppingList,
  deleteShoppingListItem,
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
  const user = await requireUser();
  const household = await requireHousehold(user.id);

  const itemId = formData.get("itemId");
  const done = formData.get("done") === "true";
  const listId = formData.get("listId");

  if (typeof itemId !== "string" || typeof listId !== "string") {
    return;
  }

  const parsed = toggleShoppingListItemSchema.safeParse({ itemId, done });
  if (!parsed.success) {
    return;
  }

  await toggleShoppingListItem(household.id, parsed.data.itemId, parsed.data.done);

  revalidatePath(`/shopping-lists/${listId}`);
}

export async function deleteShoppingListAction(formData: FormData) {
  const user = await requireUser();
  const household = await requireHousehold(user.id);
  const listId = formData.get("listId");
  if (typeof listId !== "string") {
    return;
  }
  await deleteShoppingList(household.id, listId);
  revalidatePath("/shopping-lists");
}

export async function deleteShoppingListItemAction(formData: FormData) {
  const user = await requireUser();
  const household = await requireHousehold(user.id);
  const itemId = formData.get("itemId");
  const listId = formData.get("listId");
  if (typeof itemId !== "string" || typeof listId !== "string") {
    return;
  }
  const parsed = deleteShoppingListItemSchema.safeParse({ itemId });
  if (!parsed.success) {
    return;
  }
  await deleteShoppingListItem(household.id, parsed.data.itemId);
  revalidatePath(`/shopping-lists/${listId}`);
}
