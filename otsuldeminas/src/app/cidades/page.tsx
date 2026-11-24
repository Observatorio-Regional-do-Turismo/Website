import { Suspense } from "react";
import { CidadesClient } from "@/components/CidadesClient";
import { Header } from "@/components/Header";
import { fetchServerListSafe } from "@/lib/website-api";

export const dynamic = "force-dynamic";

export default async function CidadesPage() {
  const [cidades, estados, igrs, noticias] = await Promise.all([
    fetchServerListSafe<ApiCidade>("cidades/"),
    fetchServerListSafe<ApiEstado>("estados/"),
    fetchServerListSafe<ApiIGR>("igrs/"),
    fetchServerListSafe<ApiNoticia>("noticias/"),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Header
        badge="Observatório Regional"
        title="Municípios & Indicadores"
        subtitle="Consulte dados socioeconômicos, demográficos, infraestrutura turística, notícias e eventos por município."
      />
      <Suspense fallback={<div className="min-h-[40vh] bg-slate-50" />}>
        <CidadesClient
          initialCidades={cidades}
          initialEstados={estados}
          initialIgrs={igrs}
          initialNoticias={noticias}
        />
      </Suspense>
    </main>
  );
}
