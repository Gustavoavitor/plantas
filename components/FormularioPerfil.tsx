"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { salvarPerfil } from "@/app/acoes";
import { tituloDoJardim } from "@/lib/titulo";

export default function FormularioPerfil({
  nomeInicial,
  tituloInicial,
}: {
  nomeInicial: string;
  tituloInicial: string;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [nome, setNome] = useState(nomeInicial);
  const [titulo, setTitulo] = useState(tituloInicial);
  const [recado, setRecado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const sugestao = tituloDoJardim({ nome, titulo_jardim: null });

  function salvar() {
    setErro(null);
    setRecado(null);
    iniciar(async () => {
      const r = await salvarPerfil(nome, titulo || null);
      if ("erro" in r && r.erro) {
        setErro(r.erro);
        return;
      }
      setRecado("Salvo.");
      router.refresh();
      setTimeout(() => setRecado(null), 2500);
    });
  }

  return (
    <section className="rounded-suave border border-borda bg-superficie p-4">
      <h2 className="font-semibold">Seu nome e o título do jardim</h2>

      <div className="mt-3 space-y-3">
        <div>
          <label htmlFor="nome" className="mb-1.5 block text-sm font-semibold">
            Como você se chama
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Gustavo"
            autoCapitalize="words"
          />
        </div>

        <div>
          <label htmlFor="titulo" className="mb-1.5 block text-sm font-semibold">
            Título na tela inicial
          </label>
          <input
            id="titulo"
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder={sugestao}
          />
          <p className="mt-1.5 text-xs leading-relaxed text-suave">
            Deixe em branco para usar <strong>{sugestao}</strong>. É campo livre
            porque não dá para adivinhar o artigo certo de cada nome — escreva
            &ldquo;Jardim do Gustavo&rdquo;, &ldquo;Jardim da Ana&rdquo; ou o que
            preferir.
          </p>
        </div>
      </div>

      {erro && (
        <p role="alert" className="mt-3 text-sm leading-relaxed text-alerta">
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={salvar}
        disabled={pendente}
        className="mt-4 w-full rounded-suave bg-folha px-4 py-2.5 font-semibold text-white disabled:opacity-60 dark:text-papel"
      >
        {recado ?? (pendente ? "Salvando…" : "Salvar")}
      </button>
    </section>
  );
}
