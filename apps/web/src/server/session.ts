import { auth } from "@/auth";
import { prisma } from "@despensa/database";

export class UnauthorizedError extends Error {
  constructor() {
    super("Not authenticated");
  }
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}
