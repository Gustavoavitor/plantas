"use client";

import { useCallback, useEffect, useState } from "react";
import type { Clima } from "@/lib/clima";
import { dicaDoTempo } from "@/lib/clima";
import IconeClima from "./IconesClima";

const CHAVE_LOCAL = "plantas:coordenadas";

type Estado = "inicio" | "carregando" | "pronto" | "sem_permissao" | "erro";

type Coordenadas = { lat: number; lon: number };

/** Abre o app de tempo do aparelho, ou a previsão no navegador. */
function abrirPrevisao() {
  const ehIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (ehIOS) {
    // Esquema da Apple: abre o app Tempo. Se não existir, nada acontece,
    // então caímos na busca logo depois.
    const antes = Date.now();
    window.location.href = "weather://";
    setTimeout(() => {
      if (Date.now() - antes < 1500 && !document.hidden) {
        window.open("https://weather.com", "_blank", "noopener");
      }
    }, 800);
    return;
  }

  window.open(
    "https://www.google.com/search?q=previs%C3%A3o+do+tempo",
    "_blank",
    "noopener",
  );
}

export default function ClimaAgora() {
  const [estado, setEstado] = useState<Estado>("inicio");
  const [clima, setClima] = useState<Clima | null>(null);

  const buscar = useCallback(async ({ lat, lon }: Coordenadas) => {
    setEstado("carregando");
    try {
      const r = await fetch(`/api/clima?lat=${lat}&lon=${lon}`);
      const dados = await r.json();
      if (!r.ok) throw new Error(dados.erro);
      setClima(dados as Clima);
      setEstado("pronto");
    } catch {
      setEstado("erro");
    }
  }, []);

  const pedirLocalizacao = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setEstado("erro");
      return;
    }

    setEstado("carregando");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          // Duas casas decimais bastam para o tempo e evitam guardar a
          // posição exata da pessoa no aparelho.
          lat: Number(pos.coords.latitude.toFixed(2)),
          lon: Number(pos.coords.longitude.toFixed(2)),
        };
        try {
          localStorage.setItem(CHAVE_LOCAL, JSON.stringify(coords));
        } catch {
          // Navegação privada: segue sem guardar.
        }
        buscar(coords);
      },
      () => setEstado("sem_permissao"),
      { timeout: 8000, maximumAge: 30 * 60 * 1000 },
    );
  }, [buscar]);

  useEffect(() => {
    // Sem pedir permissão de cara: só usa o que já foi autorizado antes.
    const relogio = setTimeout(() => {
      try {
        const guardado = localStorage.getItem(CHAVE_LOCAL);
        if (guardado) {
          buscar(JSON.parse(guardado) as Coordenadas);
          return;
        }
      } catch {
        // Ignora storage indisponível.
      }
      setEstado("inicio");
    }, 0);

    return () => clearTimeout(relogio);
  }, [buscar]);

  if (estado === "inicio" || estado === "sem_permissao") {
    return (
      <button
        type="button"
        onClick={pedirLocalizacao}
        className="flex items-center gap-1.5 rounded-full border border-borda bg-superficie px-3 py-1.5 text-xs text-suave"
      >
        <IconeClima tipo="poucas_nuvens" ehDia className="h-4 w-4" />
        {estado === "sem_permissao" ? "Sem acesso ao local" : "Ver o tempo"}
      </button>
    );
  }

  if (estado === "carregando") {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-borda bg-superficie px-3 py-1.5 text-xs text-suave">
        <span className="h-3 w-3 animate-spin rounded-full border border-borda border-t-folha" />
        Tempo…
      </span>
    );
  }

  if (estado === "erro" || !clima) {
    return (
      <button
        type="button"
        onClick={pedirLocalizacao}
        className="rounded-full border border-borda bg-superficie px-3 py-1.5 text-xs text-suave"
      >
        Tempo indisponível
      </button>
    );
  }

  const dica = dicaDoTempo(clima);

  return (
    <button
      type="button"
      onClick={abrirPrevisao}
      title={dica ? `${clima.descricao}. ${dica}` : clima.descricao}
      aria-label={`${clima.temperatura} graus, ${clima.descricao}. Abrir a previsão do tempo.`}
      className="surgir flex items-center gap-1.5 rounded-full border border-borda bg-superficie px-3 py-1.5 text-sm"
    >
      <IconeClima tipo={clima.tipo} ehDia={clima.ehDia} className="h-5 w-5 text-folha" />
      <span className="font-semibold tabular-nums">{clima.temperatura}°</span>
    </button>
  );
}
