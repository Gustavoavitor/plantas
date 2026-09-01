import webpush from "web-push";

let configurado = false;

/** Configura as chaves VAPID uma única vez por processo. */
export function prepararPush() {
  if (configurado) return;

  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privada = process.env.VAPID_PRIVATE_KEY;
  const assunto = process.env.VAPID_ASSUNTO ?? "mailto:contato@exemplo.com";

  if (!publica || !privada) {
    throw new Error("Chaves VAPID não configuradas");
  }

  webpush.setVapidDetails(assunto, publica, privada);
  configurado = true;
}

export type Aviso = {
  titulo: string;
  corpo: string;
  url: string;
  tag?: string;
};

export type Inscricao = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
};

/**
 * Envia um aviso para uma inscrição.
 * Devolve "expirada" quando o navegador já descartou a inscrição —
 * nesse caso o chamador deve apagá-la do banco.
 */
export async function enviarAviso(
  inscricao: Inscricao,
  aviso: Aviso,
): Promise<"enviado" | "expirada" | "falhou"> {
  prepararPush();

  try {
    await webpush.sendNotification(
      {
        endpoint: inscricao.endpoint,
        keys: { p256dh: inscricao.p256dh, auth: inscricao.auth_key },
      },
      JSON.stringify(aviso),
      { TTL: 12 * 60 * 60 },
    );
    return "enviado";
  } catch (erro) {
    const status = (erro as { statusCode?: number }).statusCode;
    // 404 ou 410: o usuário desinstalou o app ou revogou a permissão.
    if (status === 404 || status === 410) return "expirada";
    console.error("Falha ao enviar push:", erro);
    return "falhou";
  }
}
