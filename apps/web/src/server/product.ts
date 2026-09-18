import { prisma } from "@despensa/database";
import type { CreateProductInput } from "@/lib/validations/product";

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
