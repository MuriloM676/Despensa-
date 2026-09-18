import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { requireHousehold } from "@/server/household";
import { listInventory } from "@/server/inventory";
import { listProducts } from "@/server/product";
import { getExpirationStatus } from "@/server/expiration";
import { ExpirationStatus } from "@despensa/types";
import { Badge } from "@despensa/ui";
import { AddInventoryForm, ConsumeInventoryForm } from "@/components/inventory-forms";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { removeInventoryItemAction } from "@/server/actions/inventory";

export const metadata: Metadata = {
  title: "Estoque",
};

function formatDate(date: Date | null): string {
  if (!date) return "Sem validade";
  return date.toLocaleDateString("pt-BR");
}

export default async function InventoryPage() {
  const user = await requireUser();
  const household = await requireHousehold(user.id);
  const [inventory, products] = await Promise.all([
    listInventory(household.id),
    listProducts(household.id),
  ]);

  const grouped = new Map<string, typeof inventory>();
  for (const item of inventory) {
    const list = grouped.get(item.productId) ?? [];
    list.push(item);
    grouped.set(item.productId, list);
  }

  const statusTone: Record<ExpirationStatus, "red" | "amber" | "green" | "slate"> = {
    [ExpirationStatus.Expired]: "red",
    [ExpirationStatus.ExpiringSoon]: "amber",
    [ExpirationStatus.Valid]: "green",
  };

  const statusLabel: Record<ExpirationStatus, string> = {
    [ExpirationStatus.Expired]: "Vencido",
    [ExpirationStatus.ExpiringSoon]: "Vence em breve",
    [ExpirationStatus.Valid]: "Válido",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Estoque</h1>
        <p className="mt-1 text-sm text-slate-500">
          Registre entradas e consuma seguindo a ordem de validade (FEFO).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Adicionar</h2>
            <AddInventoryForm products={products} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Consumir</h2>
            <ConsumeInventoryForm products={products} />
          </div>
        </div>

        <div className="space-y-4">
          {inventory.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Nenhum item no estoque. Adicione uma entrada ao lado.
            </div>
          ) : (
            [...grouped.entries()].map(([productId, items]) => {
              const product = items[0]!.product;
              const total = items.reduce((sum, i) => sum + i.quantity, 0);
              return (
                <div key={productId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900">
                      {product.name}
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        {total} {product.unit} no total
                      </span>
                    </h2>
                  </div>
                  <ul className="mt-3 divide-y divide-slate-100">
                    {items.map((item) => {
                      const status = getExpirationStatus(item.expirationDate);
                      return (
                        <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                          <div>
                            <p className="text-sm text-slate-700">
                              {item.quantity} {product.unit}
                            </p>
                            <p className="text-xs text-slate-500">
                              Comprado em {formatDate(item.purchaseDate)} · Vence {formatDate(item.expirationDate)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge tone={statusTone[status]}>{statusLabel[status]}</Badge>
                            <form action={removeInventoryItemAction}>
                              <input type="hidden" name="itemId" value={item.id} />
                              <ConfirmSubmitButton
                                message="Remover este item do estoque?"
                                className="rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                                title="Remover item"
                              >
                                Remover
                              </ConfirmSubmitButton>
                            </form>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
