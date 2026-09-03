import type { Metadata } from "next";
import { Gabarito } from "next/font/google";
import "@/styles/globals.css";
import Footer from "@/components/Footer";
import Head from "next/head";

const gabarito = Gabarito({
  variable: "--font-gabarito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Observatório Regional do Turismo",
};

import { Navbar } from "@/components/Navbar";

export default function RootLayout({children}: AppLayoutProps) {

  return (
    <html lang="pt-br" className="min-h-screen">
      <Head>
        <link rel="icon" href="/assets/favicon.ico" sizes="any" />
      </Head>
      <body className={`${gabarito.variable} antialiased text-foreground min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1 flex flex-col w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
