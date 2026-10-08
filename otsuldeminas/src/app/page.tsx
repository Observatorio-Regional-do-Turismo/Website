"use client";

import { useState, useEffect } from "react";
import { Map, BarChart3, FileText, Sparkles, Newspaper, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { fetchNoticias, getNoticiasDestaque } from "@/lib/noticias-api";
import { NoticiaCarousel } from "@/components/NoticiaCarousel";
import { NoticiaModal } from "@/components/NoticiaModal";

export default function Home() {
  const [noticiasDestaque, setNoticiasDestaque] = useState<ApiNoticia[]>([]);
  const [selectedNoticia, setSelectedNoticia] = useState<ApiNoticia | null>(null);
  const [loadingNoticias, setLoadingNoticias] = useState(true);
  const [noticiasError, setNoticiasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadHomeNews() {
      try {
        const todas = await fetchNoticias();
        if (isMounted) {
          const destaques = getNoticiasDestaque(todas);
          setNoticiasDestaque(destaques);
        }
      } catch (e) {
        console.error("Erro ao carregar notícias na página inicial:", e);
        if (isMounted) setNoticiasError(true);
      } finally {
        if (isMounted) setLoadingNoticias(false);
      }
    }
    loadHomeNews();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full py-24 sm:py-32 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="/images/sul_de_minas_bg.jpg" 
            alt="Turismo no Sul de Minas" 
            className="w-full h-full object-cover opacity-40" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900/90"></div>
        </div>
        <div className="relative z-10 text-center max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-md">
            Bem-vindo ao <span className="text-[#359830]">Observatório Regional do Turismo  </span>
          </h1>
          <div className="mx-auto my-4 h-1 w-20 rounded-full bg-[#C90C0F]" aria-hidden="true" />
          <p className="text-xl text-slate-300 leading-relaxed drop-shadow-sm">
            Navegue pelas principais áreas para acessar indicadores de turismo,
            mapas interativos, dados das cidades, IGRs e relatórios detalhados da Região.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SEÇÃO: NOTÍCIAS EM DESTAQUE (HOME: APENAS DESTAQUES ORDENADOS POR DATA) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#C90C0F] text-xs font-bold uppercase tracking-wider mb-2 border border-[#C90C0F]/20">
              <Sparkles className="h-3.5 w-3.5" />
              Cobertura Regional
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              Notícias em Destaque
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Principais acontecimentos, lançamentos de roteiros e novidades do turismo
            </p>
          </div>

          <Link
            href="/noticias"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#359830] hover:text-[#1D5C1B] transition-colors self-start sm:self-auto group"
          >
            Ver todas as notícias
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {loadingNoticias ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-[#359830]" />
            <span className="text-sm font-medium">Carregando notícias em destaque...</span>
          </div>
        ) : noticiasError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-900">
            Não foi possível carregar as notícias em destaque. Tente novamente mais tarde.
          </div>
        ) : noticiasDestaque.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
            <Newspaper className="h-8 w-8 mx-auto mb-2 text-slate-400" />
            Nenhuma notícia em destaque no momento.
          </div>
        ) : (
          <NoticiaCarousel
            noticias={noticiasDestaque}
            onSelect={setSelectedNoticia}
            label="Notícias em destaque"
          />
        )}
      </section>

      {/* Sobre Section */}
      <div className="bg-white border-y border-slate-200/80 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-800">Sobre o Observatório</h2>
          <div className="mx-auto my-3 h-1 w-16 rounded-full bg-[#359830]" aria-hidden="true" />
          <div className="space-y-4 text-base sm:text-lg text-slate-600 leading-relaxed text-justify md:text-center">
            <p>
              O Observatório tem como principais objetivos o monitoramento em rede da atividade turística na região, o incentivo à inovação, à inteligência de mercado e o fomento à pesquisa acadêmica em turismo. Isso é realizado através do levantamento contínuo de dados, formulação de indicadores e análises socioeconômicas para o desenvolvimento sustentável de Minas Gerais.
            </p>
            <p>
              O Observatório também conta com o Programa de Capacitação Regional, voltado para a qualificação dos profissionais do setor e o fortalecimento das Instâncias de Governança Regional (IGRs).
            </p>
          </div>
        </div>
      </div>

      {/* Cards Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-[#359830]/40 transition-all group">
            <div className="w-14 h-14 bg-[#EAF4E9] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#359830]/20 transition-colors">
              <BarChart3 className="h-7 w-7 text-[#359830]" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-3">
              Visão Geral
            </h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Acesse o dashboard principal com as métricas mais importantes e a evolução socioeconômica do setor.
            </p>
            <Link 
              href="/dashboard"
              className="text-[#359830] font-bold text-sm flex items-center gap-2 hover:text-[#1D5C1B]"
            >
              Acessar Dashboard &rarr;
            </Link>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-[#359830]/40 transition-all group">
            <div className="w-14 h-14 bg-[#EAF4E9] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#359830]/20 transition-colors">
              <Map className="h-7 w-7 text-[#359830]" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-3">
              Municípios & IGRs
            </h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Consulte dados municipais e conheça a governança regional dos circuitos turísticos.
            </p>
            <Link 
              href="/cidades"
              className="text-[#359830] font-bold text-sm flex items-center gap-2 hover:text-[#1D5C1B]"
            >
              Explorar Cidades &rarr;
            </Link>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-[#359830]/40 transition-all group">
            <div className="w-14 h-14 bg-[#EAF4E9] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#359830]/20 transition-colors">
              <FileText className="h-7 w-7 text-[#359830]" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-3">
              Relatórios & Notícias
            </h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Acesse estudos detalhados, comunicados e matérias jornalísticas sobre os destinos mineiros.
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

      {/* Modal de Leitura Completa */}
      <NoticiaModal
        noticia={selectedNoticia}
        onClose={() => setSelectedNoticia(null)}
      />
    </div>
  );
}
