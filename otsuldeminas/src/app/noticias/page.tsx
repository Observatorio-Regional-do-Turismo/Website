import { Suspense } from "react";
import { Header } from "@/components/Header";
import { NoticiasClient } from "@/components/NoticiasClient";
import { fetchServerListSafe } from "@/lib/website-api";

export const dynamic = "force-dynamic";

export default async function NoticiasPage() {
  const noticias = await fetchServerListSafe<ApiNoticia>("noticias/");

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Header
        badge="Comunicação Regional"
        title="Notícias & Comunicados"
        subtitle="Acompanhe novidades, lançamentos de roteiros, estudos e ações dos municípios e IGRs."
      />
      <Suspense fallback={<div className="min-h-[40vh] bg-slate-50" />}>
        <NoticiasClient initialNoticias={noticias} />
      </Suspense>
    </main>
  );
}
