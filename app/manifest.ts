import type { MetadataRoute } from "next";

/** Gera /manifest.webmanifest — é o que permite instalar o app na tela de início. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Plantas",
    short_name: "Plantas",
    description: "Lembretes de rega, diagnóstico e cuidados para as suas plantas.",
    start_url: "/jardim",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbfaf6",
    theme_color: "#2f6b4f",
    lang: "pt-BR",
    dir: "ltr",
    categories: ["lifestyle", "utilities"],
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icones/icone-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Adicionar planta", url: "/nova" },
      { name: "Meu jardim", url: "/jardim" },
    ],
  };
}
