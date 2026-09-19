import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/session";
import { requireHousehold } from "@/server/household";
import { listInventory, countStockedProducts } from "@/server/inventory";
import { listProducts } from "@/server/product";
import { getExpirationStatus, normalizeAlertWindowDays } from "@/server/expiration";
import { getReplenishmentSuggestions } from "@/server/stock-alerts";
import { listStockEvents } from "@/server/history";
import { formatQuantity } from "@/lib/quantity";
import { ExpirationStatus } from "@despensa/types";
import type { StockEventKind } from "@/lib/validations/history";
import { Badge } from "@despensa/ui";
import { AlertWindowForm } from "@/components/alert-window-form";

export const metadata: Metadata = {
  title: "Visão geral",
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("pt-BR");
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const eventLabel: Record<StockEventKind, { text: string; tone: "green" | "slate" | "red" }> = {
  PURCHASE: { text: "Compra", tone: "green" },
  CONSUME: { text: "Consumo", tone: "slate" },
  REMOVE: { text: "Remoção", tone: "red" },
};

export default async function DashboardPage() {
  const user = await requireUser();
  const household = await requireHousehold(user.id);
  const windowDays = normalizeAlertWindowDays(household.alertWindowDays);
  const now = new Date();

  const [inventory, suggestions, products, events] = await Promise.all([
    listInventory(household.id),
    getReplenishmentSuggestions(household.id),
    listProducts(household.id),
    listStockEvents(household.id, { limit: 8 }),
  ]);

  const productById = new Map(
    products.map((product) => [
      product.id,
      { name: product.name, unit: product.unit },
    ]),
  );

  const withStatus = inventory.map((item) => ({
    ...item,
    status: getExpirationStatus(item.expirationDate, now, windowDays),
  }));

  const expired = withStatus
    .filter((i) => i.status === ExpirationStatus.Expired)
    .sort((a, b) => (a.expirationDate?.getTime() ?? 0) - (b.expirationDate?.getTime() ?? 0));
  const expiringSoon = withStatus
    .filter((i) => i.status === ExpirationStatus.ExpiringSoon)
    .sort((a, b) => (a.expirationDate?.getTime() ?? 0) - (b.expirationDate?.getTime() ?? 0));

  const productCount = countStockedProducts(withStatus);

  const statusLabel: Record<ExpirationStatus, { text: string; tone: "red" | "amber" | "green" }> = {
    [ExpirationStatus.Expired]: { text: "Vencido", tone: "red" },
    [ExpirationStatus.ExpiringSoon]: { text: "Vence em breve", tone: "amber" },
    [ExpirationStatus.Valid]: { text: "Válido", tone: "green" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Visão geral</h1>
        <p className="mt-1 text-sm text-slate-500">
          Olá, {user.name ?? "membro"}! Aqui está o resumo da sua despensa.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <p className="text-sm text-orange-800">Estoque baixo</p>
          <p className="mt-1 text-2xl font-bold text-orange-900">{suggestions.length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Atenção na validade</h2>
          <Link href="/inventory" className="text-sm font-medium text-emerald-600 hover:underline">
            Ver estoque
          </Link>
        </div>

        {expired.length === 0 && expiringSoon.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Nada para se preocupar por enquanto.</p>
        ) : (
          <div className="mt-4 space-y-5">
            {expired.length > 0 ? (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-red-700">
                  Vencidos ({expired.length})
                </h3>
                <ul className="mt-1 divide-y divide-slate-100">
                  {expired.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.product.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatQuantity(item.quantity)} {item.product.unit} · Venceu em{" "}
                          {formatDate(item.expirationDate)}
                        </p>
                      </div>
                      <Badge tone={statusLabel[item.status].tone}>
                        {statusLabel[item.status].text}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {expiringSoon.length > 0 ? (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Vencem em breve ({expiringSoon.length})
                </h3>
                <ul className="mt-1 divide-y divide-slate-100">
                  {expiringSoon.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.product.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatQuantity(item.quantity)} {item.product.unit} · Vence em{" "}
                          {formatDate(item.expirationDate)}
                        </p>
                      </div>
                      <Badge tone={statusLabel[item.status].tone}>
                        {statusLabel[item.status].text}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}

        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500">
            Janela de alerta atual: {windowDays} {windowDays === 1 ? "dia" : "dias"}.
          </p>
          <AlertWindowForm currentDays={windowDays} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Estoque baixo e reposição</h2>
          <Link
            href="/shopping-lists"
            className="text-sm font-medium text-emerald-600 hover:underline"
          >
            Ver listas
          </Link>
        </div>

        {suggestions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Todos os produtos estão acima do estoque mínimo.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {suggestions.map((suggestion) => (
              <li key={suggestion.productId} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {suggestion.name}
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      {formatQuantity(suggestion.stock)} de {formatQuantity(suggestion.minStock)}{" "}
                      {suggestion.unit} em estoque
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Sugestão: comprar {formatQuantity(suggestion.suggested)} {suggestion.unit}
                  </p>
                </div>
                <Badge tone="amber">Estoque baixo</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Movimentações recentes</h2>
          <Link href="/history" className="text-sm font-medium text-emerald-600 hover:underline">
            Ver histórico
          </Link>
        </div>

        {events.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Nenhuma movimentação registrada ainda.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {events.map((event) => {
              const product = productById.get(event.productId);
              return (
                <li key={event.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {product?.name ?? "Produto removido"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatQuantity(event.quantity)} {product?.unit ?? ""} ·{" "}
                      {formatDateTime(event.createdAt)}
                    </p>
                  </div>
                  <Badge tone={eventLabel[event.kind].tone}>{eventLabel[event.kind].text}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
