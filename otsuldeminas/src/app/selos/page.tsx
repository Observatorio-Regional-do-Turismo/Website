"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, Building2, RefreshCw, AlertCircle, Target, Eye, HeartHandshake, Layers, Newspaper, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { IGRCard } from "@/components/IGRCard";
import { IGRDetalhesModal } from "@/components/IGRDetalhesModal";
import { NoticiaCard } from "@/components/NoticiaCard";
import { NoticiaModal } from "@/components/NoticiaModal";
import { fetchNoticias, getNoticiasPorIGR } from "@/data/noticiasFallback";
import axios from "axios";

function SelosContent() {
  const [igrs, setIgrs] = useState<ApiIGR[] | undefined | null>(undefined);
  const [cidades, setCidades] = useState<ApiCidade[]>([]);
  const [noticias, setNoticias] = useState<ApiNoticia[]>([]);
  const [selectedNoticia, setSelectedNoticia] = useState<ApiNoticia | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const [selectedIgr, setSelectedIgr] = useState<ApiIGR | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      const url = process.env.NEXT_PUBLIC_API_URL;

      // Buscar notícias em paralelo
      fetchNoticias().then((noticiasData) => {
        if (isMounted) setNoticias(noticiasData);
      });

      if (!url) {
        if (isMounted) {
          setIgrs(null);
          setLoading(false);
        }
        return;
      }

      const cleanUrl = url.trim().replace(/\/$/, "");

      try {
        // Buscar IGRs e Cidades em paralelo
        const [igrsRes, cidadesRes] = await Promise.all([
          axios.get<ApiPagination<ApiIGR> | ApiIGR[]>(`${cleanUrl}/igrs/`, { timeout: 12000 })
            .catch(() => axios.get<ApiPagination<ApiIGR> | ApiIGR[]>(`${cleanUrl}/igr/`, { timeout: 8000 }))
            .catch(() => null),
          axios.get<ApiPagination<ApiCidade> | ApiCidade[]>(`${cleanUrl}/cidades/`, { timeout: 12000 })
            .catch(() => null)
        ]);

        if (isMounted) {
          // Processar IGRs
          if (igrsRes && igrsRes.data) {
            if (Array.isArray(igrsRes.data)) {
              setIgrs(igrsRes.data);
            } else if (Array.isArray((igrsRes.data as ApiPagination<ApiIGR>).results)) {
              setIgrs((igrsRes.data as ApiPagination<ApiIGR>).results);
            } else {
              setIgrs([]);
            }
          } else {
            setIgrs(null);
          }

          // Processar Cidades
          if (cidadesRes && cidadesRes.data) {
            if (Array.isArray(cidadesRes.data)) {
              setCidades(cidadesRes.data);
            } else if (Array.isArray((cidadesRes.data as ApiPagination<ApiCidade>).results)) {
              setCidades((cidadesRes.data as ApiPagination<ApiCidade>).results);
            }
          }

          setLoading(false);
        }
      } catch (error) {
        console.warn("Erro ao buscar IGRs da API externa:", error);
        if (isMounted) {
          setIgrs(null);
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredIgrs = useMemo(() => {
    if (igrs === undefined) return undefined;
    if (igrs === null) return null;

    const normalizeText = (text: string) =>
      text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    let result = [...igrs].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    if (searchTerm.trim()) {
      const lowerQuery = normalizeText(searchTerm.trim());
      result = result.filter(
        (i) =>
          normalizeText(i.name).includes(lowerQuery) ||
          (i.description && normalizeText(i.description).includes(lowerQuery))
      );
    }
    return result;
  }, [searchTerm, igrs]);

  // Contagem de notícias por IGR
  const noticiasPorIGRCount = useMemo(() => {
    const map = new Map<string, number>();
    if (!igrs || !noticias) return map;
    igrs.forEach((i) => {
      const list = getNoticiasPorIGR(i.name, noticias);
      map.set(String(i.id || i.name), list.total);
    });
    return map;
  }, [igrs, noticias]);

  // Notícias relacionadas às IGRs e circuitos
  const noticiasIGRs = useMemo(() => {
    return noticias.filter(n => n.igr_name || n.igr);
  }, [noticias]);

  const noticiasIGRsDestaque = useMemo(() => {
    return noticiasIGRs
      .filter(n => n.is_featured)
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  }, [noticiasIGRs]);

  const noticiasIGRsComuns = useMemo(() => {
    return noticiasIGRs
      .filter(n => !n.is_featured)
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  }, [noticiasIGRs]);

  const handleSelectIgr = (igr: ApiIGR) => {
    setSelectedIgr(igr);
    const newUrl = `/selos?igr=${encodeURIComponent(igr.slug || igr.name)}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  useEffect(() => {
    const igrParam = searchParams.get("igr");
    if (igrParam && igrs && igrs.length > 0) {
      const match = igrs.find(
        (i) =>
          (i.slug && i.slug.toLowerCase() === igrParam.toLowerCase()) ||
          i.name.toLowerCase() === igrParam.toLowerCase()
      );
      if (match) {
        setSelectedIgr(match);
      }
    }
  }, [searchParams, igrs]);

  const handleCloseModal = () => {
    setSelectedIgr(null);
    window.history.pushState({ path: "/selos" }, "", "/selos");
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      {/* Hero padrão com a imagem de fundo enviada */}
      <Header
        imageSrc="/images/selos-hero.jpg"
        imageAlt="Paisagem panorâmica do Sul de Minas Gerais"
      />

      {/* Barra de Busca e Filtro */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar IGR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830] transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                title="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {filteredIgrs && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {filteredIgrs.length} {filteredIgrs.length === 1 ? "IGR" : "IGRs"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1 space-y-14">
        
        {/* ========================================================================= */}
        {/* SEÇÃO 1: INTRODUÇÃO E PROPÓSITO */}
        {/* ========================================================================= */}
        <div>
          <div className="mb-8 border-b border-slate-200 pb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <Layers className="h-3.5 w-3.5" />
              Regionalização & Governança Turística
            </div>
            <h1 className="text-3xl font-extrabold text-[#1D5C1B] tracking-tight">
              IGRs (Instâncias de Governança Regional)
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Conheça as entidades que coordenam o desenvolvimento turístico integrado, a certificação no Mapa do Turismo Brasileiro e a articulação regional do Sul de Minas Gerais.
            </p>
          </div>

          {/* O que é a IGR */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-3">
              O que é a IGR?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-4xl">
              A <strong>IGR (Instância de Governança Regional)</strong> é uma organização colegiada, instituída no âmbito do Programa de Regionalização do Turismo (PRT) e reconhecida pela Secretaria de Estado de Cultura e Turismo de Minas Gerais (SECULT). Composta por representantes do poder público municipal, setor privado e entidades da sociedade civil, sua missão é planejar, coordenar e implementar políticas públicas de turismo, promovendo o desenvolvimento sustentável e fortalecendo a identidade regional.
            </p>
          </div>

          {/* Missão, Visão e Valores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Missão</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Articular os atores regionais para estruturar e qualificar a oferta turística, promovendo os destinos de forma cooperativa e gerando oportunidades socioeconômicas para as comunidades locais.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 text-xs font-bold text-primary uppercase tracking-wide">
                Foco no Desenvolvimento Local
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#359830]/10 text-[#359830] flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Visão</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Consolidar os destinos e municípios do Sul de Minas Gerais como referências turísticas sustentáveis, competitivas, inovadoras e reconhecidas nacional e internacionalmente.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 text-xs font-bold text-[#359830] uppercase tracking-wide">
                Referência em Turismo
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#C90C0F]/10 text-[#C90C0F] flex items-center justify-center mb-4">
                  <HeartHandshake className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Valores</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Gestão participativa, sustentabilidade socioambiental, preservação do patrimônio histórico e natural, hospitalidade e transparência nas ações.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 text-xs font-bold text-[#C90C0F] uppercase tracking-wide">
                Governança & Hospitalidade
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SEÇÃO: NOTÍCIAS DAS IGRs & CIRCUITOS TURÍSTICOS (ANTES DAS IGRs) */}
        {/* ========================================================================= */}
        {noticiasIGRs.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF4E9] text-[#1D5C1B] text-[11px] font-bold uppercase tracking-wider mb-1.5 border border-[#5BAF56]/30">
                  <Newspaper className="h-3 w-3 text-[#359830]" />
                  Ações Regionais & Circuitos
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                  Notícias das IGRs & Governança Regional
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Articulação regional, projetos integrados e novidades dos circuitos turísticos e municípios consorciados.
                </p>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
                {noticiasIGRs.length} {noticiasIGRs.length === 1 ? "publicação" : "publicações"}
              </span>
            </div>

            {/* Destaques Regionais */}
            {noticiasIGRsDestaque.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C90C0F]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#C90C0F] flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> Destaques das IGRs
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {noticiasIGRsDestaque.map((noticia) => (
                    <NoticiaCard
                      key={noticia.id}
                      noticia={noticia}
                      variant="small"
                      onClick={setSelectedNoticia}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Notícias Comuns das IGRs */}
            {noticiasIGRsComuns.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#359830]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D5C1B]">
                    Mais Notícias das IGRs (Mais Recentes)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {noticiasIGRsComuns.map((noticia) => (
                    <NoticiaCard
                      key={noticia.id}
                      noticia={noticia}
                      variant="small"
                      onClick={setSelectedNoticia}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CARDS DAS IGRs */}
        {/* ========================================================================= */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                IGRs Cadastradas
              </h2>
              <p className="text-sm text-slate-500">
                Selecione uma IGR para visualizar seus detalhes, notícias e municípios consorciados
              </p>
            </div>
          </div>

          {loading || filteredIgrs === undefined ? (
            <div className="flex flex-col items-center justify-center py-28 gap-3">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <span className="text-sm font-semibold text-slate-600">Carregando IGRs...</span>
            </div>
          ) : filteredIgrs === null ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-8 shadow-sm">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-500">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Erro ao carregar IGRs</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                Não foi possível obter a lista de IGRs no momento.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md"
              >
                Tentar novamente
              </button>
            </div>
          ) : filteredIgrs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-8 shadow-sm">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                <Building2 className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhuma IGR encontrada</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                Não encontramos resultados correspondentes a &quot;{searchTerm}&quot;.
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Ver todas as IGRs
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredIgrs.map((igr) => (
                <IGRCard
                  key={igr.id || igr.slug || igr.name}
                  igr={igr}
                  noticiasCount={noticiasPorIGRCount.get(String(igr.id || igr.name)) || 0}
                  onSelect={handleSelectIgr}
                />
              ))}
            </div>
          )}
        </div>

      </section>

      {/* Modal de Detalhes da IGR */}
      {selectedIgr && (
        <IGRDetalhesModal
          igr={selectedIgr}
          cidades={cidades}
          allNoticias={noticias}
          onClose={handleCloseModal}
        />
      )}

      {/* Modal de Leitura Completa da Notícia */}
      <NoticiaModal
        noticia={selectedNoticia}
        onClose={() => setSelectedNoticia(null)}
      />
    </main>
  );
}

export default function SelosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <SelosContent />
    </Suspense>
  );
}
