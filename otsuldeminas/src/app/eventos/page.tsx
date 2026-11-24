import { Suspense } from "react";
import { Header } from "@/components/Header";
import { EventosClient } from "@/components/EventosClient";
import { fetchServerListSafe } from "@/lib/website-api";

export const dynamic = "force-dynamic";

export default async function EventosPage() {
  const eventos = await fetchServerListSafe<ApiEventos>("eventos/");
  const sortedEventos = [...eventos].sort(
    (a, b) => new Date(a.start_date || "").getTime() - new Date(b.start_date || "").getTime(),
  );

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Header
        badge="Agenda Turística"
        title="Eventos & Festividades"
        subtitle="Consulte a programação de eventos culturais, gastronômicos e turísticos nos municípios da região."
      />
      <Suspense fallback={<div className="min-h-[40vh] bg-slate-50" />}>
        <EventosClient initialEventos={sortedEventos} />
      </Suspense>
    </main>
  );
}
