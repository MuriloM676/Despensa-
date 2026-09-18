import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/session";
import { requireHousehold } from "@/server/household";
import { listInventory, countStockedProducts } from "@/server/inventory";
import { getExpirationStatus } from "@/server/expiration";
import { ExpirationStatus } from "@despensa/types";
import { Badge } from "@despensa/ui";

export const metadata: Metadata = {
  title: "Visão geral",
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("pt-BR");
}

export default async function DashboardPage() {
  const user = await requireUser();
  const household = await requireHousehold(user.id);
  const inventory = await listInventory(household.id);

  const withStatus = inventory.map((item) => ({
    ...item,
    status: getExpirationStatus(item.expirationDate),
  }));

  const expired = withStatus.filter((i) => i.status === ExpirationStatus.Expired);
  const expiringSoon = withStatus.filter((i) => i.status === ExpirationStatus.ExpiringSoon);

  const productCount = countStockedProducts(withStatus);

  const statusLabel: Record<ExpirationStatus, { text: string; tone: "red" | "amber" | "green" }> = {
    [ExpirationStatus.Expired]: { text: "Vencido", tone: "red" },
    [ExpirationStatus.ExpiringSoon]: { text: "Vence em breve", tone: "amber" },
    [ExpirationStatus.Valid]: { text: "Válido", tone: "green" },
  };

  const alerts = [...expired, ...expiringSoon];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Visão geral</h1>
        <p className="mt-1 text-sm text-slate-500">
          Olá, {user.name ?? "membro"}! Aqui está o resumo da sua despensa.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Produtos no estoque</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{productCount}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm text-amber-800">Vencem em breve</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">{expiringSoon.length}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-sm text-red-800">Vencidos</p>
          <p className="mt-1 text-2xl font-bold text-red-900">{expired.length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Atenção na validade</h2>
          <Link href="/inventory" className="text-sm font-medium text-emerald-600 hover:underline">
            Ver estoque
          </Link>
        </div>

        {alerts.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Nada para se preocupar por enquanto.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {alerts.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.product.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.quantity} {item.product.unit} · Vence em {formatDate(item.expirationDate)}
                  </p>
                </div>
                <Badge tone={statusLabel[item.status].tone}>
                  {statusLabel[item.status].text}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
