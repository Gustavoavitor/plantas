"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IconeAjustes, IconeCamera, IconeJardim, IconeJardins } from "./Icones";

const ITENS = [
  { href: "/jardim", rotulo: "Jardim", Icone: IconeJardim },
  { href: "/jardins", rotulo: "Lugares", Icone: IconeJardins },
  { href: "/nova", rotulo: "Adicionar", Icone: IconeCamera },
  { href: "/ajustes", rotulo: "Ajustes", Icone: IconeAjustes },
] as const;

function indiceDoCaminho(caminho: string) {
  const achado = ITENS.findIndex(
    (i) => caminho === i.href || caminho.startsWith(`${i.href}/`),
  );
  // /planta/... pertence ao Jardim.
  return achado >= 0 ? achado : caminho.startsWith("/planta") ? 0 : -1;
}

export default function NavegacaoInferior() {
  const caminho = usePathname();
  const real = indiceDoCaminho(caminho);

  // Aba tocada agora. As telas são dinâmicas, então a troca passa pelo
  // servidor; sem isto a barra só reagiria depois da resposta e o toque
  // parecia ignorado.
  //
  // Guardamos de qual caminho o toque partiu: quando a navegação conclui, o
  // caminho muda, o palpite deixa de valer sozinho e o índice real assume.
  // Assim não é preciso limpar nada num efeito.
  const [tocado, setTocado] = useState<{ de: string; indice: number } | null>(null);

  const ativo = tocado && tocado.de === caminho ? tocado.indice : real;

  return (
    <nav className="area-segura-baixo vidro sticky bottom-0 z-20 border-t backdrop-blur-xl backdrop-saturate-150">
      <div className="relative mx-auto max-w-2xl">
        {/* Pastilha de vidro que desliza até a aba ativa. */}
        {ativo >= 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1 bottom-1 left-0 rounded-2xl border border-folha/25 bg-folha-clara/70 transition-transform duration-300 ease-[cubic-bezier(0.32,0.9,0.3,1)]"
            style={{
              width: `${100 / ITENS.length}%`,
              transform: `translateX(${ativo * 100}%)`,
            }}
          />
        )}

        <ul className="relative flex">
          {ITENS.map(({ href, rotulo, Icone }, i) => {
            const ehAtivo = i === ativo;
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  prefetch
                  onClick={() => setTocado({ de: caminho, indice: i })}
                  aria-current={i === real ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors duration-200 ${
                    ehAtivo ? "text-folha" : "text-suave"
                  }`}
                >
                  <Icone
                    className={`h-6 w-6 transition-transform duration-300 ease-[cubic-bezier(0.32,0.9,0.3,1)] ${
                      ehAtivo ? "-translate-y-0.5 scale-105" : ""
                    }`}
                  />
                  {rotulo}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
