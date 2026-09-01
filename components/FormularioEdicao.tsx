"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { arquivarPlanta, atualizarPlanta, recalcularCuidados } from "@/app/acoes";
import type { Ambiente, Luz, Planta, TamanhoVaso } from "@/lib/tipos";
import { ROTULOS } from "@/lib/tipos";

export default function FormularioEdicao({ planta }: { planta: Planta }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();

  const [apelido, setApelido] = useState(planta.apelido);
  const [ambiente, setAmbiente] = useState<Ambiente>(planta.ambiente);
  const [luz, setLuz] = useState<Luz>(planta.luz);
  const [vaso, setVaso] = useState<TamanhoVaso>(planta.tamanho_vaso);
  const [rega, setRega] = useState(planta.intervalo_rega_dias);
  const [aduba, setAduba] = useState(planta.intervalo_aduba_dias);
  const [notas, setNotas] = useState(planta.notas ?? "");

  const [erro, setErro] = useState<string | null>(null);
  const [recalculo, setRecalculo] = useState<string[] | null>(null);
  const [confirmandoArquivo, setConfirmandoArquivo] = useState(false);

  function salvar() {
    setErro(null);
    iniciar(async () => {
      const r = await atualizarPlanta({
        id: planta.id,
        apelido,
        ambiente,
        luz,
        tamanhoVaso: vaso,
        intervaloRegaDias: rega,
        intervaloAdubaDias: aduba,
        notas: notas.trim() || null,
      });

      if ("erro" in r && r.erro) {
        setErro(r.erro);
        return;
      }
      router.push(`/planta/${planta.id}`);
    });
  }

  function recalcular() {
    setErro(null);
    iniciar(async () => {
      const r = await recalcularCuidados(planta.id);
      if ("erro" in r && r.erro) {
        setErro(r.erro);
        return;
      }
      if ("rega" in r && typeof r.rega === "number") {
        setRega(r.rega);
        setAduba(r.adubacao ?? 0);
        setRecalculo([...(r.motivos ?? []), r.motivoAduba ?? ""].filter(Boolean));
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="apelido" className="mb-1.5 block text-sm font-medium">
          Apelido
        </label>
        <input
          id="apelido"
          type="text"
          value={apelido}
          onChange={(e) => setApelido(e.target.value)}
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Onde ela fica?</legend>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(ROTULOS.ambiente) as Ambiente[]).map((v) => (
            <Opcao key={v} ativo={ambiente === v} onClick={() => setAmbiente(v)}>
              {ROTULOS.ambiente[v]}
            </Opcao>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Luz</legend>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(ROTULOS.luz) as Luz[]).map((v) => (
            <Opcao key={v} ativo={luz === v} onClick={() => setLuz(v)}>
              {ROTULOS.luz[v]}
            </Opcao>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Vaso</legend>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(ROTULOS.vaso) as TamanhoVaso[]).map((v) => (
            <Opcao key={v} ativo={vaso === v} onClick={() => setVaso(v)}>
              {ROTULOS.vaso[v]}
            </Opcao>
          ))}
        </div>
      </fieldset>

      <div className="rounded-suave border border-borda bg-superficie p-4">
        <h2 className="mb-3 font-medium">Intervalos</h2>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={120}
              value={rega}
              onChange={(e) => setRega(Number(e.target.value))}
              className="!w-20 text-center tabular-nums"
              aria-label="Dias entre regas"
            />
            <span className="text-sm">dias entre regas</span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={365}
              value={aduba}
              onChange={(e) => setAduba(Number(e.target.value))}
              className="!w-20 text-center tabular-nums"
              aria-label="Dias entre adubações"
            />
            <span className="text-sm">
              dias entre adubações <span className="text-suave">(0 = pausada)</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={recalcular}
          disabled={pendente}
          className="mt-4 w-full rounded-suave border border-folha/40 bg-folha-clara px-4 py-2.5 text-sm font-medium text-folha disabled:opacity-60"
        >
          Recalcular para a estação atual
        </button>

        {recalculo && (
          <ul className="mt-3 space-y-1 border-t border-borda pt-3 text-xs leading-relaxed text-suave">
            {recalculo.map((m) => (
              <li key={m}>• {m}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label htmlFor="notas" className="mb-1.5 block text-sm font-medium">
          Anotações
        </label>
        <textarea id="notas" rows={4} value={notas} onChange={(e) => setNotas(e.target.value)} />
      </div>

      {erro && (
        <p role="alert" className="text-sm text-alerta">
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={salvar}
        disabled={pendente}
        className="w-full rounded-suave bg-folha px-4 py-3.5 font-medium text-white disabled:opacity-60 dark:text-papel"
      >
        {pendente ? "Salvando…" : "Salvar alterações"}
      </button>

      <div className="border-t border-borda pt-6">
        {confirmandoArquivo ? (
          <div className="rounded-suave border border-alerta/30 bg-alerta-clara p-4">
            <p className="text-sm leading-relaxed">
              Arquivar tira <strong>{planta.apelido}</strong> do jardim e para os
              lembretes. O histórico e as fotos ficam guardados.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => iniciar(() => arquivarPlanta(planta.id))}
                className="flex-1 rounded-suave bg-alerta px-4 py-2.5 text-sm font-medium text-white"
              >
                Arquivar
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoArquivo(false)}
                className="flex-1 rounded-suave border border-borda bg-superficie px-4 py-2.5 text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmandoArquivo(true)}
            className="w-full py-2 text-sm font-medium text-alerta underline underline-offset-4"
          >
            Arquivar esta planta
          </button>
        )}
      </div>
    </div>
  );
}

function Opcao({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`rounded-suave border px-3 py-2.5 text-sm font-medium transition-colors ${
        ativo ? "border-folha bg-folha-clara text-folha" : "border-borda bg-superficie text-tinta"
      }`}
    >
      {children}
    </button>
  );
}
