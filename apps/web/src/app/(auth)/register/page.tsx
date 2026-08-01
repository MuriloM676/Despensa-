import type { Metadata } from "next";
import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = {
  title: "Criar conta",
};

export default function RegisterPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Criar conta</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">Comece a gerenciar sua despensa.</p>
      <RegisterForm />
    </div>
  );
}
