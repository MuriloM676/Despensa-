"use client";

import { useActionState } from "react";
import { Button, Input } from "@despensa/ui";
import {
  createProductAction,
  type ProductActionState,
} from "@/server/actions/product";

export function ProductForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ProductActionState, FormData>(
    createProductAction,
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
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Nome
        </label>
        <Input id="name" name="name" type="text" required placeholder="Ex.: Leite integral" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="brand" className="block text-sm font-medium text-slate-700">
            Marca
          </label>
          <Input id="brand" name="brand" type="text" placeholder="Opcional" />
        </div>
        <div className="space-y-1">
          <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700">
            Categoria
          </label>
          <select
            id="categoryId"
            name="categoryId"
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="unit" className="block text-sm font-medium text-slate-700">
          Unidade
        </label>
        <Input id="unit" name="unit" type="text" defaultValue="un" placeholder="Ex.: un, L, kg" />
      </div>

      <div className="space-y-1">
        <label htmlFor="minStockLevel" className="block text-sm font-medium text-slate-700">
          Estoque mínimo
        </label>
        <Input
          id="minStockLevel"
          name="minStockLevel"
          type="number"
          min="0"
          step="0.001"
          defaultValue="0"
          placeholder="Ex.: 2 — 0 significa sem mínimo"
        />
        <p className="text-xs text-slate-500">
          Abaixo desse nível o produto aparece como estoque baixo.
        </p>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Adicionar produto"}
      </Button>
    </form>
  );
}
