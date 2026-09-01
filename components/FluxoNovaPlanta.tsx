"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { criarPlanta } from "@/app/acoes";
import type { Cuidados } from "@/lib/catalogo";
import { calcularIntervaloAdubacao, calcularIntervaloRega } from "@/lib/cuidados";
import { caminhoStorage, reduzirImagem } from "@/lib/imagem";
import { criarClienteNavegador } from "@/lib/supabase/cliente";
import type { Ambiente, Luz, PalpiteEspecie, TamanhoVaso } from "@/lib/tipos";
import { ROTULOS } from "@/lib/tipos";
import { IconeCamera } from "./Icones";

type Etapa = "foto" | "identificando" | "escolha" | "detalhes";

type ResultadoBusca = {
  nomeCientifico: string | null;
  nomeComum: string | null;
  origem: "catalogo" | "perenual";
};

const ORGAOS = [
  { valor: "auto", rotulo: "A planta inteira" },
  { valor: "leaf", rotulo: "Folha" },
  { valor: "flower", rotulo: "Flor" },
  { valor: "fruit", rotulo: "Fruto" },
  { valor: "bark", rotulo: "Caule / tronco" },
] as const;

const AVISO_PRECISAO: Record<Cuidados["precisao"], string | null> = {
  especie: null,
  genero: "Cuidados do gênero — costuma valer para todas as espécies parecidas.",
  familia: "Não tenho esta espécie no catálogo. Usei os cuidados típicos da família.",
  padrao: "Espécie desconhecida para mim: parti de um cronograma médio, que você pode ajustar.",
};

export default function FluxoNovaPlanta({ usuarioId }: { usuarioId: string }) {
  const router = useRouter();
  const entradaArquivo = useRef<HTMLInputElement>(null);

  const [etapa, setEtapa] = useState<Etapa>("foto");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [orgao, setOrgao] = useState<string>("auto");

  const [palpites, setPalpites] = useState<PalpiteEspecie[]>([]);
  const [cuidados, setCuidados] = useState<Cuidados | null>(null);
  const [nomeEscolhido, setNomeEscolhido] = useState<{
    cientifico: string | null;
    comum: string | null;
  }>({ cientifico: null, comum: null });

  const [termoBusca, setTermoBusca] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState<ResultadoBusca[] | null>(null);
  const [buscando, setBuscando] = useState(false);

  const [apelido, setApelido] = useState("");
  const [ambiente, setAmbiente] = useState<Ambiente>("interno");
  const [luz, setLuz] = useState<Luz>("luz_indireta");
  const [vaso, setVaso] = useState<TamanhoVaso>("medio");
  const [jaRegouHoje, setJaRegouHoje] = useState(true);
  const [notas, setNotas] = useState("");
  const [salvando, setSalvando] = useState(false);

  const entrada = cuidados?.entrada ?? null;

  const sugestao = useMemo(
    () => calcularIntervaloRega(entrada, { ambiente, luz, tamanho_vaso: vaso }),
    [entrada, ambiente, luz, vaso],
  );
  const sugestaoAdubo = useMemo(() => calcularIntervaloAdubacao(entrada), [entrada]);

  const [intervaloRega, setIntervaloRega] = useState<number | null>(null);
  const regaFinal = intervaloRega ?? sugestao.dias;

  // ----------------------------------------------------------------
  // Foto e identificação
  // ----------------------------------------------------------------

  async function aoEscolherFoto(evento: React.ChangeEvent<HTMLInputElement>) {
    const bruto = evento.target.files?.[0];
    if (!bruto) return;

    setErro(null);
    const reduzido = await reduzirImagem(bruto);
    setArquivo(reduzido);
    setPrevia(URL.createObjectURL(reduzido));
  }

  async function identificar() {
    if (!arquivo) return;
    setErro(null);
    setAviso(null);
    setEtapa("identificando");

    const form = new FormData();
    form.append("imagens", arquivo);
    form.append("orgaos", orgao);

    try {
      const r = await fetch("/api/identificar", { method: "POST", body: form });
      const dados = await r.json();
      if (!r.ok) throw new Error(dados.erro ?? "Falha na identificação");

      setPalpites(dados.palpites ?? []);
      setCuidados(dados.cuidados ?? null);
      if (dados.aviso) setAviso(dados.aviso);

      const primeiro = dados.palpites?.[0] as PalpiteEspecie | undefined;
      if (primeiro) {
        const popular = dados.cuidados?.entrada?.nomes?.[0] ?? primeiro.nomesComuns[0] ?? null;
        setNomeEscolhido({ cientifico: primeiro.nomeCientifico, comum: popular });
        setApelido(popular ?? primeiro.nomeCientifico);
      }

      setEtapa("escolha");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha na identificação");
      setEtapa("foto");
    }
  }

  async function carregarCuidados(nomeCientifico: string, familia?: string | null) {
    const url = new URL("/api/especie", window.location.origin);
    url.searchParams.set("cientifico", nomeCientifico);
    if (familia) url.searchParams.set("familia", familia);

    try {
      const r = await fetch(url);
      const dados = await r.json();
      setCuidados(dados.cuidados ?? null);
      return dados.cuidados as Cuidados | null;
    } catch {
      setCuidados(null);
      return null;
    }
  }

  async function escolherPalpite(p: PalpiteEspecie) {
    const c = await carregarCuidados(p.nomeCientifico, p.familia);
    const popular = c?.entrada?.nomes?.[0] ?? p.nomesComuns[0] ?? null;

    setNomeEscolhido({ cientifico: p.nomeCientifico, comum: popular });
    if (!apelido) setApelido(popular ?? p.nomeCientifico);
    setIntervaloRega(null);
    setEtapa("detalhes");
  }

  async function buscarPorNome() {
    if (termoBusca.trim().length < 2) return;
    setBuscando(true);
    setErro(null);
    try {
      const r = await fetch(`/api/especie?q=${encodeURIComponent(termoBusca.trim())}`);
      const dados = await r.json();
      if (!r.ok) throw new Error(dados.erro);
      setResultadosBusca(dados.resultados ?? []);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha na busca");
    } finally {
      setBuscando(false);
    }
  }

  async function escolherDaBusca(r: ResultadoBusca) {
    if (!r.nomeCientifico) return;
    const c = await carregarCuidados(r.nomeCientifico);
    const popular = r.nomeComum ?? c?.entrada?.nomes?.[0] ?? null;

    setNomeEscolhido({ cientifico: r.nomeCientifico, comum: popular });
    if (!apelido) setApelido(popular ?? r.nomeCientifico);
    setIntervaloRega(null);
    setEtapa("detalhes");
  }

  function pularIdentificacao() {
    setCuidados(null);
    setNomeEscolhido({ cientifico: null, comum: null });
    setIntervaloRega(null);
    setEtapa("detalhes");
  }

  // ----------------------------------------------------------------
  // Salvar
  // ----------------------------------------------------------------

  async function salvar() {
    if (!apelido.trim()) {
      setErro("Dê um apelido para a planta.");
      return;
    }

    setSalvando(true);
    setErro(null);

    let fotoUrl: string | null = null;

    if (arquivo) {
      const supabase = criarClienteNavegador();
      const caminho = caminhoStorage(usuarioId, arquivo.name);
      const { error } = await supabase.storage.from("fotos").upload(caminho, arquivo, {
        contentType: arquivo.type,
        upsert: false,
      });

      if (error) {
        setErro(`Não consegui salvar a foto: ${error.message}`);
        setSalvando(false);
        return;
      }

      fotoUrl = supabase.storage.from("fotos").getPublicUrl(caminho).data.publicUrl;
    }

    const resultado = await criarPlanta({
      apelido: apelido.trim(),
      nomeCientifico: nomeEscolhido.cientifico,
      nomeComum: nomeEscolhido.comum,
      fotoUrl,
      ambiente,
      luz,
      tamanhoVaso: vaso,
      intervaloRegaDias: regaFinal,
      intervaloAdubaDias: sugestaoAdubo.dias,
      jaRegouHoje,
      notas: notas.trim() || null,
    });

    if ("erro" in resultado) {
      setErro(resultado.erro!);
      setSalvando(false);
      return;
    }

    router.push(`/planta/${resultado.id}`);
  }

  // ----------------------------------------------------------------
  // Telas
  // ----------------------------------------------------------------

  if (etapa === "identificando") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-borda border-t-folha" />
        <p className="mt-5 font-medium">Identificando a espécie…</p>
        <p className="mt-1 text-sm text-suave">Consultando a Pl@ntNet.</p>
      </div>
    );
  }

  if (etapa === "foto") {
    return (
      <div className="space-y-5">
        <input
          ref={entradaArquivo}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={aoEscolherFoto}
          className="sr-only"
        />

        <button
          type="button"
          onClick={() => entradaArquivo.current?.click()}
          className="flex aspect-4/3 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-suave border-2 border-dashed border-borda bg-superficie"
        >
          {previa ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previa} alt="Prévia da foto" className="h-full w-full object-cover" />
          ) : (
            <>
              <IconeCamera className="h-10 w-10 text-suave" />
              <span className="font-medium">Tirar foto da planta</span>
              <span className="max-w-[16rem] text-center text-sm text-suave">
                Uma folha isolada, com boa luz e fundo limpo, dá o melhor resultado.
              </span>
            </>
          )}
        </button>

        {previa && (
          <>
            <div>
              <label htmlFor="orgao" className="mb-1.5 block text-sm font-medium">
                O que aparece na foto?
              </label>
              <select id="orgao" value={orgao} onChange={(e) => setOrgao(e.target.value)}>
                {ORGAOS.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.rotulo}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-suave">
                Dizer qual parte é qual melhora bastante a precisão.
              </p>
            </div>

            <button
              type="button"
              onClick={identificar}
              className="w-full rounded-suave bg-folha px-4 py-3 font-medium text-white dark:text-papel"
            >
              Identificar espécie
            </button>
          </>
        )}

        {erro && (
          <p role="alert" className="text-sm text-alerta">
            {erro}
          </p>
        )}

        <button
          type="button"
          onClick={pularIdentificacao}
          className="w-full py-2 text-sm font-medium text-suave underline underline-offset-4"
        >
          Cadastrar sem foto e sem identificar
        </button>
      </div>
    );
  }

  if (etapa === "escolha") {
    return (
      <div className="space-y-5">
        {previa && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previa} alt="" className="h-40 w-full rounded-suave object-cover" />
        )}

        {aviso && (
          <p className="rounded-suave border border-atencao/30 bg-atencao-clara px-4 py-3 text-sm text-atencao">
            {aviso}
          </p>
        )}

        {palpites.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-suave uppercase">
              Qual delas é?
            </h2>
            <ul className="space-y-2">
              {palpites.map((p) => (
                <li key={p.nomeCientifico}>
                  <button
                    type="button"
                    onClick={() => escolherPalpite(p)}
                    className="flex w-full items-center gap-3 rounded-suave border border-borda bg-superficie p-3 text-left"
                  >
                    {p.imagemReferencia ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imagemReferencia}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-folha-clara">
                        🌿
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {p.nomesComuns[0] ?? p.nomeCientifico}
                      </p>
                      <p className="truncate text-sm text-suave italic">{p.nomeCientifico}</p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-folha tabular-nums">
                      {Math.round(p.confianca * 100)}%
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <details className="rounded-suave border border-borda bg-superficie p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Nenhuma dessas — buscar pelo nome
          </summary>
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ex.: costela-de-adão"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    buscarPorNome();
                  }
                }}
              />
              <button
                type="button"
                onClick={buscarPorNome}
                disabled={buscando}
                className="shrink-0 rounded-suave border border-borda px-4 font-medium"
              >
                {buscando ? "…" : "Buscar"}
              </button>
            </div>

            {resultadosBusca?.length === 0 && (
              <p className="text-sm text-suave">Nada encontrado com esse nome.</p>
            )}

            {resultadosBusca && resultadosBusca.length > 0 && (
              <ul className="space-y-2">
                {resultadosBusca.map((r) => (
                  <li key={`${r.nomeCientifico}-${r.nomeComum}`}>
                    <button
                      type="button"
                      onClick={() => escolherDaBusca(r)}
                      className="w-full rounded-lg border border-borda p-2.5 text-left"
                    >
                      <p className="text-sm font-medium">{r.nomeComum ?? r.nomeCientifico}</p>
                      {r.nomeCientifico && (
                        <p className="text-xs text-suave italic">{r.nomeCientifico}</p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>

        <button
          type="button"
          onClick={pularIdentificacao}
          className="w-full py-2 text-sm font-medium text-suave underline underline-offset-4"
        >
          Continuar sem identificar a espécie
        </button>
      </div>
    );
  }

  // Etapa "detalhes"
  return (
    <div className="space-y-6">
      {nomeEscolhido.cientifico && (
        <div className="rounded-suave border border-folha/25 bg-folha-clara px-4 py-3">
          <p className="font-medium">{nomeEscolhido.comum ?? nomeEscolhido.cientifico}</p>
          <p className="text-sm text-suave italic">{nomeEscolhido.cientifico}</p>
          {cuidados && AVISO_PRECISAO[cuidados.precisao] && (
            <p className="mt-2 text-xs leading-relaxed text-suave">
              {AVISO_PRECISAO[cuidados.precisao]}
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="apelido" className="mb-1.5 block text-sm font-medium">
          Como você chama essa planta?
        </label>
        <input
          id="apelido"
          type="text"
          value={apelido}
          onChange={(e) => setApelido(e.target.value)}
          placeholder="ex.: costela da sala"
          autoCapitalize="sentences"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Onde ela fica?</legend>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(ROTULOS.ambiente) as Ambiente[]).map((v) => (
            <BotaoOpcao key={v} ativo={ambiente === v} onClick={() => setAmbiente(v)}>
              {ROTULOS.ambiente[v]}
            </BotaoOpcao>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Quanta luz ela recebe?</legend>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(ROTULOS.luz) as Luz[]).map((v) => (
            <BotaoOpcao key={v} ativo={luz === v} onClick={() => setLuz(v)}>
              {ROTULOS.luz[v]}
            </BotaoOpcao>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Tamanho do vaso</legend>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(ROTULOS.vaso) as TamanhoVaso[]).map((v) => (
            <BotaoOpcao key={v} ativo={vaso === v} onClick={() => setVaso(v)}>
              {ROTULOS.vaso[v]}
            </BotaoOpcao>
          ))}
        </div>
      </fieldset>

      {/* Cronograma calculado ao vivo conforme as escolhas acima */}
      <div className="rounded-suave border border-borda bg-superficie p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-medium">Cronograma sugerido</h3>
          <span className="text-sm text-suave">a cada</span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={120}
            value={regaFinal}
            onChange={(e) => setIntervaloRega(Number(e.target.value))}
            className="!w-20 text-center tabular-nums"
            aria-label="Intervalo de rega em dias"
          />
          <span className="text-sm">dias de rega</span>
          {intervaloRega !== null && intervaloRega !== sugestao.dias && (
            <button
              type="button"
              onClick={() => setIntervaloRega(null)}
              className="ml-auto text-xs font-medium text-folha underline underline-offset-4"
            >
              Voltar à sugestão
            </button>
          )}
        </div>

        {sugestao.motivos.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-borda pt-3 text-xs leading-relaxed text-suave">
            {sugestao.motivos.map((m) => (
              <li key={m}>• {m}</li>
            ))}
          </ul>
        )}

        <p className="mt-3 border-t border-borda pt-3 text-xs leading-relaxed text-suave">
          <strong className="font-medium text-tinta">Adubação: </strong>
          {sugestaoAdubo.dias === 0 ? "pausada agora. " : `a cada ${sugestaoAdubo.dias} dias. `}
          {sugestaoAdubo.motivo}
        </p>
      </div>

      {entrada && entrada.dicas.length > 0 && (
        <div className="rounded-suave border border-borda bg-superficie p-4">
          <h3 className="mb-2 font-medium">Bom saber</h3>
          <ul className="space-y-2 text-sm leading-relaxed text-suave">
            {entrada.dicas.map((d) => (
              <li key={d}>• {d}</li>
            ))}
          </ul>
        </div>
      )}

      <label className="flex items-start gap-3 rounded-suave border border-borda bg-superficie p-4">
        <input
          type="checkbox"
          checked={jaRegouHoje}
          onChange={(e) => setJaRegouHoje(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--folha)]"
        />
        <span className="text-sm">
          Reguei hoje
          <span className="block text-suave">
            A contagem começa a partir de agora. Desmarque se faz dias que não rega.
          </span>
        </span>
      </label>

      <div>
        <label htmlFor="notas" className="mb-1.5 block text-sm font-medium">
          Anotações <span className="font-normal text-suave">(opcional)</span>
        </label>
        <textarea
          id="notas"
          rows={3}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Onde comprou, quem deu, manias dela…"
        />
      </div>

      {erro && (
        <p role="alert" className="text-sm text-alerta">
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        className="w-full rounded-suave bg-folha px-4 py-3.5 font-medium text-white disabled:opacity-60 dark:text-papel"
      >
        {salvando ? "Salvando…" : "Adicionar ao jardim"}
      </button>
    </div>
  );
}

function BotaoOpcao({
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
        ativo
          ? "border-folha bg-folha-clara text-folha"
          : "border-borda bg-superficie text-tinta"
      }`}
    >
      {children}
    </button>
  );
}
