import { Suspense } from "react";
import { BarChart3, FileText, Map } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { HomeInteractive } from "@/components/HomeInteractive";
import { CarouselSectionSkeleton } from "@/components/LoadingSkeletons";
import { fetchServerListSafe, fetchServerPageSafe } from "@/lib/website-api";

export const dynamic = "force-dynamic";

async function HomeCarouselsSection() {
  const [noticiasDestaquePage, eventosPage, cidades] = await Promise.all([
    fetchServerPageSafe<ApiNoticia>("noticias/", {
      is_featured: true,
      ordering: "-published_at",
      page_size: 10,
    }),
    fetchServerPageSafe<ApiEventos>("eventos/", {
      ordering: "-is_featured,-popularity,start_date",
      page_size: 30,
    }),
    fetchServerListSafe<ApiCidade>("cidades/?page_size=200"),
  ]);

  return (
    <HomeInteractive
      noticiasDestaque={noticiasDestaquePage.results.slice(0, 10)}
      eventos={eventosPage.results}
      cidades={cidades}
    />
  );
}

export default function Home() {
  return (
    <div className="w-full">
      <Header
        title={
          <>
            Observatório Regional do <span className="text-[#359830]">Turismo</span>
          </>
        }
        subtitle="Inteligência de dados, indicadores socioeconômicos, governança regional e monitoramento contínuo da atividade turística."
      />

      <Suspense
        fallback={
          <>
            <CarouselSectionSkeleton titleWidth="w-64" />
            <CarouselSectionSkeleton titleWidth="w-56" />
          </>
        }
      >
        <HomeCarouselsSection />
      </Suspense>

      {/* Sobre Section */}
      <section className="bg-white border-b border-slate-200/80 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-800">
            Sobre o Observatório Regional do Turismo
          </h2>
          <div className="mx-auto my-3 h-1 w-16 rounded-full bg-[#359830]" aria-hidden="true" />
          <div className="space-y-4 text-base sm:text-lg text-slate-600 leading-relaxed text-justify md:text-center">
            <p>
              O <strong>Observatório Regional do Turismo</strong> é uma plataforma pública de
              inteligência territorial dedicada ao monitoramento contínuo do setor turístico,
              integrando dados oficiais de emprego e estabelecimentos (RAIS, CAGED e Receita
              Federal) a indicadores socioeconômicos e demográficos municipais (IBGE).
            </p>
            <p>
              Iniciativa vinculada ao <strong>IFSULDEMINAS — Campus Poços de Caldas</strong>, o
              Observatório apoia gestores públicos, Instâncias de Governança Regionais (IGRs),
              pesquisadores e empreendedores com análises comparativas, mapas interativos, agendas
              culturais e conteúdos estratégicos para o desenvolvimento turístico sustentável em
              múltiplas regiões.
            </p>
          </div>
        </div>
      </section>

      {/* Cards Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-[#359830]/40 transition-all group">
            <div className="w-14 h-14 bg-[#EAF4E9] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#359830]/20 transition-colors">
              <BarChart3 className="h-7 w-7 text-[#359830]" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-3">Visão Geral</h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Acesse o dashboard principal com métricas de estabelecimentos, força de trabalho e
              evolução socioeconômica do setor.
            </p>
            <Link
              href="/dashboard"
              className="text-[#359830] font-bold text-sm flex items-center gap-2 hover:text-[#1D5C1B]"
            >
              Acessar Dashboard &rarr;
            </Link>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-[#359830]/40 transition-all group">
            <div className="w-14 h-14 bg-[#EAF4E9] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#359830]/20 transition-colors">
              <Map className="h-7 w-7 text-[#359830]" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-3">Municípios, Mapa & IGRs</h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Consulte dados municipais, explore atrativos e estabelecimentos no mapa interativo e
              conheça a governança regional.
            </p>
            <Link
              href="/mapa"
              className="text-[#359830] font-bold text-sm flex items-center gap-2 hover:text-[#1D5C1B]"
            >
              Explorar Mapa &rarr;
            </Link>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-[#359830]/40 transition-all group">
            <div className="w-14 h-14 bg-[#EAF4E9] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#359830]/20 transition-colors">
              <FileText className="h-7 w-7 text-[#359830]" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-3">Notícias & Eventos</h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Acompanhe estudos, comunicados, novidades do setor e a programação de eventos
              turísticos regionais.
            </p>
            <Link
              href="/noticias"
              className="text-[#359830] font-bold text-sm flex items-center gap-2 hover:text-[#1D5C1B]"
            >
              Ver Notícias &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
