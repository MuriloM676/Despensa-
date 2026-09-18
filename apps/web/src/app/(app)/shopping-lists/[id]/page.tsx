import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/session";
import { requireHousehold } from "@/server/household";
import { getShoppingList } from "@/server/shopping-list";
import { listProducts } from "@/server/product";
import { ShoppingListItemForm } from "@/components/shopping-list-item-form";
import { RenameShoppingListForm } from "@/components/shopping-list-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import {
  toggleShoppingListItemAction,
  deleteShoppingListItemAction,
} from "@/server/actions/shopping-list";

export const metadata: Metadata = {
  title: "Lista de compras",
};

export default async function ShoppingListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const household = await requireHousehold(user.id);

  const [list, products] = await Promise.all([
    getShoppingList(household.id, id),
    listProducts(household.id),
  ]);

  if (!list) {
    notFound();
  }

  const pendingItems = list.items.filter((i) => !i.done);
  const doneItems = list.items.filter((i) => i.done);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{list.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {list.items.length} item{list.items.length === 1 ? "" : "s"} na lista.
        </p>
        <div className="mt-3 max-w-md">
          <RenameShoppingListForm listId={list.id} currentName={list.name} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Adicionar item</h2>
          <ShoppingListItemForm listId={list.id} products={products} />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">Pendentes</h2>
            {pendingItems.length === 0 ? (
              <p className="text-sm text-slate-500">Tudo comprado!</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pendingItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-3">
                      <form action={toggleShoppingListItemAction}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="listId" value={list.id} />
                        <input type="hidden" name="done" value="true" />
                        <button
                          type="submit"
                          className="h-5 w-5 rounded border border-slate-300 hover:border-emerald-500"
                          aria-label={`Marcar ${item.product?.name ?? item.name} como comprado`}
                        />
                      </form>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {item.product?.name ?? item.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.quantity} {item.product?.unit ?? "un"}
                        </p>
                      </div>
                    </div>
                    <form action={deleteShoppingListItemAction}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="listId" value={list.id} />
                      <ConfirmSubmitButton
                        message="Remover este item da lista?"
                        className="rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                      >
                        Remover
                      </ConfirmSubmitButton>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {doneItems.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm opacity-60">
              <h2 className="mb-2 text-sm font-semibold text-slate-900">Comprados</h2>
              <ul className="divide-y divide-slate-100">
                {doneItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    <form action={toggleShoppingListItemAction}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="listId" value={list.id} />
                      <input type="hidden" name="done" value="false" />
                      <button
                        type="submit"
                        className="flex h-5 w-5 items-center justify-center rounded border border-emerald-500 bg-emerald-500 text-white"
                        aria-label={`Desmarcar ${item.product?.name ?? item.name}`}
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                          <path
                            fillRule="evenodd"
                            d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <p className="text-sm text-slate-500 line-through">
                        {item.product?.name ?? item.name}
                      </p>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
