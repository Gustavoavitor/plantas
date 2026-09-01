"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { apagarJardim, criarJardim, renomearJardim } from "@/app/acoes";
import { IconeJardins, IconeMais } from "./Icones";

export type JardimComContagem = {
  id: string;
  nome: string;
  local: string | null;
  plantas: number;
  pendentes: number;
};

export default function GerenciarJardins({
  jardins,
  semJardim,
}: {
  jardins: JardimComContagem[];
  semJardim: number;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [local, setLocal] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function abrirNovo() {
    setNome("");
    setLocal("");
    setErro(null);
    setEditando(null);
    setCriando(true);
  }

  function abrirEdicao(j: JardimComContagem) {
    setNome(j.nome);
    setLocal(j.local ?? "");
    setErro(null);
    setCriando(false);
    setEditando(j.id);
  }

  function salvar() {
    setErro(null);
    iniciar(async () => {
      const r = editando
        ? await renomearJardim(editando, nome, local || null)
        : await criarJardim(nome, local || null);

      if ("erro" in r && r.erro) {
        setErro(r.erro);
        return;
      }
      setCriando(false);
      setEditando(null);
      router.refresh();
    });
  }

  function remover(id: string) {
    setErro(null);
    iniciar(async () => {
      const r = await apagarJardim(id);
      if ("erro" in r && r.erro) {
        setErro(r.erro);
        return;
      }
      setEditando(null);
      router.refresh();
    });
  }

  const emFormulario = criando || editando !== null;

  return (
    <div className="space-y-3">
      {jardins.length === 0 && !emFormulario && (
        <div className="rounded-suave border border-dashed border-borda px-6 py-12 text-center">
          <IconeJardins className="mx-auto h-9 w-9 text-suave" />
          <h2 className="mt-3 font-semibold">Nenhum jardim ainda</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-suave">
            Separe as plantas por lugar — casa, varanda, sítio, escritório. Cada
            planta pode ficar em um deles.
          </p>
        </div>
      )}

      {jardins.map((j) =>
        editando === j.id ? (
          <Formulario
            key={j.id}
            nome={nome}
            local={local}
            setNome={setNome}
            setLocal={setLocal}
            onSalvar={salvar}
            onCancelar={() => setEditando(null)}
            onRemover={() => remover(j.id)}
            pendente={pendente}
            erro={erro}
          />
        ) : (
          <div
            key={j.id}
            className="flex items-center gap-3 rounded-suave border border-borda bg-superficie p-3"
          >
            <Link href={`/jardins/${j.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-folha-clara text-folha">
                <IconeJardins className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{j.nome}</span>
                <span className="block truncate text-sm text-suave">
                  {j.local ? `${j.local} · ` : ""}
                  {j.plantas === 1 ? "1 planta" : `${j.plantas} plantas`}
                  {j.pendentes > 0 && ` · ${j.pendentes} pendente${j.pendentes > 1 ? "s" : ""}`}
                </span>
              </span>
            </Link>

            <button
              type="button"
              onClick={() => abrirEdicao(j)}
              className="shrink-0 rounded-lg px-3 py-2 text-sm text-suave"
            >
              Editar
            </button>
          </div>
        ),
      )}

      {semJardim > 0 && (
        <Link
          href="/jardim"
          className="flex items-center gap-3 rounded-suave border border-dashed border-borda p-3 text-sm text-suave"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-papel">
            🪴
          </span>
          {semJardim === 1
            ? "1 planta ainda sem jardim"
            : `${semJardim} plantas ainda sem jardim`}
        </Link>
      )}

      {criando && (
        <Formulario
          nome={nome}
          local={local}
          setNome={setNome}
          setLocal={setLocal}
          onSalvar={salvar}
          onCancelar={() => setCriando(false)}
          pendente={pendente}
          erro={erro}
        />
      )}

      {!emFormulario && (
        <button
          type="button"
          onClick={abrirNovo}
          className="flex w-full items-center justify-center gap-2 rounded-suave border border-borda bg-superficie px-4 py-3 font-semibold"
        >
          <IconeMais className="h-5 w-5" />
          Novo jardim
        </button>
      )}

      {erro && !emFormulario && (
        <p role="alert" className="text-sm leading-relaxed text-alerta">
          {erro}
        </p>
      )}
    </div>
  );
}

function Formulario({
  nome,
  local,
  setNome,
  setLocal,
  onSalvar,
  onCancelar,
  onRemover,
  pendente,
  erro,
}: {
  nome: string;
  local: string;
  setNome: (v: string) => void;
  setLocal: (v: string) => void;
  onSalvar: () => void;
  onCancelar: () => void;
  onRemover?: () => void;
  pendente: boolean;
  erro: string | null;
}) {
  return (
    <div className="surgir space-y-3 rounded-suave border border-folha/30 bg-superficie p-4">
      <div>
        <label htmlFor="nome-jardim" className="mb-1.5 block text-sm font-semibold">
          Nome do jardim
        </label>
        <input
          id="nome-jardim"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="ex.: varanda de casa"
          autoCapitalize="sentences"
        />
      </div>

      <div>
        <label htmlFor="local-jardim" className="mb-1.5 block text-sm font-semibold">
          Cidade <span className="font-normal text-suave">(opcional)</span>
        </label>
        <input
          id="local-jardim"
          type="text"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder="ex.: São Paulo"
        />
      </div>

      {erro && (
        <p role="alert" className="text-sm leading-relaxed text-alerta">
          {erro}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSalvar}
          disabled={pendente}
          className="flex-1 rounded-suave bg-folha px-4 py-2.5 font-semibold text-white disabled:opacity-60 dark:text-papel"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 rounded-suave border border-borda px-4 py-2.5 font-semibold"
        >
          Cancelar
        </button>
      </div>

      {onRemover && (
        <button
          type="button"
          onClick={onRemover}
          disabled={pendente}
          className="w-full py-1 text-sm text-alerta underline underline-offset-4"
        >
          Apagar este jardim
        </button>
      )}
    </div>
  );
}
