import { Suspense } from "react";
import { CidadesClient } from "@/components/CidadesClient";
import { Header } from "@/components/Header";
import { FilterBarSkeleton, StandardCardGridSkeleton } from "@/components/LoadingSkeletons";
import { fetchServerListSafe, fetchServerPageSafe } from "@/lib/website-api";

export const dynamic = "force-dynamic";

async function CidadesContent() {
  const [cidadesPage, estados, igrs, noticias] = await Promise.all([
    fetchServerPageSafe<ApiCidade>("cidades/", { page: 1, page_size: 20, ordering: "name" }),
    fetchServerListSafe<ApiEstado>("estados/?page_size=100"),
    fetchServerListSafe<ApiIGR>("igrs/?page_size=200"),
    fetchServerListSafe<ApiNoticia>("noticias/?page_size=200"),
  ]);

  return (
    <CidadesClient
      initialPage={cidadesPage}
      initialEstados={estados}
      initialIgrs={igrs}
      initialNoticias={noticias}
    />
  );
}

export default function CidadesPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Header
        badge="Observatório Regional"
        title="Municípios & Indicadores"
        subtitle="Consulte dados socioeconômicos, demográficos, infraestrutura turística, notícias e eventos por município."
      />
      <Suspense
        fallback={
          <>
            <FilterBarSkeleton columns={5} />
            <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10 flex-1">
              <StandardCardGridSkeleton count={8} />
            </section>
          </>
        }
      >
        <CidadesContent />
      </Suspense>
    </main>
  );
}
