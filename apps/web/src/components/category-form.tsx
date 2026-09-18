"use client";

import { useActionState } from "react";
import { Button, Input } from "@despensa/ui";
import {
  createCategoryAction,
  type CategoryActionState,
} from "@/server/actions/product";

export function CategoryForm() {
  const [state, formAction, pending] = useActionState<CategoryActionState, FormData>(
    createCategoryAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="category-name" className="block text-sm font-medium text-slate-700">
          Nome da categoria
        </label>
        <Input
          id="category-name"
          name="name"
          type="text"
          required
          maxLength={120}
          placeholder="Ex.: Laticínios"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Adicionar categoria"}
      </Button>
    </form>
  );
}
