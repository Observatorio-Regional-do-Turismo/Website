import { Suspense } from "react";
import { Header } from "@/components/Header";
import { EventosClient } from "@/components/EventosClient";
import { FilterBarSkeleton, StandardCardGridSkeleton } from "@/components/LoadingSkeletons";
import { fetchServerListSafe, fetchServerPageSafe } from "@/lib/website-api";

export const dynamic = "force-dynamic";

async function EventosContent() {
  const [eventosPage, cidades] = await Promise.all([
    fetchServerPageSafe<ApiEventos>("eventos/", {
      page: 1,
      page_size: 20,
      ordering: "start_date",
    }),
    fetchServerListSafe<ApiCidade>("cidades/?page_size=200"),
  ]);

  return <EventosClient initialPage={eventosPage} cidades={cidades} />;
}

export default function EventosPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Header
        badge="Agenda Turística"
        title="Eventos & Festividades"
        subtitle="Consulte a programação de eventos culturais, gastronômicos e turísticos nos municípios da região."
      />
      <Suspense
        fallback={
          <>
            <FilterBarSkeleton columns={3} />
            <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10 flex-1">
              <StandardCardGridSkeleton count={8} />
            </section>
          </>
        }
      >
        <EventosContent />
      </Suspense>
    </main>
  );
}
