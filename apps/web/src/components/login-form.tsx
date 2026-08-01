"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Input } from "@despensa/ui";
import { loginAction, type AuthActionState } from "@/server/actions/auth";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    loginAction,
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
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          E-mail
        </label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Senha
        </label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando..." : "Entrar"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Não tem uma conta?{" "}
        <Link href="/register" className="font-medium text-emerald-600 hover:underline">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
