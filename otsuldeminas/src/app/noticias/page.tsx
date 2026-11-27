import { Suspense } from "react";
import { Header } from "@/components/Header";
import { FilterBarSkeleton, StandardCardGridSkeleton } from "@/components/LoadingSkeletons";
import { NoticiasClient } from "@/components/NoticiasClient";
import { fetchServerPageSafe } from "@/lib/website-api";

export const dynamic = "force-dynamic";

async function NoticiasContent() {
  const [noticiasPage, destaquePage] = await Promise.all([
    fetchServerPageSafe<ApiNoticia>("noticias/", {
      page: 1,
      page_size: 20,
      ordering: "-published_at",
    }),
    fetchServerPageSafe<ApiNoticia>("noticias/", {
      page: 1,
      page_size: 10,
      is_featured: true,
      ordering: "-published_at",
    }),
  ]);

  return (
    <NoticiasClient
      initialPage={noticiasPage}
      initialDestaques={destaquePage.results.slice(0, 10)}
    />
  );
}

export default function NoticiasPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Header
        badge="Comunicação Regional"
        title="Notícias & Comunicados"
        subtitle="Acompanhe novidades, lançamentos de roteiros, estudos e ações dos municípios e IGRs."
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
        <NoticiasContent />
      </Suspense>
    </main>
  );
}
