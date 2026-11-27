"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Compass, Map as MapIcon, Search, Sparkles, UtensilsCrossed, X } from "lucide-react";
import { AtrativoCard } from "@/components/AtrativoCard";
import { AtrativoModal } from "@/components/AtrativoModal";
import { EstabelecimentoCard } from "@/components/EstabelecimentoCard";
import { FilterBar } from "@/components/FilterBar";
import { StandardCardGridSkeleton } from "@/components/LoadingSkeletons";
import { PaginationControls } from "@/components/PaginationControls";
import { fetchPaginatedPage, PaginatedResult } from "@/lib/website-api";

const PAGE_SIZE = 20;
const MAX_FEATURED = 10;

const InteractiveMap = dynamic(
  () => import("@/components/InteractiveMap").then((mod) => mod.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[460px] w-full rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-medium text-slate-500">
        Carregando mapa de atrativos...
      </div>
    ),
  },
);

type SortMode = "featured" | "popularity" | "name";
type ScopeView = "all" | "atrativos" | "locais";

interface AtrativosClientProps {
  initialAtrativosPage: PaginatedResult<ApiPontoTuristico>;
  initialDestaques: ApiPontoTuristico[];
  initialLocaisPage: PaginatedResult<ApiEstabelecimentoGeo>;
  initialCidades: ApiCidade[];
  initialIgrs: ApiIGR[];
}

export function AtrativosClient({
  initialAtrativosPage,
  initialDestaques,
  initialLocaisPage,
  initialCidades,
  initialIgrs,
}: AtrativosClientProps) {
  const searchParams = useSearchParams();
  const [atrativosData, setAtrativosData] =
    useState<PaginatedResult<ApiPontoTuristico>>(initialAtrativosPage);
  const [locaisData, setLocaisData] =
    useState<PaginatedResult<ApiEstabelecimentoGeo>>(initialLocaisPage);
  const [loadingAtrativos, setLoadingAtrativos] = useState(false);
  const [loadingLocais, setLoadingLocais] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [cidadeId, setCidadeId] = useState("");
  const [igrId, setIgrId] = useState("");
  const [category, setCategory] = useState("");
  const [scopeView, setScopeView] = useState<ScopeView>("all");
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("featured");
  const [atrativosPage, setAtrativosPage] = useState(initialAtrativosPage.page || 1);
  const [locaisPage, setLocaisPage] = useState(initialLocaisPage.page || 1);
  const [showMap, setShowMap] = useState(false);
  const [selectedAtrativo, setSelectedAtrativo] = useState<ApiPontoTuristico | null>(null);
  const isFirstAtrativos = useRef(true);
  const isFirstLocais = useRef(true);

  const orderingValue = useMemo(() => {
    if (sortMode === "name") return "name";
    if (sortMode === "popularity") return "-popularity,name";
    return "-is_featured,-popularity,name";
  }, [sortMode]);

  const loadAtrativos = useCallback(async () => {
    if (scopeView === "locais") return;
    setLoadingAtrativos(true);
    try {
      const res = await fetchPaginatedPage<ApiPontoTuristico>("pontos-turisticos/", {
        page: atrativosPage,
        page_size: PAGE_SIZE,
        ordering: orderingValue,
        search: searchTerm.trim() || undefined,
        cidade: cidadeId || undefined,
        igr: igrId || undefined,
        category: category || undefined,
        is_featured: onlyFeatured ? true : undefined,
      });
      setAtrativosData(res);
    } catch {
      // Mantém estado atual
    } finally {
      setLoadingAtrativos(false);
    }
  }, [
    scopeView,
    atrativosPage,
    orderingValue,
    searchTerm,
    cidadeId,
    igrId,
    category,
    onlyFeatured,
  ]);

  const loadLocais = useCallback(async () => {
    if (scopeView === "atrativos" || onlyFeatured) return;
    setLoadingLocais(true);
    try {
      const res = await fetchPaginatedPage<ApiEstabelecimentoGeo>("locais/", {
        page: locaisPage,
        page_size: PAGE_SIZE,
        ordering: "nome",
        search: searchTerm.trim() || undefined,
        cidade: cidadeId || undefined,
        igr: igrId || undefined,
        categoria: category || undefined,
      });
      setLocaisData(res);
    } catch {
      // Mantém estado atual
    } finally {
      setLoadingLocais(false);
    }
  }, [scopeView, onlyFeatured, locaisPage, searchTerm, cidadeId, igrId, category]);

  useEffect(() => {
    if (isFirstAtrativos.current) {
      isFirstAtrativos.current = false;
      return;
    }
    const timer = window.setTimeout(loadAtrativos, 220);
    return () => window.clearTimeout(timer);
  }, [loadAtrativos]);

  useEffect(() => {
    if (isFirstLocais.current) {
      isFirstLocais.current = false;
      return;
    }
    const timer = window.setTimeout(loadLocais, 220);
    return () => window.clearTimeout(timer);
  }, [loadLocais]);

  useEffect(() => {
    const idParam = searchParams.get("id") || searchParams.get("atrativo");
    if (!idParam) return;
    const pool = [...atrativosData.results, ...initialDestaques];
    const match = pool.find(
      (item) =>
        String(item.id) === idParam ||
        (item.slug && item.slug.toLowerCase() === idParam.toLowerCase()),
    );
    if (match) {
      setSelectedAtrativo(match);
    }
  }, [searchParams, atrativosData.results, initialDestaques]);

  const handleSelectAtrativo = (atrativo: ApiPontoTuristico) => {
    setSelectedAtrativo(atrativo);
    const newUrl = `/atrativos?id=${encodeURIComponent(String(atrativo.id))}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  const handleCloseModal = () => {
    setSelectedAtrativo(null);
    window.history.pushState({ path: "/atrativos" }, "", "/atrativos");
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    [...initialAtrativosPage.results, ...initialDestaques].forEach((item) => {
      if (item.category?.trim()) set.add(item.category.trim());
    });
    initialLocaisPage.results.forEach((loc) => {
      if (loc.categoria?.trim()) set.add(loc.categoria.trim());
    });
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [initialAtrativosPage.results, initialDestaques, initialLocaisPage.results]);

  const featuredAtrativos = useMemo(
    () => initialDestaques.slice(0, MAX_FEATURED),
    [initialDestaques],
  );

  const mapCities: ApiMapaCidade[] = useMemo(() => {
    return initialCidades
      .filter((c) => !cidadeId || String(c.id) === cidadeId)
      .map((c) => ({
        id: Number(c.id),
        name: c.name,
        slug: c.slug,
        ibge_code: c.ibge_code,
        state_name: c.state_name,
        igr_name: c.igr_name,
        latitude: c.latitude !== null && c.latitude !== undefined ? Number(c.latitude) : null,
        longitude: c.longitude !== null && c.longitude !== undefined ? Number(c.longitude) : null,
        pontos_count: atrativosData.results.filter((p) => String(p.cidade) === String(c.id)).length,
        eventos_count: 0,
      }));
  }, [initialCidades, atrativosData.results, cidadeId]);

  const hasActiveFilters = Boolean(
    searchTerm || cidadeId || igrId || category || onlyFeatured || scopeView !== "all",
  );

  const resetPages = () => {
    setAtrativosPage(1);
    setLocaisPage(1);
  };

  return (
    <>
      <FilterBar containerClassName="flex flex-col gap-3">
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative w-full lg:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              aria-label="Buscar atrativo, restaurante ou serviço"
              placeholder="Buscar atrativo, restaurante, hotel ou cidade..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                resetPages();
              }}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830] transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  resetPages();
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                title="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <select
            aria-label="Filtrar por município"
            value={cidadeId}
            onChange={(e) => {
              setCidadeId(e.target.value);
              resetPages();
            }}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830]"
          >
            <option value="">Todos os municípios</option>
            {initialCidades.map((cidade) => (
              <option key={cidade.id} value={String(cidade.id)}>
                {cidade.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por IGR"
            value={igrId}
            onChange={(e) => {
              setIgrId(e.target.value);
              resetPages();
            }}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830]"
          >
            <option value="">Todas as IGRs</option>
            {initialIgrs.map((igr) => (
              <option key={igr.id} value={String(igr.id)}>
                {igr.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por categoria"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              resetPages();
            }}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830]"
          >
            <option value="">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            aria-label="Ordenar atrativos"
            value={sortMode}
            onChange={(e) => {
              setSortMode(e.target.value as SortMode);
              setAtrativosPage(1);
            }}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830]"
          >
            <option value="featured">Destaques primeiro</option>
            <option value="popularity">Mais populares</option>
            <option value="name">Ordem alfabética (A–Z)</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "all", label: "Tudo" },
                { id: "atrativos", label: "Atrativos Turísticos" },
                { id: "locais", label: "Restaurantes & Serviços" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setScopeView(opt.id);
                  resetPages();
                }}
                className={`px-3 py-1.5 rounded-full font-semibold transition-colors cursor-pointer ${
                  scopeView === opt.id
                    ? "bg-[#1D5C1B] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setOnlyFeatured((prev) => !prev);
                resetPages();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-colors cursor-pointer ${
                onlyFeatured
                  ? "bg-amber-400 text-slate-950 shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Principais atrativos
            </button>

            <button
              type="button"
              onClick={() => setShowMap((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-colors cursor-pointer ${
                showMap
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-emerald-50 text-[#1D5C1B] border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              {showMap ? "Ocultar mapa" : "Mostrar no mapa"}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setCidadeId("");
                  setIgrId("");
                  setCategory("");
                  setScopeView("all");
                  setOnlyFeatured(false);
                  resetPages();
                }}
                className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold transition-colors cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
          </div>

          <span className="font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {scopeView !== "locais" ? `${atrativosData.count} atrativos` : "0 atrativos"} ·{" "}
            {scopeView !== "atrativos" && !onlyFeatured
              ? `${locaisData.count} restaurantes/serviços`
              : "0 restaurantes/serviços"}
          </span>
        </div>
      </FilterBar>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1 space-y-12">
        {showMap && (
          <section className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-[#1D5C1B]" />
                Mapa de Atrativos, Restaurantes e Serviços
              </h2>
              <Link href="/mapa" className="text-xs font-bold text-[#1D5C1B] hover:underline">
                Abrir página completa do mapa →
              </Link>
            </div>
            <InteractiveMap
              cidades={mapCities}
              pontos={scopeView === "locais" ? [] : atrativosData.results}
              eventos={[]}
              estabelecimentos={scopeView === "atrativos" || onlyFeatured ? [] : locaisData.results}
              layers={{
                cidades: true,
                pontos: scopeView !== "locais",
                estabelecimentos: scopeView !== "atrativos",
                eventos: false,
              }}
              alwaysShowDetails
            />
          </section>
        )}

        {/* Principais Atrativos (Destaques — máximo 10) */}
        {featuredAtrativos.length > 0 && !hasActiveFilters && (
          <section aria-labelledby="principais-atrativos-heading" className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Curadoria Regional
                </span>
                <h2
                  id="principais-atrativos-heading"
                  className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5"
                >
                  Principais Atrativos
                </h2>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {featuredAtrativos.length} em destaque
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {featuredAtrativos.map((atrativo) => (
                <AtrativoCard
                  key={`featured-${atrativo.id}`}
                  atrativo={atrativo}
                  onSelect={handleSelectAtrativo}
                  featuredBadge
                />
              ))}
            </div>
          </section>
        )}

        {/* Catálogo de Atrativos Turísticos (máximo 20 por página) */}
        {scopeView !== "locais" && (
          <section aria-labelledby="catalogo-atrativos-heading" className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2
                id="catalogo-atrativos-heading"
                className="text-lg sm:text-xl font-extrabold uppercase tracking-wider text-[#1D5C1B] flex items-center gap-2"
              >
                <Compass className="h-5 w-5" />
                {hasActiveFilters ? "Atrativos encontrados" : "Todos os Atrativos Turísticos"}
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                {atrativosData.count} registros
              </span>
            </div>

            {loadingAtrativos ? (
              <StandardCardGridSkeleton count={8} />
            ) : atrativosData.results.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
                <Compass className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  Nenhum atrativo encontrado
                </h3>
                <p className="text-sm text-slate-600">
                  Tente ajustar a busca ou limpar os filtros aplicados.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {atrativosData.results.map((atrativo) => (
                    <AtrativoCard
                      key={atrativo.id}
                      atrativo={atrativo}
                      onSelect={handleSelectAtrativo}
                    />
                  ))}
                </div>

                <PaginationControls
                  currentPage={atrativosData.page}
                  totalPages={atrativosData.totalPages}
                  totalItems={atrativosData.count}
                  pageSize={PAGE_SIZE}
                  loading={loadingAtrativos}
                  itemLabel="atrativos"
                  onPageChange={(next) => {
                    setAtrativosPage(next);
                    if (typeof window !== "undefined") {
                      window.scrollTo({ top: 320, behavior: "smooth" });
                    }
                  }}
                />
              </>
            )}
          </section>
        )}

        {/* Restaurantes, Hospedagens & Serviços (máximo 20 por página) */}
        {scopeView !== "atrativos" && !onlyFeatured && (
          <section aria-labelledby="restaurantes-servicos-heading" className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h2
                  id="restaurantes-servicos-heading"
                  className="text-lg sm:text-xl font-extrabold uppercase tracking-wider text-orange-700 flex items-center gap-2"
                >
                  <UtensilsCrossed className="h-5 w-5" />
                  Restaurantes, Hospedagens & Serviços
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Estabelecimentos georreferenciados integrados ao mapa turístico regional.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {locaisData.count} estabelecimentos
              </span>
            </div>

            {loadingLocais ? (
              <StandardCardGridSkeleton count={8} />
            ) : locaisData.results.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                Nenhum restaurante ou serviço encontrado com os filtros selecionados.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {locaisData.results.map((local) => (
                    <EstabelecimentoCard key={local.id} local={local} />
                  ))}
                </div>

                <PaginationControls
                  currentPage={locaisData.page}
                  totalPages={locaisData.totalPages}
                  totalItems={locaisData.count}
                  pageSize={PAGE_SIZE}
                  loading={loadingLocais}
                  itemLabel="estabelecimentos"
                  onPageChange={(next) => setLocaisPage(next)}
                />
              </>
            )}
          </section>
        )}
      </div>

      <AtrativoModal atrativo={selectedAtrativo} onClose={handleCloseModal} />
    </>
  );
}
