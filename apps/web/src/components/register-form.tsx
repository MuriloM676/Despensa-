"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Input } from "@despensa/ui";
import { registerAction, type AuthActionState } from "@/server/actions/auth";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    registerAction,
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
        <Input id="name" name="name" type="text" required autoComplete="name" />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          E-mail
        </label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Senha
        </label>
        <Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
        <p className="text-xs text-slate-500">Mínimo de 8 caracteres.</p>
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Criando conta..." : "Criar conta"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Já tem uma conta?{" "}
        <Link href="/login" className="font-medium text-emerald-600 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
