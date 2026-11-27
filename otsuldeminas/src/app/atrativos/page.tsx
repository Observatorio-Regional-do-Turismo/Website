import { Suspense } from "react";
import { AtrativosClient } from "@/components/AtrativosClient";
import { Header } from "@/components/Header";
import { FilterBarSkeleton, StandardCardGridSkeleton } from "@/components/LoadingSkeletons";
import { fetchServerListSafe, fetchServerPageSafe } from "@/lib/website-api";

export const dynamic = "force-dynamic";

async function AtrativosContent() {
  const [atrativosPage, destaquesPage, locaisPage, cidades, igrs] = await Promise.all([
    fetchServerPageSafe<ApiPontoTuristico>("pontos-turisticos/", {
      page: 1,
      page_size: 20,
      ordering: "-is_featured,-popularity,name",
    }),
    fetchServerPageSafe<ApiPontoTuristico>("pontos-turisticos/", {
      page: 1,
      page_size: 10,
      is_featured: true,
      ordering: "-popularity,name",
    }),
    fetchServerPageSafe<ApiEstabelecimentoGeo>("locais/", {
      page: 1,
      page_size: 20,
      ordering: "nome",
    }),
    fetchServerListSafe<ApiCidade>("cidades/?page_size=200"),
    fetchServerListSafe<ApiIGR>("igrs/?page_size=200"),
  ]);

  return (
    <AtrativosClient
      initialAtrativosPage={atrativosPage}
      initialDestaques={destaquesPage.results.slice(0, 10)}
      initialLocaisPage={locaisPage}
      initialCidades={cidades}
      initialIgrs={igrs}
    />
  );
}

export default function AtrativosPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Header
        badge="Patrimônio, Gastronomia & Serviços"
        title="Atrativos, Restaurantes & Serviços"
        subtitle="Explore os principais pontos turísticos, restaurantes, meios de hospedagem e serviços georreferenciados dos municípios da região."
      />
      <Suspense
        fallback={
          <>
            <FilterBarSkeleton columns={4} />
            <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10 flex-1">
              <StandardCardGridSkeleton count={8} />
            </section>
          </>
        }
      >
        <AtrativosContent />
      </Suspense>
    </main>
  );
}
