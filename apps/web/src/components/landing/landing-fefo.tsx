"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import CountUp from "@/components/reactbits/count-up";
import { CheckIcon } from "@/components/icons";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const stats = [
  { value: 40, suffix: "%", label: "menos comida desperdiçada" },
  { value: 3, suffix: "×", label: "menos idas ao mercado" },
  { value: 100, suffix: "%", label: "da casa em sincronia" },
];

export function LandingFefo() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-stagger]",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.15,
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%", once: true },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="border-y border-ink/10 bg-cream">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-2">
        <div>
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
        </div>

        <div className="grid content-center gap-6">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              data-stagger={i}
              className="rounded-3xl border border-ink/10 bg-paper p-8 shadow-sm"
            >
              <p className="font-display text-6xl font-extrabold tracking-tight text-ink md:text-7xl">
                <CountUp to={stat.value} duration={2} separator="." />
                <span className="text-tomato">{stat.suffix}</span>
              </p>
              <p className="mt-2 text-ink/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
