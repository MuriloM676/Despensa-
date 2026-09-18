"use client";

import { Reveal } from "@/components/landing/reveal";

const steps = [
  {
    number: "01",
    title: "Cadastre o que tem na despensa",
    description: "Produtos com data de compra e validade. Rápido, sem complicação.",
  },
  {
    number: "02",
    title: "O Despensa+ calcula o que vence",
    description: "A ordem de consumo é automática: primeiro vence, primeiro sai.",
  },
  {
    number: "03",
    title: "Compre o que falta, sem sobrar",
    description: "A lista de compras se monta sozinha com o que está acabando.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
      <Reveal className="mb-14 max-w-2xl">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-tomato">Como funciona</p>
        <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
          Pronto em três passos
        </h2>
      </Reveal>

      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step, i) => (
          <Reveal key={step.number} delay={i * 0.18}>
            <div className="relative rounded-3xl border border-ink/10 bg-paper p-8 pt-10">
              <div className="absolute -top-5 left-8 grid h-11 w-11 place-items-center rounded-full bg-ink font-mono text-sm font-bold text-mustard">
                {step.number}
              </div>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-tight">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-ink/70">{step.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
