import { prisma } from "@despensa/database";
import type {
  CreateCategoryInput,
  CreateProductInput,
  UpdateProductInput,
} from "@/lib/validations/product";

export function listCategories(householdId: string) {
  return prisma.productCategory.findMany({
    where: { householdId },
    orderBy: { name: "asc" },
  });
}

export function listProducts(householdId: string) {
  return prisma.product.findMany({
    where: { householdId },
    include: { category: true },
    orderBy: { name: "asc" },
  });
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}

export async function createProduct(householdId: string, input: CreateProductInput) {
  const categoryId = input.categoryId || null;
  const brand = input.brand || null;

  if (categoryId) {
    const category = await prisma.productCategory.findFirst({
      where: { id: categoryId, householdId },
    });
    if (!category) {
      throw new Error("Categoria inválida");
    }
  }

  const existing = await prisma.product.findFirst({
    where: { householdId, name: input.name, brand },
  });
  if (existing) {
    throw new Error("Produto já cadastrado com este nome e marca");
  }

  try {
    return await prisma.product.create({
      data: {
        householdId,
        name: input.name,
        brand,
        unit: input.unit,
        minStockLevel: input.minStockLevel,
        categoryId,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("Produto já cadastrado com este nome e marca");
    }
    throw error;
  }
}

export async function deleteProduct(householdId: string, productId: string) {
  return prisma.product.deleteMany({
    where: { id: productId, householdId },
  });
}

export async function updateProduct(
  householdId: string,
  productId: string,
  input: UpdateProductInput,
) {
  const current = await prisma.product.findFirst({
    where: { id: productId, householdId },
  });
  if (!current) {
    throw new Error("Produto não encontrado");
  }

  const categoryId = input.categoryId || null;
  const brand = input.brand || null;

  if (categoryId) {
    const category = await prisma.productCategory.findFirst({
      where: { id: categoryId, householdId },
    });
    if (!category) {
      throw new Error("Categoria inválida");
    }
  }

  const duplicate = await prisma.product.findFirst({
    where: { householdId, name: input.name, brand },
  });
  if (duplicate && duplicate.id !== productId) {
    throw new Error("Produto já cadastrado com este nome e marca");
  }

  try {
    return await prisma.product.update({
      where: { id: productId },
      data: {
        name: input.name,
        brand,
        unit: input.unit,
        minStockLevel: input.minStockLevel,
        categoryId,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("Produto já cadastrado com este nome e marca");
    }
    throw error;
  }
}

export async function createCategory(householdId: string, input: CreateCategoryInput) {
  const existing = await prisma.productCategory.findFirst({
    where: { householdId, name: input.name },
  });
  if (existing) {
    throw new Error("Categoria já cadastrada");
  }

  try {
    return await prisma.productCategory.create({
      data: { householdId, name: input.name },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("Categoria já cadastrada");
    }
    throw error;
  }
}

export async function deleteCategory(householdId: string, categoryId: string) {
  return prisma.productCategory.deleteMany({
    where: { id: categoryId, householdId },
  });
}

export async function countInventoryEntries(householdId: string): Promise<Map<string, number>> {
  const rows = await prisma.inventoryItem.findMany({
    where: { householdId },
    select: { productId: true },
  });
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.productId, (counts.get(row.productId) ?? 0) + 1);
  }
  return counts;
}
