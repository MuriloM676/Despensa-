import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";

interface LandingCtaProps {
  userLoggedIn: boolean;
}

export function LandingCta({ userLoggedIn }: LandingCtaProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-ink px-8 py-20 text-center text-paper md:py-28">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-tomato/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-mustard/25 blur-3xl" />

        <div className="relative mx-auto max-w-2xl">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-mustard">Despensa+</p>
          <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Nunca mais descubra a comida vencida no fundo da prateleira.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-lg text-paper/70">
            Comece a organizar sua despensa hoje. É grátis para a sua casa.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={userLoggedIn ? "/dashboard" : "/register"}
              className="group inline-flex items-center gap-2 rounded-full bg-tomato px-8 py-4 text-lg font-bold text-white shadow-xl shadow-tomato/30 transition-all hover:-translate-y-0.5 hover:bg-tomato/90"
            >
              {userLoggedIn ? "Ir para a despensa" : "Criar minha despensa"}
              <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            {!userLoggedIn && (
              <Link href="/login" className="text-paper/70 underline-offset-4 transition-colors hover:text-paper hover:underline">
                Já tenho conta
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
