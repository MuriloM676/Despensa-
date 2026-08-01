import Link from "next/link";
import { PlusIcon } from "@/components/icons";

interface LandingNavProps {
  userLoggedIn: boolean;
}

const links = [
  { href: "#recursos", label: "Recursos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#fefo", label: "Validade" },
];

export function LandingNav({ userLoggedIn }: LandingNavProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink/10 bg-paper/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-paper">
            <PlusIcon className="h-4 w-4" />
          </span>
          Despensa<span className="text-tomato">+</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-ink/70 md:flex">
          {links.map(link => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-ink">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {userLoggedIn ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-ink/85"
            >
              Ir para a despensa
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-ink/80 transition-colors hover:text-ink">
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-tomato px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-tomato/30 transition-colors hover:bg-tomato/90"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
