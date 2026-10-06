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
import { NoticiaCard } from "@/components/NoticiaCard";
import { NoticiaModal } from "@/components/NoticiaModal";
import { fetchNoticias, getNoticiasDestaque } from "@/data/noticiasFallback";

function NoticiasContent() {
  const [noticias, setNoticias] = useState<ApiNoticia[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [selectedNoticia, setSelectedNoticia] = useState<ApiNoticia | null>(null);

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
        console.warn("Erro ao carregar notícias:", err);
        if (isMounted) {
          setNoticias([]);
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

  // Notícias em destaque gerais
  const noticiasDestaqueGerais = useMemo(() => {
    if (!noticias) return [];
    return getNoticiasDestaque(noticias);
  }, [noticias]);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      {/* Hero padrão com a descrição idêntica às demais páginas */}
      <Header
        imageSrc="/images/sul_de_minas_bg.jpg"
        imageAlt="Paisagem panorâmica do Sul de Minas Gerais"
      />

      {/* Barra de Busca e Filtros Rápidos */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Input de Busca */}
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar notícia por título, município, IGR ou tema..."
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

          {/* Filtros em Pílulas */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs font-semibold">
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
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1 space-y-12">
        
        {loading || noticias === null ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3">
            <RefreshCw className="h-8 w-8 text-[#359830] animate-spin" />
            <span className="text-sm font-semibold text-slate-600">Carregando notícias e matérias...</span>
          </div>
        ) : filteredNoticias.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-8 shadow-sm">
            <div className="w-14 h-14 bg-[#EAF4E9] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#359830]">
              <Newspaper className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhuma notícia encontrada</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              Não encontramos resultados correspondentes a &quot;{searchTerm}&quot; nesta categoria.
            </p>
            <button
              onClick={() => { setSearchTerm(""); setSelectedCategory("todas"); }}
              className="px-5 py-2.5 bg-[#359830] text-white text-sm font-bold rounded-xl hover:bg-[#1D5C1B] transition-colors shadow-md"
            >
              Ver todas as notícias
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            
            {/* Seção de Destaques quando o filtro for 'todas' e não houver busca ativa */}
            {selectedCategory === "todas" && !searchTerm && noticiasDestaqueGerais.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C90C0F]" />
                  <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-wider text-[#C90C0F] flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Principais Destaques
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {noticiasDestaqueGerais.map((noticia) => (
                    <NoticiaCard
                      key={noticia.id}
                      noticia={noticia}
                      onClick={setSelectedNoticia}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Grid Principal com as Notícias Filtradas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#359830]" />
                  <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-wider text-[#1D5C1B]">
                    {selectedCategory === "todas" && !searchTerm ? "Todas as Publicações" : "Resultados da Busca"}
                  </h2>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {filteredNoticias.length} {filteredNoticias.length === 1 ? "notícia" : "notícias"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredNoticias.map((noticia) => (
                  <NoticiaCard
                    key={noticia.id}
                    noticia={noticia}
                    onClick={setSelectedNoticia}
                  />
                ))}
              </div>
            </div>

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
