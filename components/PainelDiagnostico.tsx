"use client";

import { useState, useTransition } from "react";
import { rodarDiagnostico } from "@/app/acoes";
import { SINTOMAS, type GrupoSintoma } from "@/lib/diagnostico";
import type { ResultadoDiagnostico } from "@/lib/tipos";
import { IconeFolhaSeca } from "./Icones";

const GRUPOS: Array<{ id: GrupoSintoma; titulo: string }> = [
  { id: "folhas", titulo: "Nas folhas" },
  { id: "caule", titulo: "No caule e no formato" },
  { id: "terra", titulo: "Na terra e no vaso" },
  { id: "bichos", titulo: "Sinais de bicho" },
  { id: "geral", titulo: "No geral" },
];

const CORES_URGENCIA = {
  alta: "border-alerta/30 bg-alerta-clara text-alerta",
  media: "border-atencao/30 bg-atencao-clara text-atencao",
  baixa: "border-borda bg-papel text-suave",
} as const;

const ROTULO_URGENCIA = {
  alta: "Agir hoje",
  media: "Resolver esta semana",
  baixa: "Ajuste tranquilo",
} as const;

export default function PainelDiagnostico({ plantaId }: { plantaId: string }) {
  const [aberto, setAberto] = useState(false);
  const [marcados, setMarcados] = useState<string[]>([]);
  const [resultado, setResultado] = useState<ResultadoDiagnostico | null>(null);
  const [pendente, iniciar] = useTransition();

  function alternar(id: string) {
    setResultado(null);
    setMarcados((atual) =>
      atual.includes(id) ? atual.filter((s) => s !== id) : [...atual, id],
    );
  }

  function analisar() {
    iniciar(async () => {
      const r = await rodarDiagnostico(plantaId, marcados);
      setResultado(r);
    });
  }

  function recomecar() {
    setMarcados([]);
    setResultado(null);
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex w-full items-center gap-3 rounded-suave border border-borda bg-superficie p-4 text-left"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terra-clara text-terra">
          <IconeFolhaSeca className="h-5 w-5" />
        </span>
        <span className="flex-1">
          <span className="block font-medium">Algo está errado?</span>
          <span className="block text-sm text-suave">
            Marque os sintomas e eu digo a causa mais provável.
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-suave border border-borda bg-superficie p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-medium">O que você está vendo?</h2>
          <p className="text-sm text-suave">Marque tudo que se aplica.</p>
        </div>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="shrink-0 text-sm text-suave underline underline-offset-4"
        >
          Fechar
        </button>
      </div>

      {!resultado && (
        <>
          <div className="space-y-4">
            {GRUPOS.map((grupo) => {
              const itens = SINTOMAS.filter((s) => s.grupo === grupo.id);
              if (itens.length === 0) return null;

              return (
                <fieldset key={grupo.id}>
                  <legend className="mb-2 text-xs font-semibold tracking-wide text-suave uppercase">
                    {grupo.titulo}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {itens.map((s) => {
                      const ativo = marcados.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => alternar(s.id)}
                          aria-pressed={ativo}
                          className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                            ativo
                              ? "border-folha bg-folha-clara font-medium text-folha"
                              : "border-borda bg-papel text-tinta"
                          }`}
                        >
                          {s.rotulo}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
          </div>

          <button
            type="button"
            onClick={analisar}
            disabled={marcados.length === 0 || pendente}
            className="mt-5 w-full rounded-suave bg-folha px-4 py-3 font-medium text-white disabled:opacity-50 dark:text-papel"
          >
            {pendente
              ? "Analisando…"
              : marcados.length === 0
                ? "Marque ao menos um sintoma"
                : `Analisar ${marcados.length} sintoma${marcados.length > 1 ? "s" : ""}`}
          </button>
        </>
      )}

      {resultado && (
        <div className="space-y-4">
          {resultado.observacao && (
            <p className="rounded-suave bg-papel px-4 py-3 text-sm leading-relaxed text-suave">
              {resultado.observacao}
            </p>
          )}

          {resultado.causas.length === 0 && (
            <p className="text-sm text-suave">
              Não consegui chegar a uma causa provável com esses sintomas.
            </p>
          )}

          {resultado.causas.map((c, i) => (
            <article key={c.causa} className="rounded-suave border border-borda p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium">
                  {i === 0 && <span className="text-suave">Mais provável: </span>}
                  {c.causa}
                </h3>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${CORES_URGENCIA[c.urgencia]}`}
                >
                  {ROTULO_URGENCIA[c.urgencia]}
                </span>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-suave">{c.explicacao}</p>

              <h4 className="mt-3 text-xs font-semibold tracking-wide text-suave uppercase">
                O que fazer
              </h4>
              <ol className="mt-1.5 space-y-1.5 text-sm leading-relaxed">
                {c.acoes.map((a, j) => (
                  <li key={a} className="flex gap-2">
                    <span className="shrink-0 text-suave tabular-nums">{j + 1}.</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ol>
            </article>
          ))}

          <button
            type="button"
            onClick={recomecar}
            className="w-full rounded-suave border border-borda px-4 py-2.5 text-sm font-medium"
          >
            Marcar outros sintomas
          </button>
        </div>
      )}
    </div>
  );
}
