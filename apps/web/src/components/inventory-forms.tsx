"use client";

import { useActionState } from "react";
import { Button, Input } from "@despensa/ui";
import {
  addInventoryItemAction,
  consumeInventoryAction,
  type InventoryActionState,
} from "@/server/actions/inventory";

export function AddInventoryForm({
  products,
}: {
  products: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<InventoryActionState, FormData>(
    addInventoryItemAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
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
          required
          className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Selecione...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">
          Quantidade
        </label>
        <Input id="quantity" name="quantity" type="number" min={1} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="purchaseDate" className="block text-sm font-medium text-slate-700">
            Data da compra
          </label>
          <Input id="purchaseDate" name="purchaseDate" type="date" />
        </div>
        <div className="space-y-1">
          <label htmlFor="expirationDate" className="block text-sm font-medium text-slate-700">
            Validade
          </label>
          <Input id="expirationDate" name="expirationDate" type="date" />
        </div>
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Adicionando..." : "Adicionar ao estoque"}
      </Button>
    </form>
  );
}

export function ConsumeInventoryForm({
  products,
}: {
  products: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<InventoryActionState, FormData>(
    consumeInventoryAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
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
          required
          className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Selecione...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">
          Quantidade
        </label>
        <Input id="quantity" name="quantity" type="number" min={1} required />
      </div>

      <Button type="submit" variant="secondary" disabled={pending} className="w-full">
        {pending ? "Consumindo..." : "Consumir (FEFO)"}
      </Button>
    </form>
  );
}
