import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/session";
import { requireHousehold } from "@/server/household";
import { listProducts } from "@/server/product";
import { listStockEvents } from "@/server/history";
import { formatQuantity } from "@/lib/quantity";
import type { StockEventKind } from "@/lib/validations/history";
import { Badge } from "@despensa/ui";

export const metadata: Metadata = {
  title: "Histórico",
};

const eventLabel: Record<StockEventKind, { text: string; tone: "green" | "slate" | "red" }> = {
  PURCHASE: { text: "Compra", tone: "green" },
  CONSUME: { text: "Consumo", tone: "slate" },
  REMOVE: { text: "Remoção", tone: "red" },
};

function formatDateTime(date: Date): string {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>;
}) {
  const user = await requireUser();
  const household = await requireHousehold(user.id);
  const { productId } = await searchParams;
  const selectedProductId = productId?.trim() ? productId : undefined;

  const [products, events] = await Promise.all([
    listProducts(household.id),
    listStockEvents(household.id, { productId: selectedProductId, limit: 100 }),
  ]);

  const productById = new Map(
    products.map((product) => [
      product.id,
      { name: product.name, unit: product.unit },
    ]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Histórico</h1>
        <p className="mt-1 text-sm text-slate-500">
          Compras, consumos e remoções do estoque da sua casa.
        </p>
      </div>

      <form method="get" className="flex items-end gap-2">
        <div className="w-64 space-y-1">
          <label htmlFor="productId" className="block text-sm font-medium text-slate-700">
            Filtrar por produto
          </label>
          <select
            id="productId"
            name="productId"
            defaultValue={selectedProductId ?? ""}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Todos os produtos</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Filtrar
        </button>
        {selectedProductId ? (
          <Link
            href="/history"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Limpar
          </Link>
        ) : null}
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {events.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma movimentação encontrada.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
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
