"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { requireHousehold } from "@/server/household";
import { createProductSchema, deleteProductSchema } from "@/lib/validations/product";
import { createProduct, deleteProduct } from "@/server/product";

export type ProductActionState = { error?: string };

export async function createProductAction(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsed = createProductSchema.safeParse({
    name: formData.get("name"),
    brand: formData.get("brand"),
    unit: formData.get("unit"),
    categoryId: formData.get("categoryId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const user = await requireUser();
  const household = await requireHousehold(user.id);

  try {
    await createProduct(household.id, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao criar produto" };
  }

  revalidatePath("/products");
  revalidatePath("/inventory");
  return {};
}

export async function deleteProductAction(formData: FormData) {
  const parsed = deleteProductSchema.safeParse({
    productId: formData.get("productId"),
  });
  if (!parsed.success) {
    return;
  }
  const user = await requireUser();
  const household = await requireHousehold(user.id);
  await deleteProduct(household.id, parsed.data.productId);
  revalidatePath("/products");
}
