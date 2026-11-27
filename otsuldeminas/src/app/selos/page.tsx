import { Suspense } from "react";
import { Header } from "@/components/Header";
import { FilterBarSkeleton, StandardCardGridSkeleton } from "@/components/LoadingSkeletons";
import { SelosClient } from "@/components/SelosClient";
import { fetchServerListSafe, fetchServerPageSafe } from "@/lib/website-api";

export const dynamic = "force-dynamic";

async function SelosContent() {
  const [igrsPage, cidades] = await Promise.all([
    fetchServerPageSafe<ApiIGR>("igrs/", { page: 1, page_size: 20, ordering: "name" }),
    fetchServerListSafe<ApiCidade>("cidades/?page_size=200"),
  ]);

  return <SelosClient initialPage={igrsPage} initialCidades={cidades} />;
}

export default function SelosPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Header
        badge="Regionalização & Governança Turística"
        title="IGRs (Governança Regional)"
        subtitle="Conheça as Instâncias de Governança Regionais e os municípios integrados nos circuitos turísticos."
      />
      <Suspense
        fallback={
          <>
            <FilterBarSkeleton columns={2} />
            <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10 flex-1">
              <StandardCardGridSkeleton count={8} />
            </section>
          </>
        }
      >
        <SelosContent />
      </Suspense>
    </main>
  );
}
