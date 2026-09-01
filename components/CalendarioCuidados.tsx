"use client";

import { useMemo, useState, useTransition } from "react";
import { registrarCuidado } from "@/app/acoes";
import type { EventoCuidado, TipoEvento } from "@/lib/tipos";
import { IconeAdubo, IconeGota, IconeVoltar } from "./Icones";

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** Como cada tipo de cuidado aparece no calendário. */
const MARCAS: Record<TipoEvento, { cor: string; rotulo: string }> = {
  rega: { cor: "text-folha", rotulo: "Rega" },
  adubacao: { cor: "text-terra", rotulo: "Adubação" },
  poda: { cor: "text-atencao", rotulo: "Poda" },
  replantio: { cor: "text-terra", rotulo: "Replantio" },
  nota: { cor: "text-suave", rotulo: "Anotação" },
};

function iso(ano: number, mes: number, dia: number) {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function Marca({ tipo }: { tipo: TipoEvento }) {
  const { cor } = MARCAS[tipo];
  if (tipo === "rega") return <IconeGota className={`h-3 w-3 ${cor}`} />;
  if (tipo === "adubacao") return <IconeAdubo className={`h-3 w-3 ${cor}`} />;
  return <span className={`text-[8px] leading-none ${cor}`}>●</span>;
}

export default function CalendarioCuidados({
  plantaId,
  eventos,
}: {
  plantaId: string;
  eventos: EventoCuidado[];
}) {
  const hoje = new Date();
  const hojeIso = iso(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  // Marcações feitas agora, antes do servidor confirmar. Some sozinho no
  // próximo carregamento, quando já vierem em `eventos`.
  const [otimistas, setOtimistas] = useState<Array<{ data: string; tipo: TipoEvento }>>([]);

  // Agrupa os eventos por dia, para o desenho da grade ser direto.
  const porDia = useMemo(() => {
    const mapa = new Map<string, TipoEvento[]>();
    const juntos = [...eventos.map((e) => ({ data: e.data, tipo: e.tipo })), ...otimistas];
    for (const e of juntos) {
      const lista = mapa.get(e.data) ?? [];
      if (!lista.includes(e.tipo)) lista.push(e.tipo);
      mapa.set(e.data, lista);
    }
    return mapa;
  }, [eventos, otimistas]);

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  function mudarMes(passo: number) {
    const d = new Date(ano, mes + passo, 1);
    setAno(d.getFullYear());
    setMes(d.getMonth());
    setSelecionado(null);
  }

  function marcar(tipo: TipoEvento) {
    if (!selecionado) return;
    const dia = selecionado;

    setErro(null);
    // A marca aparece no calendário na hora; o servidor confirma depois.
    setOtimistas((atual) => [...atual, { data: dia, tipo }]);
    setSelecionado(null);

    iniciar(async () => {
      const r = await registrarCuidado(plantaId, tipo, "Registrado pelo calendário", dia);
      if ("erro" in r && r.erro) {
        setOtimistas((atual) =>
          atual.filter((o) => !(o.data === dia && o.tipo === tipo)),
        );
        setErro(r.erro);
        setSelecionado(dia);
      }
    });
  }

  const noFuturo = selecionado !== null && selecionado > hojeIso;
  const tiposNoDia = selecionado ? (porDia.get(selecionado) ?? []) : [];

  return (
    <section className="rounded-suave border border-borda bg-superficie p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => mudarMes(-1)}
          aria-label="Mês anterior"
          className="rounded-lg p-1.5 text-suave"
        >
          <IconeVoltar className="h-5 w-5" />
        </button>

        <h2 className="font-medium">
          {MESES[mes]} <span className="text-suave">{ano}</span>
        </h2>

        <button
          type="button"
          onClick={() => mudarMes(1)}
          aria-label="Próximo mês"
          className="rounded-lg p-1.5 text-suave"
        >
          <IconeVoltar className="h-5 w-5 rotate-180" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((d, i) => (
          <div key={i} className="pb-1 text-center text-[11px] font-medium text-suave">
            {d}
          </div>
        ))}

        {Array.from({ length: primeiroDiaSemana }, (_, i) => (
          <div key={`vazio-${i}`} />
        ))}

        {Array.from({ length: diasNoMes }, (_, i) => {
          const dia = i + 1;
          const data = iso(ano, mes, dia);
          const tipos = porDia.get(data) ?? [];
          const ehHoje = data === hojeIso;
          const futuro = data > hojeIso;
          const ativo = data === selecionado;

          return (
            <button
              key={data}
              type="button"
              disabled={futuro}
              onClick={() => setSelecionado(ativo ? null : data)}
              aria-label={`${dia} de ${MESES[mes]}${tipos.length ? `, ${tipos.map((t) => MARCAS[t].rotulo).join(" e ")}` : ""}`}
              aria-pressed={ativo}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border text-xs transition-colors ${
                ativo
                  ? "border-folha bg-folha-clara font-medium text-folha"
                  : ehHoje
                    ? "border-folha/40 bg-papel font-medium"
                    : "border-transparent bg-papel"
              } ${futuro ? "opacity-30" : ""}`}
            >
              <span>{dia}</span>
              {/* Os registros anteriores ficam apagados: são histórico,
                  não ação. O dia de hoje mantém o traço cheio. */}
              <span
                className={`flex h-3 items-center gap-0.5 ${ehHoje ? "opacity-100" : "opacity-55"}`}
              >
                {tipos.slice(0, 3).map((t) => (
                  <Marca key={t} tipo={t} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {selecionado && !noFuturo && (
        <div className="mt-4 rounded-suave border border-borda bg-papel p-3">
          <p className="text-sm font-medium">
            {Number(selecionado.slice(8))} de {MESES[Number(selecionado.slice(5, 7)) - 1]} de{" "}
            {selecionado.slice(0, 4)}
          </p>

          {tiposNoDia.length > 0 && (
            <p className="mt-1 text-xs text-suave">
              Já registrado: {tiposNoDia.map((t) => MARCAS[t].rotulo).join(", ")}.
            </p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => marcar("rega")}
              disabled={pendente}
              className="flex items-center justify-center gap-1.5 rounded-suave bg-folha px-3 py-2.5 text-sm font-medium text-white disabled:opacity-60 dark:text-papel"
            >
              <IconeGota className="h-4 w-4" />
              Reguei
            </button>
            <button
              type="button"
              onClick={() => marcar("adubacao")}
              disabled={pendente}
              className="flex items-center justify-center gap-1.5 rounded-suave border border-borda bg-superficie px-3 py-2.5 text-sm font-medium disabled:opacity-60"
            >
              <IconeAdubo className="h-4 w-4" />
              Adubei
            </button>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => marcar("poda")}
              disabled={pendente}
              className="rounded-suave border border-borda bg-superficie px-3 py-2 text-sm disabled:opacity-60"
            >
              Podei
            </button>
            <button
              type="button"
              onClick={() => marcar("replantio")}
              disabled={pendente}
              className="rounded-suave border border-borda bg-superficie px-3 py-2 text-sm disabled:opacity-60"
            >
              Replantei
            </button>
          </div>

          {erro && (
            <p role="alert" className="mt-2 text-sm text-alerta">
              {erro}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-borda pt-3 text-xs text-suave">
        <span className="flex items-center gap-1">
          <IconeGota className="h-3 w-3 text-folha" /> rega
        </span>
        <span className="flex items-center gap-1">
          <IconeAdubo className="h-3 w-3 text-terra" /> adubação
        </span>
        <span className="flex items-center gap-1">
          <span className="text-[8px] text-atencao">●</span> poda
        </span>
        <span className="flex items-center gap-1">
          <span className="text-[8px] text-terra">●</span> replantio
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-suave">
        Esqueceu de anotar? Toque no dia em que aconteceu — dá para registrar em
        qualquer data passada.
      </p>
    </section>
  );
}
