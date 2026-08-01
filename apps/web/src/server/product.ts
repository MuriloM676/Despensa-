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

export async function createProduct(householdId: string, input: CreateProductInput) {
  const categoryId = input.categoryId || null;
  return prisma.product.create({
    data: {
      householdId,
      name: input.name,
      brand: input.brand || null,
      unit: input.unit,
      categoryId,
    },
  });
}

export async function deleteProduct(householdId: string, productId: string) {
  return prisma.product.deleteMany({
    where: { id: productId, householdId },
  });
}
