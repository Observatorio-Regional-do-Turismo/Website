import { Suspense } from "react";
import { Header } from "@/components/Header";
import { AtrativosClient } from "@/components/AtrativosClient";
import { fetchServerListSafe } from "@/lib/website-api";

export const dynamic = "force-dynamic";

export default async function AtrativosPage() {
  const [atrativos, locais, cidades, igrs] = await Promise.all([
    fetchServerListSafe<ApiPontoTuristico>("pontos-turisticos/"),
    fetchServerListSafe<ApiEstabelecimentoGeo>("locais/"),
    fetchServerListSafe<ApiCidade>("cidades/"),
    fetchServerListSafe<ApiIGR>("igrs/"),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Header
        badge="Patrimônio, Gastronomia & Serviços"
        title="Atrativos, Restaurantes & Serviços"
        subtitle="Explore os principais pontos turísticos, restaurantes, meios de hospedagem e serviços georreferenciados dos municípios da região."
      />
      <Suspense fallback={<div className="min-h-[40vh] bg-slate-50" />}>
        <AtrativosClient
          initialAtrativos={atrativos}
          initialLocais={locais}
          initialCidades={cidades}
          initialIgrs={igrs}
        />
      </Suspense>
    </main>
  );
}
