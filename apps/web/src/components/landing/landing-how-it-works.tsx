"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

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
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-stagger]",
        { y: 48, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          ease: "power3.out",
          stagger: 0.18,
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%", once: true },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
      <div className="mb-14 max-w-2xl">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-tomato">Como funciona</p>
        <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
          Pronto em três passos
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={step.number}
            data-stagger={i}
            className="relative rounded-3xl border border-ink/10 bg-paper p-8 pt-10"
          >
            <div className="absolute -top-5 left-8 grid h-11 w-11 place-items-center rounded-full bg-ink font-mono text-sm font-bold text-mustard">
              {step.number}
            </div>
            <h3 className="mt-2 font-display text-2xl font-bold tracking-tight">{step.title}</h3>
            <p className="mt-3 leading-relaxed text-ink/70">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
