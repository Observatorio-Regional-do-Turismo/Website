import { Suspense } from "react";
import type { Metadata } from "next";
import { Gabarito } from "next/font/google";
import "../styles/globals.css";
import Footer from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { NavigationProgress } from "@/components/NavigationProgress";

const gabarito = Gabarito({
  variable: "--font-gabarito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Observatório Regional do Turismo",
  description:
    "Plataforma de inteligência turística, indicadores socioeconômicos, governança regional e agenda cultural.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }: AppLayoutProps) {
  return (
    <html lang="pt-br" className="min-h-screen">
      <body
        className={`${gabarito.variable} antialiased text-foreground min-h-screen flex flex-col`}
      >
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <Navbar />
        <main className="flex-1 flex flex-col w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
