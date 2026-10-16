import type { Metadata, Viewport } from "next";
import "@phosphor-icons/web/regular";
import "@phosphor-icons/web/fill";
import "./globals.css";

import ToastProvider from "@/components/fx/ToastProvider";
import CampaignsProvider from "@/lib/CampaignsProvider";
import Navbar from "@/components/layout/Navbar";
import AdminBar from "@/components/layout/AdminBar";
import Footer from "@/components/layout/Footer";
import SunDefs from "@/components/layout/SunDefs";
import BodyClassManager from "@/components/layout/BodyClassManager";
import HashScroll from "@/components/layout/HashScroll";
import ScrollFX from "@/components/layout/ScrollFX";

export const metadata: Metadata = {
  title: "Oxente — vaquinhas que viram história",
  description:
    "Escolha uma causa, pague por Pix, cartão ou boleto em menos de um minuto — e acompanhe cada real virando história.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=Fraunces:ital,opsz,wght@1,9..144,300..700&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap"
          rel="stylesheet"
        />
        <SunDefs />
        <ToastProvider>
          <CampaignsProvider>
            <Navbar />
            <AdminBar />
            <main>{children}</main>
            <Footer />
          </CampaignsProvider>
        </ToastProvider>
        <BodyClassManager />
        <HashScroll />
        <ScrollFX />
      </body>
    </html>
  );
}
