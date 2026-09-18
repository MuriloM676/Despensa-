"use client";

import { useActionState } from "react";
import { Button, Input } from "@despensa/ui";
import {
  purchaseToStockAction,
  type PurchaseToStockActionState,
} from "@/server/actions/purchase-to-stock";

export function PurchaseToStockForm({
  itemId,
  listId,
}: {
  itemId: string;
  listId: string;
}) {
  const [state, formAction, pending] = useActionState<
    PurchaseToStockActionState,
    FormData
  >(purchaseToStockAction, {});

  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-end gap-2">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="listId" value={listId} />
      <div className="space-y-1">
        <label
          htmlFor={`expiration-${itemId}`}
          className="block text-xs font-medium text-slate-500"
        >
          Validade (opcional)
        </label>
        <Input
          id={`expiration-${itemId}`}
          name="expirationDate"
          type="date"
          className="w-40"
        />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Lançando..." : "Lançar no estoque"}
      </Button>
      {state.error ? (
        <p className="w-full text-xs text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="w-full text-xs text-emerald-600" role="status">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
