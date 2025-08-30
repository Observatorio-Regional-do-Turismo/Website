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

export default function RootLayout({children}: LayoutProps) {

  return (
    <html lang="pt-br" className="min-h-screen">
      <Head>
        <link rel="icon" href="/assets/favicon.ico" sizes="any" />
      </Head>
      <body className={`${gabarito.variable} antialiased text-foreground min-h-screen flex flex-col`}>
        {children}
        <Footer />
      </body>
    </html>
  );
}
