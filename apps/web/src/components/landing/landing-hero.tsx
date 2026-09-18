"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import Aurora from "@/components/reactbits/aurora";
import SplitText from "@/components/reactbits/split-text";
import { ArrowRightIcon, ClockIcon } from "@/components/icons";

interface LandingHeroProps {
  userLoggedIn: boolean;
}

const shelfItems = [
  { name: "Feijão", quantity: "2 kg", days: 214, color: "bg-mustard/20 border-mustard/40", valid: true },
  { name: "Leite", quantity: "3 uni", days: 6, color: "bg-cream border-ink/15", valid: true },
  { name: "Azeite", quantity: "1 litro", days: 183, color: "bg-sage/20 border-sage/50", valid: true },
  { name: "Queijo", quantity: "1 kg", days: 2, color: "bg-tomato/10 border-tomato/40", valid: false },
];

export function LandingHero({ userLoggedIn }: LandingHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const shelfRef = useRef<HTMLDivElement>(null);

  // Gentle parallax on the shelf while scrolling the hero out of view
  // (M13: tiny scroll listener replacing the gsap scrub tween).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    let frame = 0;
    function onScroll(): void {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const shelf = shelfRef.current;
        const section = sectionRef.current;
        if (!shelf || !section) {
          return;
        }
        const progress = Math.min(Math.max(-section.getBoundingClientRect().top / 600, 0), 1);
        shelf.style.transform = `translateY(${-18 * progress}px)`;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section ref={sectionRef} id="top" className="relative overflow-hidden bg-ink text-paper">
      <div className="absolute inset-0 opacity-60">
        <Aurora colorStops={["#10241B", "#D9482E", "#E5A93B"]} speed={0.9} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/30 via-transparent to-ink" />

      <div className="relative mx-auto flex max-w-6xl flex-col px-6 pb-24 pt-36 md:pt-44">
        <div className="max-w-3xl">
          <p
            className="hero-fade mb-6 inline-flex items-center gap-2 rounded-full border border-paper/20 bg-paper/5 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-mustard"
            style={{ "--hero-delay": "0.3s" } as CSSProperties}
          >
            <ClockIcon className="h-3.5 w-3.5" />
            Nada vence. Nada falta.
          </p>

          <SplitText
            text="Sua despensa sempre sob controle"
            tag="h1"
            textAlign="left"
            splitType="words"
            delay={40}
            duration={1.1}
            threshold={1}
            rootMargin="0px"
            className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight md:text-7xl"
          />

          <p
            className="hero-fade mt-6 max-w-xl text-lg leading-relaxed text-paper/70"
            style={{ "--hero-delay": "0.42s" } as CSSProperties}
          >
            O Despensa+ acompanha o que você tem, quando vence e o que falta comprar.
            Consuma primeiro o que vai vencer — e pare de jogar comida fora.
          </p>

          <div
            className="hero-fade mt-10 flex flex-wrap items-center gap-4"
            style={{ "--hero-delay": "0.54s" } as CSSProperties}
          >
            <Link
              href={userLoggedIn ? "/dashboard" : "/register"}
              className="group inline-flex items-center gap-2 rounded-full bg-tomato px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-tomato/30 transition-all hover:-translate-y-0.5 hover:bg-tomato/90"
            >
              {userLoggedIn ? "Ir para a despensa" : "Começar grátis"}
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#recursos"
              className="rounded-full border border-paper/25 px-7 py-3.5 text-base font-semibold text-paper/85 transition-colors hover:border-paper/50 hover:text-paper"
            >
              Ver como funciona
            </a>
          </div>
        </div>

        <div ref={shelfRef} className="mt-20 md:mt-28">
          <div className="flex items-end gap-4 md:gap-6">
            {shelfItems.map((item, i) => (
              <div
                key={item.name}
                className={`shelf-jar-animated relative flex flex-1 flex-col items-center rounded-t-2xl border px-2 pb-4 pt-6 shadow-xl md:px-4 md:pt-10 ${item.color} ${
                  i === 0 ? "h-36 md:h-44" : i === 3 ? "h-28 md:h-36" : "h-32 md:h-40"
                }`}
                style={{ "--shelf-delay": `${1.1 + i * 0.16}s` } as CSSProperties}
              >
                {i === 3 && (
                  <div className="absolute -top-3 right-1/2 translate-x-1/2 md:-top-4">
                    <div
                      className="expiry-pulse-animated absolute inset-0 rounded-full bg-tomato/50"
                      style={{ "--seal-delay": "2.4s" } as CSSProperties}
                    />
                    <div
                      className="expiry-seal-animated relative grid h-12 w-12 place-items-center rounded-full bg-tomato text-center font-mono text-[8px] font-bold leading-tight text-white md:h-16 md:w-16 md:text-[10px]"
                      style={{ "--seal-delay": "2.4s" } as CSSProperties}
                    >
                      VENCE<br />HOJE
                    </div>
                  </div>
                )}
                <span className="mb-1 font-mono text-[10px] uppercase tracking-widest text-ink/50 md:text-xs">
                  {item.quantity}
                </span>
                <span className="font-display text-sm font-bold text-ink md:text-lg">{item.name}</span>
                {i === 3 && (
                  <span className="mt-1 rounded-full bg-tomato/15 px-2 py-0.5 font-mono text-[10px] font-bold text-tomato">
                    2 dias
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-0 h-4 rounded-b-2xl bg-gradient-to-b from-ink/80 to-ink md:h-6" />
        </div>
      </div>
    </section>
  );
}
