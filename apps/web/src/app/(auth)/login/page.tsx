import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Entrar</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">Acesse sua despensa.</p>
      <LoginForm />
    </div>
  );
}
