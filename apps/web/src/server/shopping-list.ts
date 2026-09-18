import { prisma } from "@despensa/database";
import type {
  CreateShoppingListInput,
  AddShoppingListItemInput,
} from "@/lib/validations/shopping-list";

export function listShoppingLists(householdId: string) {
  return prisma.shoppingList.findMany({
    where: { householdId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function getShoppingList(householdId: string, listId: string) {
  return prisma.shoppingList.findFirst({
    where: { id: listId, householdId },
    include: {
      items: {
        include: { product: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function createShoppingList(householdId: string, input: CreateShoppingListInput) {
  return prisma.shoppingList.create({
    data: {
      householdId,
      name: input.name,
    },
  });
}

export async function deleteShoppingList(householdId: string, listId: string) {
  const result = await prisma.shoppingList.deleteMany({
    where: { id: listId, householdId },
  });
  if (result.count === 0) {
    throw new Error("Lista não encontrada");
  }
}

export async function addShoppingListItem(householdId: string, input: AddShoppingListItemInput) {
  const list = await prisma.shoppingList.findFirst({
    where: { id: input.listId, householdId },
  });
  if (!list) {
    throw new Error("Lista não encontrada");
  }

  const productId = input.productId || null;
  const trimmedName = input.name?.trim() || null;

  if (!productId && !trimmedName) {
    throw new Error("Informe o nome ou selecione um produto");
  }

  return prisma.shoppingListItem.create({
    data: {
      listId: input.listId,
      productId,
      name: trimmedName,
      quantity: input.quantity,
    },
  });
}

export async function toggleShoppingListItem(
  householdId: string,
  itemId: string,
  done: boolean,
) {
  const item = await prisma.shoppingListItem.findFirst({
    where: { id: itemId, list: { householdId } },
  });
  if (!item) {
    throw new Error("Item não encontrado");
  }
  return prisma.shoppingListItem.update({
    where: { id: itemId },
    data: { done },
  });
}

export async function deleteShoppingListItem(householdId: string, itemId: string) {
  const item = await prisma.shoppingListItem.findFirst({
    where: { id: itemId, list: { householdId } },
  });
  if (!item) {
    throw new Error("Item não encontrado");
  }
  await prisma.shoppingListItem.delete({ where: { id: itemId } });
}
