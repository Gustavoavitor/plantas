"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { adicionarFoto, registrarCuidado } from "@/app/acoes";
import { caminhoStorage, reduzirImagem } from "@/lib/imagem";
import { criarClienteNavegador } from "@/lib/supabase/cliente";
import type { TipoEvento } from "@/lib/tipos";
import { IconeAdubo, IconeCamera, IconeGota } from "./Icones";

type Props = {
  plantaId: string;
  usuarioId: string;
  adubacaoPausada: boolean;
};

export default function AcoesCuidado({ plantaId, usuarioId, adubacaoPausada }: Props) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [confirmado, setConfirmado] = useState<TipoEvento | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const entradaFoto = useRef<HTMLInputElement>(null);

  function registrar(tipo: TipoEvento) {
    setErro(null);
    iniciar(async () => {
      const r = await registrarCuidado(plantaId, tipo);
      if ("erro" in r && r.erro) {
        setErro(r.erro);
        return;
      }
      setConfirmado(tipo);
      setTimeout(() => setConfirmado(null), 2500);
    });
  }

  async function enviarFoto(evento: React.ChangeEvent<HTMLInputElement>) {
    const bruto = evento.target.files?.[0];
    if (!bruto) return;

    setEnviandoFoto(true);
    setErro(null);

    try {
      const arquivo = await reduzirImagem(bruto);
      const supabase = criarClienteNavegador();
      const caminho = caminhoStorage(usuarioId, arquivo.name);

      const { error } = await supabase.storage.from("fotos").upload(caminho, arquivo, {
        contentType: arquivo.type,
      });
      if (error) throw new Error(error.message);

      const url = supabase.storage.from("fotos").getPublicUrl(caminho).data.publicUrl;
      await adicionarFoto(plantaId, url);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui enviar a foto");
    } finally {
      setEnviandoFoto(false);
      if (entradaFoto.current) entradaFoto.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => registrar("rega")}
          disabled={pendente}
          className="flex items-center justify-center gap-2 rounded-suave bg-folha px-4 py-3.5 font-medium text-white disabled:opacity-60 dark:text-papel"
        >
          <IconeGota className="h-5 w-5" />
          {confirmado === "rega" ? "Registrada" : "Reguei"}
        </button>

        <button
          type="button"
          onClick={() => registrar("adubacao")}
          disabled={pendente}
          className="flex items-center justify-center gap-2 rounded-suave border border-borda bg-superficie px-4 py-3.5 font-medium disabled:opacity-60"
        >
          <IconeAdubo className="h-5 w-5" />
          {confirmado === "adubacao" ? "Registrada" : "Adubei"}
        </button>
      </div>

      {adubacaoPausada && (
        <p className="text-xs leading-relaxed text-suave">
          A adubação está pausada nesta época do ano. Você ainda pode registrar, se
          adubou mesmo assim.
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <BotaoSecundario onClick={() => registrar("poda")} pendente={pendente}>
          {confirmado === "poda" ? "✓" : "Podei"}
        </BotaoSecundario>
        <BotaoSecundario onClick={() => registrar("replantio")} pendente={pendente}>
          {confirmado === "replantio" ? "✓" : "Replantei"}
        </BotaoSecundario>
        <BotaoSecundario onClick={() => entradaFoto.current?.click()} pendente={enviandoFoto}>
          <span className="flex items-center justify-center gap-1.5">
            <IconeCamera className="h-4 w-4" />
            {enviandoFoto ? "…" : "Foto"}
          </span>
        </BotaoSecundario>
      </div>

      <input
        ref={entradaFoto}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={enviarFoto}
        className="sr-only"
      />

      {erro && (
        <p role="alert" className="text-sm text-alerta">
          {erro}
        </p>
      )}
    </div>
  );
}

function BotaoSecundario({
  onClick,
  pendente,
  children,
}: {
  onClick: () => void;
  pendente: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pendente}
      className="rounded-suave border border-borda bg-superficie px-2 py-2.5 text-sm font-medium disabled:opacity-60"
    >
      {children}
    </button>
  );
}
