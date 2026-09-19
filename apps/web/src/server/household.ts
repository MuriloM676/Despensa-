import { prisma } from "@despensa/database";
import { HouseholdRole } from "@despensa/types";

export async function getOrCreateHouseholdForUser(userId: string) {
  const existing = await prisma.householdMember.findFirst({
    where: { userId },
    include: { household: true },
  });

  if (existing) {
    return existing.household;
  }

  const household = await prisma.household.create({
    data: {
      name: "Minha despensa",
      members: {
        create: {
          userId,
          role: HouseholdRole.Owner,
        },
      },
    },
  });

  return household;
}

export async function requireHousehold(userId: string) {
  const household = await getOrCreateHouseholdForUser(userId);
  return household;
}

export async function updateAlertWindowDays(householdId: string, alertWindowDays: number) {
  return prisma.household.update({
    where: { id: householdId },
    data: { alertWindowDays },
  });
}
