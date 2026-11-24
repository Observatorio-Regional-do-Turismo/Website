import { Header } from "@/components/Header";
import { MapaClient } from "@/components/MapaClient";
import { fetchServerMapaOverview } from "@/lib/website-api";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const mapaData = await fetchServerMapaOverview();

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Header
        badge="Exploração Geográfica"
        title="Mapa Interativo"
        subtitle="Explore os municípios na visão regional e aproxime o mapa para visualizar pontos turísticos, restaurantes e eventos."
      />
      <MapaClient initialData={mapaData} />
    </main>
  );
}
