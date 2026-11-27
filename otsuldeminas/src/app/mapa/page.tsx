import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { MapaClient } from "@/components/MapaClient";
import { fetchServerMapaOverview } from "@/lib/website-api";

export const dynamic = "force-dynamic";

async function MapaContent() {
  const mapaData = await fetchServerMapaOverview();
  return <MapaClient initialData={mapaData} />;
}

export default function MapaPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Header
        badge="Exploração Geográfica"
        title="Mapa Interativo"
        subtitle="Explore os municípios na visão regional e aproxime o mapa para visualizar pontos turísticos, restaurantes e eventos."
      />
      <Suspense
        fallback={
          <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-24 rounded-2xl bg-white border border-slate-200" />
              ))}
            </div>
            <Skeleton className="h-[520px] w-full rounded-3xl bg-[#EAF4E9] border border-slate-200" />
          </section>
        }
      >
        <MapaContent />
      </Suspense>
    </main>
  );
}
