import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/session";
import { requireHousehold } from "@/server/household";
import { listShoppingLists } from "@/server/shopping-list";
import { NewShoppingListForm } from "@/components/shopping-list-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteShoppingListAction } from "@/server/actions/shopping-list";

export const metadata: Metadata = {
  title: "Listas de compras",
};

export default async function ShoppingListsPage() {
  const user = await requireUser();
  const household = await requireHousehold(user.id);
  const lists = await listShoppingLists(household.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Listas de compras</h1>
        <p className="mt-1 text-sm text-slate-500">Planeje o que comprar.</p>
      </div>

      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Nova lista</h2>
        <NewShoppingListForm />
      </div>

      {lists.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma lista criada ainda.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {lists.map((list) => {
            const remaining = list.items.filter((i) => !i.done).length;
            return (
              <li key={list.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <Link href={`/shopping-lists/${list.id}`} className="min-w-0">
                    <p className="truncate font-medium text-slate-900 hover:text-emerald-700">
                      {list.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {remaining} item{remaining === 1 ? "" : "s"} pendente
                      {remaining === 1 ? "" : "s"}
                    </p>
                  </Link>
                  <form action={deleteShoppingListAction}>
                    <input type="hidden" name="listId" value={list.id} />
                    <ConfirmSubmitButton
                      message={`Excluir a lista "${list.name}"?`}
                      className="rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                    >
                      Excluir
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
