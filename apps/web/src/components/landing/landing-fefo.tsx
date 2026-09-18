"use client";

import CountUp from "@/components/reactbits/count-up";
import { Reveal } from "@/components/landing/reveal";
import { CheckIcon } from "@/components/icons";

const stats = [
  { value: 40, suffix: "%", label: "menos comida desperdiçada" },
  { value: 3, suffix: "×", label: "menos idas ao mercado" },
  { value: 100, suffix: "%", label: "da casa em sincronia" },
];

export function LandingFefo() {
  return (
    <section className="border-y border-ink/10 bg-cream">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-2">
        <Reveal>
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-tomato">A regra FEFO</p>
          <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Na sua despensa,
            <br />
            o que vence primeiro
            <br />
            <span className="text-tomato">sai primeiro.</span>
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/70">
            FEFO significa <em>first-expired, first-out</em>. É a regra que supermercados usam — e que a sua
            despensa passa a usar também, automaticamente.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              "Sem caça ao que vence no fundo da prateleira",
              "Alertas antes de estragar, não depois",
              "Menos lixo, menos gasto no mercado",
            ].map(item => (
              <li key={item} className="flex items-start gap-3 text-ink/80">
                <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-sage" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="grid content-center gap-6">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.15}>
              <div className="rounded-3xl border border-ink/10 bg-paper p-8 shadow-sm">
                <p className="font-display text-6xl font-extrabold tracking-tight text-ink md:text-7xl">
                  <CountUp to={stat.value} duration={2} separator="." />
                  <span className="text-tomato">{stat.suffix}</span>
                </p>
                <p className="mt-2 text-ink/60">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
