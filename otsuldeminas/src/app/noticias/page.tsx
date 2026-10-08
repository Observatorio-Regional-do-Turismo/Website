"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { 
  Search, 
  X, 
  Newspaper, 
  Sparkles, 
  Building2, 
  Layers, 
  RefreshCw 
} from "lucide-react";
import { Header } from "@/components/Header";
import { NoticiaCarousel } from "@/components/NoticiaCarousel";
import { NoticiaCard } from "@/components/NoticiaCard";
import { NoticiaModal } from "@/components/NoticiaModal";
import { fetchNoticias } from "@/lib/noticias-api";

function NoticiasContent() {
  const [noticias, setNoticias] = useState<ApiNoticia[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [selectedNoticia, setSelectedNoticia] = useState<ApiNoticia | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchNoticias();
        if (isMounted) {
          setNoticias(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Erro ao carregar notícias:", err);
        if (isMounted) {
          setNoticias([]);
          setLoadError(true);
          setLoading(false);
        }
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  // Extrair categorias e tags únicas
  const categories = useMemo(() => {
    if (!noticias) return [];
    const set = new Set<string>();
    noticias.forEach(n => {
      if (n.category) set.add(n.category);
    });
    return Array.from(set);
  }, [noticias]);

  // Filtragem
  const filteredNoticias = useMemo(() => {
    if (!noticias) return [];

    const norm = (str?: string | null) => 
      (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    const query = norm(searchTerm);

    return noticias.filter(n => {
      // Filtro de categoria
      if (selectedCategory === "destaque" && !n.is_featured) return false;
      if (selectedCategory === "cidades" && !n.cidade_name && !n.cidade) return false;
      if (selectedCategory === "igrs" && !n.igr_name && !n.igr) return false;
      if (selectedCategory !== "todas" && selectedCategory !== "destaque" && selectedCategory !== "cidades" && selectedCategory !== "igrs") {
        if (norm(n.category) !== norm(selectedCategory)) return false;
      }

      // Filtro de busca textual
      if (query) {
        const matchTitle = norm(n.title).includes(query);
        const matchSummary = norm(n.summary).includes(query);
        const matchCity = norm(n.cidade_name).includes(query);
        const matchIgr = norm(n.igr_name).includes(query);
        const matchTags = n.tags?.some(t => norm(t).includes(query));
        return matchTitle || matchSummary || matchCity || matchIgr || matchTags;
      }

      return true;
    }).sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  }, [noticias, searchTerm, selectedCategory]);
  const noticiasDestaque = useMemo(
    () => noticias?.filter((noticia) => noticia.is_featured) ?? [],
    [noticias]
  );
  const hasNoticias = (noticias?.length ?? 0) > 0;

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      {/* Hero padrão com a descrição idêntica às demais páginas */}
      <Header
        imageSrc="/images/sul_de_minas_bg.jpg"
        imageAlt="Paisagem panorâmica do Sul de Minas Gerais"
      />

      {/* Barra de Busca e Filtros Rápidos */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
          
          {/* Input de Busca */}
          <div className="relative w-full xl:flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar notícia por título, município, IGR ou tema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830] transition-all shadow-inner"
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

          {/* Filtros em Pílulas */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 scrollbar-none text-xs font-semibold">
            <button
              onClick={() => setSelectedCategory("todas")}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 cursor-pointer ${
                selectedCategory === "todas"
                  ? "bg-[#1D5C1B] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setSelectedCategory("destaque")}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                selectedCategory === "destaque"
                  ? "bg-[#C90C0F] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Sparkles className="h-3 w-3" />
              Destaques
            </button>
            <button
              onClick={() => setSelectedCategory("cidades")}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                selectedCategory === "cidades"
                  ? "bg-[#359830] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Building2 className="h-3 w-3" />
              Municípios
            </button>
            <button
              onClick={() => setSelectedCategory("igrs")}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                selectedCategory === "igrs"
                  ? "bg-[#359830] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Layers className="h-3 w-3" />
              IGRs
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#1D5C1B] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Conteúdo Principal */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1 space-y-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3">
            <RefreshCw className="h-8 w-8 text-[#359830] animate-spin" />
            <span className="text-sm font-semibold text-slate-600">Carregando notícias e matérias...</span>
          </div>
        ) : loadError ? (
          <div className="bg-amber-50 rounded-3xl border border-amber-200 p-12 text-center my-8 text-amber-900">
            <h3 className="text-lg font-bold mb-2">Não foi possível carregar as notícias</h3>
            <p className="text-sm">Verifique a conexão com a API e tente novamente mais tarde.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {noticiasDestaque.length > 0 && (
              <section aria-labelledby="noticias-destaque-title" className="space-y-5">
                <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <h2 id="noticias-destaque-title" className="flex items-center gap-2 text-lg font-extrabold uppercase tracking-wider text-[#C90C0F] sm:text-xl">
                      <Sparkles className="h-5 w-5" />
                      Notícias em destaque
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">Destaques recentes do Sul de Minas.</p>
                  </div>
                </div>
                <NoticiaCarousel
                  noticias={noticiasDestaque}
                  onSelect={setSelectedNoticia}
                  label="Notícias em destaque"
                />
              </section>
            )}

            <section aria-labelledby="todas-noticias-title" className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 id="todas-noticias-title" className="text-lg font-extrabold uppercase tracking-wider text-[#1D5C1B] sm:text-xl">
                  {searchTerm || selectedCategory !== "todas" ? "Resultados da busca" : "Todas as notícias"}
                </h2>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {filteredNoticias.length} {filteredNoticias.length === 1 ? "notícia" : "notícias"}
                </span>
              </div>
              {filteredNoticias.length > 0 ? (
                <div className="space-y-3">
                  {filteredNoticias.map((noticia) => (
                    <NoticiaCard
                      key={noticia.id}
                      noticia={noticia}
                      variant="compact"
                      onClick={setSelectedNoticia}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                  <Newspaper className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                  <h3 className="mb-1 font-bold text-slate-800">
                    {hasNoticias ? "Nenhuma notícia encontrada" : "Nenhuma notícia publicada"}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {hasNoticias
                      ? "Tente alterar a busca ou os filtros."
                      : "Ainda não há notícias cadastradas."}
                  </p>
                  {hasNoticias && (
                    <button
                      type="button"
                      onClick={() => { setSearchTerm(""); setSelectedCategory("todas"); }}
                      className="mt-4 rounded-xl bg-[#359830] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1D5C1B]"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

      </section>

      {/* Modal de Leitura Completa da Notícia */}
      <NoticiaModal
        noticia={selectedNoticia}
        onClose={() => setSelectedNoticia(null)}
      />
    </main>
  );
}

export default function NoticiasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <NoticiasContent />
    </Suspense>
  );
}
