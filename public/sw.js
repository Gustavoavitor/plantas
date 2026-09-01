/**
 * Service worker do Plantas.
 *
 * Faz duas coisas:
 *  1. Recebe as notificações push dos lembretes de rega.
 *  2. Guarda o casco do app para ele abrir mesmo sem internet.
 */

// Subir a versão descarta o cache antigo no próximo deploy.
const CACHE = "plantas-v2";
const ESSENCIAIS = ["/icones/icone-192.png", "/icones/icone-512.png"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ESSENCIAIS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))),
      )
      .then(() => self.clients.claim()),
  );
});

/**
 * Rede primeiro para navegação: os dados das plantas mudam o tempo todo,
 * então o cache serve só como rede de segurança quando está offline.
 */
self.addEventListener("fetch", (evento) => {
  const { request } = evento;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Rotas de API e de login nunca vêm do cache.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // Navegação sempre vem da rede e NUNCA entra no cache: a página de quem
  // está logado não pode sobrar guardada no aparelho para outra sessão.
  if (request.mode === "navigate") {
    evento.respondWith(
      fetch(request).catch(
        () =>
          new Response(
            "<!doctype html><meta charset=utf-8><title>Sem conexão</title>" +
              "<body style='font-family:system-ui;padding:2rem;text-align:center'>" +
              "<p>Sem conexão agora.</p><p><a href=''>Tentar de novo</a></p>",
            { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 503 },
          ),
      ),
    );
    return;
  }

  if (url.pathname.startsWith("/icones/") || url.pathname.startsWith("/_next/static/")) {
    evento.respondWith(
      caches.match(request).then(
        (guardado) =>
          guardado ??
          fetch(request).then((resposta) => {
            const copia = resposta.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copia));
            return resposta;
          }),
      ),
    );
  }
});

// ------------------------------------------------------------------
// Notificações
// ------------------------------------------------------------------

self.addEventListener("push", (evento) => {
  let dados = { titulo: "Plantas", corpo: "Confira o seu jardim.", url: "/jardim" };

  try {
    if (evento.data) dados = { ...dados, ...evento.data.json() };
  } catch {
    if (evento.data) dados.corpo = evento.data.text();
  }

  evento.waitUntil(
    self.registration.showNotification(dados.titulo, {
      body: dados.corpo,
      icon: "/icones/icone-192.png",
      badge: "/icones/icone-192.png",
      tag: dados.tag || "plantas",
      renotify: true,
      data: { url: dados.url || "/jardim" },
    }),
  );
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const destino = evento.notification.data?.url || "/jardim";

  evento.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((janelas) => {
        // Se o app já estiver aberto, aproveita a janela existente.
        for (const janela of janelas) {
          if (janela.url.includes(self.location.origin) && "focus" in janela) {
            janela.navigate(destino);
            return janela.focus();
          }
        }
        return self.clients.openWindow(destino);
      }),
  );
});
