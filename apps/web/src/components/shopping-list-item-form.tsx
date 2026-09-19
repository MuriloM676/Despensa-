"use client";

import { useActionState } from "react";
import { Button, Input } from "@despensa/ui";
import {
  addShoppingListItemAction,
  type ShoppingListActionState,
} from "@/server/actions/shopping-list";

export function ShoppingListItemForm({
  listId,
  products,
}: {
  listId: string;
  products: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ShoppingListActionState, FormData>(
    addShoppingListItemAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="listId" value={listId} />
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="productId" className="block text-sm font-medium text-slate-700">
          Produto
        </label>
        <select
          id="productId"
          name="productId"
          className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Sem produto (digite um nome)</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Nome
        </label>
        <Input id="name" name="name" type="text" placeholder="Ex.: Papel toalha" />
      </div>

      <div className="space-y-1">
        <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">
          Quantidade
        </label>
        <Input id="quantity" name="quantity" type="number" min="0.001" step="0.001" inputMode="decimal" placeholder="Ex.: 0,5" defaultValue={1} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Adicionando..." : "Adicionar item"}
      </Button>
    </form>
  );
}
