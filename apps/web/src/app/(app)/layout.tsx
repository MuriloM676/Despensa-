import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { requireHousehold } from "@/server/household";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser().catch(() => null);
  if (!user) {
    redirect("/login");
  }

  const household = await requireHousehold(user.id);

  return (
    <AppShell userName={user.name ?? user.email} householdName={household.name}>
      {children}
    </AppShell>
  );
}
