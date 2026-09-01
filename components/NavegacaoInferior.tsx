"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconeAjustes, IconeCamera, IconeJardim } from "./Icones";

const ITENS = [
  { href: "/jardim", rotulo: "Jardim", Icone: IconeJardim },
  { href: "/nova", rotulo: "Adicionar", Icone: IconeCamera },
  { href: "/ajustes", rotulo: "Ajustes", Icone: IconeAjustes },
] as const;

export default function NavegacaoInferior() {
  const caminho = usePathname();

  return (
    <nav className="area-segura-baixo sticky bottom-0 z-20 border-t border-borda bg-superficie/95 backdrop-blur">
      <ul className="mx-auto flex max-w-2xl">
        {ITENS.map(({ href, rotulo, Icone }) => {
          const ativo = caminho === href || caminho.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  ativo ? "text-folha" : "text-suave"
                }`}
              >
                <Icone className="h-6 w-6" />
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
