"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { requireHousehold } from "@/server/household";
import {
  createCategorySchema,
  createProductSchema,
  deleteCategorySchema,
  deleteProductSchema,
  updateProductSchema,
} from "@/lib/validations/product";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  updateProduct,
} from "@/server/product";

export type ProductActionState = { error?: string };

export type CategoryActionState = { error?: string };

function revalidateProductPages(): void {
  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

export async function createProductAction(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsed = createProductSchema.safeParse({
    name: formData.get("name"),
    brand: formData.get("brand"),
    unit: formData.get("unit"),
    categoryId: formData.get("categoryId"),
    minStockLevel: formData.get("minStockLevel"),
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

  revalidateProductPages();
  return {};
}

export async function updateProductAction(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsed = updateProductSchema.safeParse({
    productId: formData.get("productId"),
    name: formData.get("name"),
    brand: formData.get("brand"),
    unit: formData.get("unit"),
    categoryId: formData.get("categoryId"),
    minStockLevel: formData.get("minStockLevel"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const user = await requireUser();
  const household = await requireHousehold(user.id);

  try {
    await updateProduct(household.id, parsed.data.productId, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao atualizar produto" };
  }

  revalidateProductPages();
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

export async function createCategoryAction(
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const parsed = createCategorySchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const user = await requireUser();
  const household = await requireHousehold(user.id);

  try {
    await createCategory(household.id, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao criar categoria" };
  }

  revalidatePath("/products");
  return {};
}

export async function deleteCategoryAction(formData: FormData) {
  const parsed = deleteCategorySchema.safeParse({
    categoryId: formData.get("categoryId"),
  });
  if (!parsed.success) {
    return;
  }
  const user = await requireUser();
  const household = await requireHousehold(user.id);
  await deleteCategory(household.id, parsed.data.categoryId);
  revalidatePath("/products");
}
