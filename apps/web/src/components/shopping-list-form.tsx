"use client";

import { useActionState } from "react";
import { Button, Input } from "@despensa/ui";
import {
  createShoppingListAction,
  renameShoppingListAction,
  type ShoppingListActionState,
} from "@/server/actions/shopping-list";

export function NewShoppingListForm() {
  const [state, formAction, pending] = useActionState<ShoppingListActionState, FormData>(
    createShoppingListAction,
    {},
  );

  return (
    <form action={formAction} className="flex gap-2">
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <Input name="name" placeholder="Nova lista (ex.: Feira da semana)" required className="flex-1" />
      <Button type="submit" disabled={pending}>
        {pending ? "Criando..." : "Criar"}
      </Button>
    </form>
  );
}

export function RenameShoppingListForm({
  listId,
  currentName,
}: {
  listId: string;
  currentName: string;
}) {
  const [state, formAction, pending] = useActionState<ShoppingListActionState, FormData>(
    renameShoppingListAction,
    {},
  );

  return (
    <form action={formAction} className="flex gap-2">
      <input type="hidden" name="listId" value={listId} />
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <Input
        name="name"
        defaultValue={currentName}
        placeholder="Nome da lista"
        required
        maxLength={120}
        className="flex-1"
        aria-label="Nome da lista"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Renomeando..." : "Renomear"}
      </Button>
    </form>
  );
}
