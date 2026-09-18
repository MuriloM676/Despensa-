"use client";

import { useActionState } from "react";
import { Button, Input } from "@despensa/ui";
import {
  updateProductAction,
  type ProductActionState,
} from "@/server/actions/product";

export interface EditableProduct {
  id: string;
  name: string;
  brand: string | null;
  unit: string;
  categoryId: string | null;
}

export function ProductEditForm({
  product,
  categories,
}: {
  product: EditableProduct;
  categories: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ProductActionState, FormData>(
    updateProductAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4 pt-3">
      <input type="hidden" name="productId" value={product.id} />
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="space-y-1">
        <label htmlFor={`name-${product.id}`} className="block text-sm font-medium text-slate-700">
          Nome
        </label>
        <Input
          id={`name-${product.id}`}
          name="name"
          type="text"
          required
          defaultValue={product.name}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor={`brand-${product.id}`}
            className="block text-sm font-medium text-slate-700"
          >
            Marca
          </label>
          <Input
            id={`brand-${product.id}`}
            name="brand"
            type="text"
            placeholder="Opcional"
            defaultValue={product.brand ?? ""}
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor={`categoryId-${product.id}`}
            className="block text-sm font-medium text-slate-700"
          >
            Categoria
          </label>
          <select
            id={`categoryId-${product.id}`}
            name="categoryId"
            defaultValue={product.categoryId ?? ""}
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
        <label htmlFor={`unit-${product.id}`} className="block text-sm font-medium text-slate-700">
          Unidade
        </label>
        <Input id={`unit-${product.id}`} name="unit" type="text" defaultValue={product.unit} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
