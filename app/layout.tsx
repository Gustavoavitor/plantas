import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import RegistrarServiceWorker from "@/components/RegistrarServiceWorker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Plantas",
    template: "%s · Plantas",
  },
  description: "Lembretes de rega, diagnóstico e cuidados para as suas plantas.",
  manifest: "/manifest.webmanifest",
  applicationName: "Plantas",
  appleWebApp: {
    capable: true,
    title: "Plantas",
    statusBarStyle: "default",
  },
  // Impede que o iOS transforme datas e números em links azuis.
  formatDetection: { telephone: false, date: false, address: false, email: false },
  icons: {
    icon: "/icones/icone-192.png",
    apple: "/icones/icone-180.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Sem zoom: a barra de navegação inferior fica estável no iPhone.
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf6" },
    { media: "(prefers-color-scheme: dark)", color: "#141815" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        {/* Typekit: rokkitt (texto) e sedgwick-ave-display (título do jardim).
            O preconnect adianta o handshake e corta uns 100 ms na primeira
            pintura — a fonte vem de dois domínios diferentes. */}
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="" />
        <link rel="preconnect" href="https://p.typekit.net" crossOrigin="" />
        <link rel="stylesheet" href="https://use.typekit.net/ufu5bmi.css" />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
