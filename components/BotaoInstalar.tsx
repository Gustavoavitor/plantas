"use client";

import { useEffect, useState } from "react";

/**
 * O evento que o Chrome dispara quando o app é instalável.
 * Não está no lib.dom padrão, então declaramos o formato aqui.
 */
type EventoInstalacao = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Situacao = "verificando" | "instalado" | "pode_instalar" | "ios" | "sem_suporte";

export default function BotaoInstalar() {
  const [situacao, setSituacao] = useState<Situacao>("verificando");
  const [evento, setEvento] = useState<EventoInstalacao | null>(null);

  useEffect(() => {
    function detectar(): Situacao {
      const instalado =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as { standalone?: boolean }).standalone === true;
      if (instalado) return "instalado";

      // O Safari do iPhone não dispara beforeinstallprompt: lá a instalação
      // é sempre manual, pelo menu Compartilhar.
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return "ios";

      return "verificando";
    }

    function aoPoderInstalar(e: Event) {
      // Sem o preventDefault o Chrome mostra o próprio banner e o evento
      // não fica disponível para o nosso botão.
      e.preventDefault();
      setEvento(e as EventoInstalacao);
      setSituacao("pode_instalar");
    }

    function aoInstalar() {
      setSituacao("instalado");
      setEvento(null);
    }

    window.addEventListener("beforeinstallprompt", aoPoderInstalar);
    window.addEventListener("appinstalled", aoInstalar);

    // A leitura de window só pode acontecer depois da montagem: fazer isso
    // durante o render divergiria do HTML vindo do servidor.
    const agora = setTimeout(() => {
      const achado = detectar();
      if (achado !== "verificando") setSituacao(achado);
    }, 0);

    // Se o beforeinstallprompt não vier logo, o navegador não oferece
    // instalação com um toque — aí mostramos o caminho manual.
    const espera = setTimeout(() => {
      setSituacao((atual) => (atual === "verificando" ? "sem_suporte" : atual));
    }, 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", aoPoderInstalar);
      window.removeEventListener("appinstalled", aoInstalar);
      clearTimeout(agora);
      clearTimeout(espera);
    };
  }, []);

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    if (outcome === "accepted") setSituacao("instalado");
    setEvento(null);
  }

  return (
    <section className="rounded-suave border border-borda bg-superficie p-4">
      <h2 className="font-medium">Instalar como app</h2>

      {situacao === "instalado" && (
        <p className="mt-2 flex items-center gap-2 text-sm font-medium text-folha">
          <span aria-hidden>●</span> Instalado neste aparelho
        </p>
      )}

      {situacao === "pode_instalar" && (
        <>
          <p className="mt-1 text-sm leading-relaxed text-suave">
            Abre em tela cheia, com ícone próprio, e passa a poder mandar
            notificação.
          </p>
          <button
            type="button"
            onClick={instalar}
            className="mt-4 w-full rounded-suave bg-folha px-4 py-3 font-medium text-white dark:text-papel"
          >
            Instalar
          </button>
        </>
      )}

      {situacao === "ios" && (
        <>
          <p className="mt-1 text-sm leading-relaxed text-suave">
            No iPhone a instalação é manual, e só funciona pelo Safari:
          </p>
          <ol className="mt-2 space-y-1.5 text-sm leading-relaxed text-suave">
            <li>1. Toque no botão Compartilhar (o quadrado com a seta para cima).</li>
            <li>2. Role e escolha &ldquo;Adicionar à Tela de Início&rdquo;.</li>
            <li>3. Abra o app pelo ícone novo.</li>
          </ol>
          <p className="mt-3 text-sm leading-relaxed text-suave">
            As notificações do iPhone só funcionam depois desse passo — no Safari
            comum elas não existem.
          </p>
        </>
      )}

      {situacao === "sem_suporte" && (
        <>
          <p className="mt-1 text-sm leading-relaxed text-suave">
            Este navegador não oferece instalação, ou o app já está instalado.
          </p>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-suave">
            <li>
              <strong className="font-medium text-tinta">Android:</strong> abra pelo
              Chrome e use o menu ⋮ → &ldquo;Instalar app&rdquo;.
            </li>
            <li>
              <strong className="font-medium text-tinta">Computador:</strong> no Chrome
              ou Edge, o ícone de instalar aparece na barra de endereço.
            </li>
          </ul>
        </>
      )}

      {situacao === "verificando" && <p className="mt-2 text-sm text-suave">Verificando…</p>}
    </section>
  );
}
