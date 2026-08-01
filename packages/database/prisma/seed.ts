import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = ["Laticínios", "Hortifruti", "Carnes", "Grãos", "Bebidas", "Limpeza"];

async function main() {
  const existing = await prisma.household.findFirst();

  if (existing) {
    console.log("Seed skipped: a household already exists.");
    return;
  }

  const household = await prisma.household.create({
    data: { name: "Casa Demo" },
  });

  for (const name of CATEGORIES) {
    await prisma.productCategory.create({
      data: { name, householdId: household.id },
    });
  }

  console.log(`Seed complete: household "${household.name}" with ${CATEGORIES.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
