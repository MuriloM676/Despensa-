import { prisma } from "@despensa/database";
import { addInventoryItem } from "@/server/inventory";
import { createProduct } from "@/server/product";
import type { PurchaseToStockInput } from "@/lib/validations/purchase-to-stock";

export interface PurchaseToStockResult {
  productId: string;
  inventoryItemId: string;
  createdProduct: boolean;
}

interface ListItemLike {
  productId: string | null;
  name: string | null;
  done: boolean;
}

export type ProductResolution =
  | { mode: "existing"; productId: string }
  | { mode: "create"; name: string };

/**
 * Pure decision helper for BR-007: linked product is reused, otherwise a
 * product is created (or reused by name upstream) from the item name.
 * Throws when the item is not done (BR-006) or carries no product and no name.
 */
export function resolveProductForPurchase(item: ListItemLike): ProductResolution {
  if (!item.done) {
    throw new Error("Marque o item como comprado antes de lançar no estoque");
  }
  if (item.productId) {
    return { mode: "existing", productId: item.productId };
  }
  const name = item.name?.trim();
  if (!name) {
    throw new Error("Informe o nome ou selecione um produto");
  }
  return { mode: "create", name };
}

export async function purchaseToStock(
  householdId: string,
  input: PurchaseToStockInput,
): Promise<PurchaseToStockResult> {
  const item = await prisma.shoppingListItem.findFirst({
    where: { id: input.itemId, list: { id: input.listId, householdId } },
    include: { product: true },
  });

  if (!item) {
    throw new Error("Item não encontrado");
  }

  const resolution = resolveProductForPurchase({
    productId: item.productId,
    name: item.name,
    done: item.done,
  });

  let productId: string;
  let createdProduct = false;

  if (resolution.mode === "existing") {
    const product = await prisma.product.findFirst({
      where: { id: resolution.productId, householdId },
    });
    if (!product) {
      throw new Error("Produto não encontrado");
    }
    productId = product.id;
  } else {
    const existing = await prisma.product.findFirst({
      where: { householdId, name: resolution.name },
    });
    if (existing) {
      productId = existing.id;
    } else {
      const created = await createProduct(householdId, {
        name: resolution.name,
        brand: "",
        unit: "un",
        categoryId: "",
      });
      productId = created.id;
      createdProduct = true;
    }
  }

  const entry = await addInventoryItem(householdId, {
    productId,
    // B12: ShoppingListItem.quantity is Decimal at runtime; the domain takes numbers.
    quantity: typeof item.quantity === "number" ? item.quantity : Number(item.quantity),
    purchaseDate: undefined,
    expirationDate: input.expirationDate,
  });

  return { productId, inventoryItemId: entry.id, createdProduct };
}
