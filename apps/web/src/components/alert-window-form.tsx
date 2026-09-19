"use client";

import { useActionState } from "react";
import { Button, Input } from "@despensa/ui";
import {
  updateAlertWindowAction,
  type HouseholdActionState,
} from "@/server/actions/household";

export function AlertWindowForm({ currentDays }: { currentDays: number }) {
  const [state, formAction, pending] = useActionState<HouseholdActionState, FormData>(
    updateAlertWindowAction,
    {},
  );

  return (
    <form action={formAction} className="mt-3 flex items-end gap-2">
      <div className="w-28 space-y-1">
        <label htmlFor="alertWindowDays" className="block text-xs font-medium text-slate-600">
          Avisar com (dias)
        </label>
        <Input
          id="alertWindowDays"
          name="alertWindowDays"
          type="number"
          min="1"
          max="30"
          step="1"
          required
          defaultValue={currentDays}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
      {state.error ? (
        <p className="pb-2 text-xs text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
