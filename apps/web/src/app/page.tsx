import type { Metadata } from "next";
import { getCurrentUser } from "@/server/session";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFefo } from "@/components/landing/landing-fefo";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "Despensa+ · Sua despensa sempre sob controle",
  description:
    "Organize o estoque, a validade e as compras da sua casa. Consuma primeiro o que vai vencer e pare de desperdiçar comida.",
};

export default async function LandingPage() {
  const user = await getCurrentUser();
  const userLoggedIn = Boolean(user);

  return (
    <main>
      <LandingNav userLoggedIn={userLoggedIn} />
      <LandingHero userLoggedIn={userLoggedIn} />
      <LandingFeatures />
      <LandingFefo />
      <LandingHowItWorks />
      <LandingCta userLoggedIn={userLoggedIn} />
      <LandingFooter />
    </main>
  );
}
