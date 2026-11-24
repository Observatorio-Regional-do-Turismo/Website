import { Suspense } from "react";
import { Header } from "@/components/Header";
import { SelosClient } from "@/components/SelosClient";
import { fetchServerListSafe } from "@/lib/website-api";

export const dynamic = "force-dynamic";

export default async function SelosPage() {
  const [igrs, cidades] = await Promise.all([
    fetchServerListSafe<ApiIGR>("igrs/"),
    fetchServerListSafe<ApiCidade>("cidades/"),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Header
        badge="Regionalização & Governança Turística"
        title="IGRs (Governança Regional)"
        subtitle="Conheça as Instâncias de Governança Regionais e os municípios integrados nos circuitos turísticos."
      />
      <Suspense fallback={<div className="min-h-[40vh] bg-slate-50" />}>
        <SelosClient initialIgrs={igrs} initialCidades={cidades} />
      </Suspense>
    </main>
  );
}
