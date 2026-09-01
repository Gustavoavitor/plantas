"use client";

import { useEffect } from "react";

/**
 * Registra o service worker, que é o que permite instalar o site como app
 * na tela de início do iPhone e receber notificações push.
 */
export default function RegistrarServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js").catch((erro) => {
      console.warn("Não consegui registrar o service worker:", erro);
    });
  }, []);

  return null;
}
