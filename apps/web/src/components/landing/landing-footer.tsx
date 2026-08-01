import { PlusIcon } from "@/components/icons";

export function LandingFooter() {
  return (
    <footer className="border-t border-ink/10 bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row">
        <div className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-paper">
            <PlusIcon className="h-3.5 w-3.5" />
          </span>
          Despensa<span className="text-tomato">+</span>
        </div>
        <p className="text-sm text-ink/50">Sua despensa, sob controle. Feito com cuidado.</p>
        <p className="font-mono text-xs text-ink/40">© 2026 Despensa+</p>
      </div>
    </footer>
  );
}
