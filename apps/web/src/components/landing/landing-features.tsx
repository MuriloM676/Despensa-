"use client";

import SpotlightCard from "@/components/reactbits/spotlight-card";
import { BellIcon, CartIcon, UsersIcon, TagIcon } from "@/components/icons";

const features = [
  {
    icon: BellIcon,
    title: "Validade que não pega de surpresa",
    description:
      "Alertas antes de vencer. O Despensa+ ordena sua prateleira pelo FEFO — o que vence primeiro é consumido primeiro.",
    accent: "text-tomato",
    iconBg: "bg-tomato/10",
  },
  {
    icon: CartIcon,
    title: "Lista de compras inteligente",
    description:
      "O que está acabando entra na lista automaticamente. Chega no mercado sabendo exatamente o que falta.",
    accent: "text-mustard",
    iconBg: "bg-mustard/10",
  },
  {
    icon: UsersIcon,
    title: "A casa toda em sincronia",
    description:
      "Todo mundo cadastra o que comprou e consome o que é preciso. Ninguém compra feijão três vezes na mesma semana.",
    accent: "text-sage",
    iconBg: "bg-sage/15",
  },
  {
    icon: TagIcon,
    title: "Cada produto, com seu rótulo",
    description:
      "Nome, quantidade, data de compra e validade. Uma despensa organizada que não depende da sua memória.",
    accent: "text-kraft",
    iconBg: "bg-kraft/10",
  },
];

export function LandingFeatures() {
  return (
    <section id="recursos" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
      <div className="mb-14 max-w-2xl">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-tomato">Recursos</p>
        <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
          Menos desperdício, mais clareza na despensa
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {features.map(feature => (
          <SpotlightCard key={feature.title}>
            <div className={`mb-6 grid h-12 w-12 place-items-center rounded-2xl ${feature.iconBg} ${feature.accent}`}>
              <feature.icon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-2xl font-bold tracking-tight">{feature.title}</h3>
            <p className="mt-3 leading-relaxed text-ink/70">{feature.description}</p>
          </SpotlightCard>
        ))}
      </div>
    </section>
  );
}
