"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, Layers, Newspaper, Search, Sparkles, X } from "lucide-react";
import { FilterBar } from "@/components/FilterBar";
import { NoticiaCard } from "@/components/NoticiaCard";
import { NoticiaCarousel } from "@/components/NoticiaCarousel";
import { NoticiaModal } from "@/components/NoticiaModal";
import { normalizeText } from "@/lib/utils";

interface NoticiasClientProps {
  initialNoticias: ApiNoticia[];
}

export function NoticiasClient({ initialNoticias }: NoticiasClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [selectedNoticia, setSelectedNoticia] = useState<ApiNoticia | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const idParam = searchParams.get("id") || searchParams.get("noticia");
    if (!idParam || initialNoticias.length === 0) return;
    const match = initialNoticias.find(
      (n) => String(n.id) === idParam || (n.slug && n.slug.toLowerCase() === idParam.toLowerCase()),
    );
    if (match) {
      setSelectedNoticia(match);
    }
  }, [searchParams, initialNoticias]);

  const handleSelectNoticia = (noticia: ApiNoticia) => {
    setSelectedNoticia(noticia);
    const newUrl = `/noticias?id=${encodeURIComponent(String(noticia.id))}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  const handleCloseNoticia = () => {
    setSelectedNoticia(null);
    window.history.pushState({ path: "/noticias" }, "", "/noticias");
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    initialNoticias.forEach((n) => {
      if (n.category) set.add(n.category);
    });
    return Array.from(set);
  }, [initialNoticias]);

  const filteredNoticias = useMemo(() => {
    const query = normalizeText(searchTerm);

    return initialNoticias
      .filter((n) => {
        if (selectedCategory === "destaque" && !n.is_featured) return false;
        if (selectedCategory === "cidades" && !n.cidade_name && !n.cidade) return false;
        if (selectedCategory === "igrs" && !n.igr_name && !n.igr) return false;
        if (
          selectedCategory !== "todas" &&
          selectedCategory !== "destaque" &&
          selectedCategory !== "cidades" &&
          selectedCategory !== "igrs"
        ) {
          if (normalizeText(n.category) !== normalizeText(selectedCategory)) return false;
        }

        if (query) {
          const matchTitle = normalizeText(n.title).includes(query);
          const matchSummary = normalizeText(n.summary).includes(query);
          const matchCity = normalizeText(n.cidade_name).includes(query);
          const matchIgr = normalizeText(n.igr_name).includes(query);
          const matchTags = n.tags?.some((t) => normalizeText(t).includes(query));
          return matchTitle || matchSummary || matchCity || matchIgr || matchTags;
        }

        return true;
      })
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  }, [initialNoticias, searchTerm, selectedCategory]);

  const noticiasDestaque = useMemo(
    () => initialNoticias.filter((noticia) => noticia.is_featured),
    [initialNoticias],
  );

  return (
    <>
      <FilterBar containerClassName="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        <div className="relative w-full xl:flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            aria-label="Buscar notícia"
            placeholder="Buscar notícia por título, município, IGR ou tema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830] transition-all shadow-inner"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              title="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 text-xs font-semibold">
          <button
            type="button"
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
            type="button"
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
            type="button"
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
            type="button"
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
              type="button"
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
      </FilterBar>

      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1 space-y-10">
        {noticiasDestaque.length > 0 && (
          <section aria-labelledby="noticias-destaque-title" className="space-y-5">
            <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h2
                  id="noticias-destaque-title"
                  className="flex items-center gap-2 text-lg font-extrabold uppercase tracking-wider text-[#C90C0F] sm:text-xl"
                >
                  <Sparkles className="h-5 w-5" />
                  Notícias em destaque
                </h2>
                <p className="mt-1 text-sm text-slate-500">Destaques recentes da região.</p>
              </div>
            </div>
            <NoticiaCarousel
              noticias={noticiasDestaque}
              onSelect={handleSelectNoticia}
              label="Notícias em destaque"
            />
          </section>
        )}

        <section aria-labelledby="todas-noticias-title" className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2
              id="todas-noticias-title"
              className="text-lg font-extrabold uppercase tracking-wider text-[#1D5C1B] sm:text-xl"
            >
              {searchTerm || selectedCategory !== "todas"
                ? "Resultados da busca"
                : "Todas as notícias"}
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
                  onClick={handleSelectNoticia}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <Newspaper className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              <h3 className="mb-1 font-bold text-slate-800">
                {initialNoticias.length > 0
                  ? "Nenhuma notícia encontrada"
                  : "Nenhuma notícia publicada"}
              </h3>
              <p className="text-sm text-slate-600">
                {initialNoticias.length > 0
                  ? "Tente alterar a busca ou os filtros."
                  : "Ainda não há notícias cadastradas."}
              </p>
              {initialNoticias.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("todas");
                  }}
                  className="mt-4 rounded-xl bg-[#359830] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1D5C1B]"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </section>
      </section>

      <NoticiaModal noticia={selectedNoticia} onClose={handleCloseNoticia} />
    </>
  );
}
