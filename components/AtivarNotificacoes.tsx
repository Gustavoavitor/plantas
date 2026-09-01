"use client";

import { useEffect, useState } from "react";

/** Converte a chave VAPID (base64url) para o formato que o navegador exige. */
function chaveParaBytes(base64url: string) {
  const preenchimento = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + preenchimento).replace(/-/g, "+").replace(/_/g, "/");
  const bruto = atob(base64);
  return Uint8Array.from([...bruto].map((c) => c.charCodeAt(0)));
}

type Estado = "verificando" | "sem_suporte" | "precisa_instalar" | "desligado" | "ligado" | "negado";

export default function AtivarNotificacoes() {
  const [estado, setEstado] = useState<Estado>("verificando");
  const [ocupado, setOcupado] = useState(false);
  const [recado, setRecado] = useState<string | null>(null);

  useEffect(() => {
    async function verificar() {
      const ehIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const instalado =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as { standalone?: boolean }).standalone === true;

      // No iPhone, notificação web só existe depois de instalar na tela de início.
      if (ehIOS && !instalado) {
        setEstado("precisa_instalar");
        return;
      }

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setEstado("sem_suporte");
        return;
      }

      if (Notification.permission === "denied") {
        setEstado("negado");
        return;
      }

      const registro = await navigator.serviceWorker.getRegistration();
      const inscricao = await registro?.pushManager.getSubscription();
      setEstado(inscricao ? "ligado" : "desligado");
    }

    verificar().catch(() => setEstado("sem_suporte"));
  }, []);

  async function ligar() {
    setOcupado(true);
    setRecado(null);

    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setEstado(permissao === "denied" ? "negado" : "desligado");
        return;
      }

      const registro =
        (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;

      const inscricao = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: chaveParaBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      const r = await fetch("/api/push/inscrever", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inscricao.toJSON()),
      });

      if (!r.ok) throw new Error((await r.json()).erro ?? "Falha ao inscrever");

      setEstado("ligado");
      setRecado("Pronto. Você recebe um aviso por dia quando houver planta pendente.");
    } catch (e) {
      setRecado(e instanceof Error ? e.message : "Não consegui ativar as notificações.");
    } finally {
      setOcupado(false);
    }
  }

  async function desligar() {
    setOcupado(true);
    setRecado(null);

    try {
      const registro = await navigator.serviceWorker.getRegistration();
      const inscricao = await registro?.pushManager.getSubscription();

      if (inscricao) {
        await fetch(`/api/push/inscrever?endpoint=${encodeURIComponent(inscricao.endpoint)}`, {
          method: "DELETE",
        });
        await inscricao.unsubscribe();
      }

      setEstado("desligado");
    } catch {
      setRecado("Não consegui desligar. Tente de novo.");
    } finally {
      setOcupado(false);
    }
  }

  async function testar() {
    setOcupado(true);
    setRecado(null);
    try {
      const r = await fetch("/api/push/testar", { method: "POST" });
      const dados = await r.json();
      setRecado(r.ok ? "Enviei um aviso de teste." : (dados.erro ?? "Falhou."));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="rounded-suave border border-borda bg-superficie p-4">
      <h2 className="font-medium">Lembretes</h2>
      <p className="mt-1 text-sm leading-relaxed text-suave">
        Um aviso por dia, só quando houver planta para regar ou adubar.
      </p>

      <div className="mt-4">
        {estado === "verificando" && <p className="text-sm text-suave">Verificando…</p>}

        {estado === "precisa_instalar" && (
          <div className="rounded-suave bg-papel p-4 text-sm leading-relaxed">
            <p className="font-medium">Instale o app primeiro</p>
            <p className="mt-1 text-suave">
              No iPhone, as notificações só funcionam com o app na tela de início:
            </p>
            <ol className="mt-2 space-y-1 text-suave">
              <li>1. Toque no botão Compartilhar do Safari.</li>
              <li>2. Escolha &ldquo;Adicionar à Tela de Início&rdquo;.</li>
              <li>3. Abra o app pelo ícone e volte aqui.</li>
            </ol>
          </div>
        )}

        {estado === "sem_suporte" && (
          <p className="text-sm text-suave">
            Este navegador não aceita notificações. Tente pelo Safari no iPhone ou pelo
            Chrome no computador.
          </p>
        )}

        {estado === "negado" && (
          <p className="text-sm text-suave">
            As notificações foram bloqueadas. Libere nos ajustes do navegador para este
            site e recarregue a página.
          </p>
        )}

        {estado === "desligado" && (
          <button
            type="button"
            onClick={ligar}
            disabled={ocupado}
            className="w-full rounded-suave bg-folha px-4 py-3 font-medium text-white disabled:opacity-60 dark:text-papel"
          >
            {ocupado ? "Ativando…" : "Ativar notificações"}
          </button>
        )}

        {estado === "ligado" && (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium text-folha">
              <span aria-hidden>●</span> Ativas neste aparelho
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={testar}
                disabled={ocupado}
                className="flex-1 rounded-suave border border-borda px-4 py-2.5 text-sm font-medium disabled:opacity-60"
              >
                Enviar teste
              </button>
              <button
                type="button"
                onClick={desligar}
                disabled={ocupado}
                className="flex-1 rounded-suave border border-borda px-4 py-2.5 text-sm font-medium text-suave disabled:opacity-60"
              >
                Desligar
              </button>
            </div>
          </div>
        )}
      </div>

      {recado && <p className="mt-3 text-sm text-suave">{recado}</p>}
    </section>
  );
}
