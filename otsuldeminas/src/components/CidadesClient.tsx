"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapPin, Search, X } from "lucide-react";
import { CidadeCard } from "@/components/CidadeCard";
import { CidadeDetalhesModal } from "@/components/CidadeDetalhesModal";
import { FilterBar } from "@/components/FilterBar";
import { StandardCardGridSkeleton } from "@/components/LoadingSkeletons";
import { NoticiaModal } from "@/components/NoticiaModal";
import { PaginationControls } from "@/components/PaginationControls";
import { fetchPaginatedPage, PaginatedResult } from "@/lib/website-api";

const PAGE_SIZE = 20;

interface CidadesClientProps {
  initialPage: PaginatedResult<ApiCidade>;
  initialEstados: ApiEstado[];
  initialIgrs: ApiIGR[];
  initialNoticias: ApiNoticia[];
}

export function CidadesClient({
  initialPage,
  initialEstados,
  initialIgrs,
  initialNoticias,
}: CidadesClientProps) {
  const [pageData, setPageData] = useState<PaginatedResult<ApiCidade>>(initialPage);
  const [loadingPage, setLoadingPage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [ibgeCode, setIbgeCode] = useState("");
  const [estadoId, setEstadoId] = useState("");
  const [igrId, setIgrId] = useState("");
  const [ordering, setOrdering] = useState("name");
  const [page, setPage] = useState(initialPage.page || 1);
  const [selectedCidade, setSelectedCidade] = useState<ApiCidade | null>(null);
  const [selectedNoticia, setSelectedNoticia] = useState<ApiNoticia | null>(null);
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  const loadPage = useCallback(
    async (
      nextPage: number,
      filters: {
        search: string;
        ibge: string;
        estado: string;
        igr: string;
        ordering: string;
      },
    ) => {
      setLoadingPage(true);
      try {
        const result = await fetchPaginatedPage<ApiCidade>("cidades/", {
          page: nextPage,
          page_size: PAGE_SIZE,
          search: filters.search.trim() || undefined,
          ibge_code: filters.ibge.trim() || undefined,
          estado: filters.estado || undefined,
          igr: filters.igr || undefined,
          ordering: filters.ordering || "name",
        });
        setPageData(result);
      } catch {
        // Mantém estado anterior em caso de oscilação de rede
      } finally {
        setLoadingPage(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      loadPage(page, {
        search: searchTerm,
        ibge: ibgeCode,
        estado: estadoId,
        igr: igrId,
        ordering,
      });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [page, searchTerm, ibgeCode, estadoId, igrId, ordering, loadPage]);

  const noticiasPorCidadeCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const noticia of initialNoticias) {
      if (noticia.cidade !== null && noticia.cidade !== undefined) {
        const cityId = String(noticia.cidade);
        counts.set(cityId, (counts.get(cityId) || 0) + 1);
      }
    }
    return counts;
  }, [initialNoticias]);

  const handleSelectCidade = (cidade: ApiCidade) => {
    setSelectedCidade(cidade);
    const newUrl = `/cidades?id=${encodeURIComponent(String(cidade.id))}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  useEffect(() => {
    const cidadeParam = searchParams.get("id") || searchParams.get("cidade");
    if (!cidadeParam) return;
    const match = pageData.results.find(
      (c) =>
        String(c.id) === cidadeParam ||
        (c.slug && c.slug.toLowerCase() === cidadeParam.toLowerCase()) ||
        c.name.toLowerCase() === cidadeParam.toLowerCase(),
    );
    if (match) {
      setSelectedCidade(match);
    }
  }, [searchParams, pageData.results]);

  const handleCloseModal = () => {
    setSelectedCidade(null);
    window.history.pushState({ path: "/cidades" }, "", "/cidades");
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 240, behavior: "smooth" });
    }
  };

  return (
    <>
      <FilterBar containerClassName="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        <div className="grid w-full flex-1 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              aria-label="Buscar cidade pelo nome"
              placeholder="Buscar cidade pelo nome..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830] transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setPage(1);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                title="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <input
            type="text"
            inputMode="numeric"
            maxLength={7}
            aria-label="Código IBGE"
            placeholder="Código IBGE"
            value={ibgeCode}
            onChange={(e) => {
              setIbgeCode(e.target.value.replace(/\D/g, ""));
              setPage(1);
            }}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830]"
          />
          <select
            aria-label="Filtrar por estado"
            value={estadoId}
            onChange={(e) => {
              setEstadoId(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830]"
          >
            <option value="">Todos os estados</option>
            {initialEstados.map((estado) => (
              <option key={estado.id} value={estado.id}>
                {estado.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por IGR"
            value={igrId}
            onChange={(e) => {
              setIgrId(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830]"
          >
            <option value="">Todas as IGRs</option>
            {initialIgrs.map((igr) => (
              <option key={igr.id} value={igr.id}>
                {igr.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Ordenar municípios"
            value={ordering}
            onChange={(e) => {
              setOrdering(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830]"
          >
            <option value="name">Nome: A-Z</option>
            <option value="-name">Nome: Z-A</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto justify-between xl:justify-end">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {pageData.count} {pageData.count === 1 ? "município" : "municípios"}
          </span>
        </div>
      </FilterBar>

      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10 flex-1 space-y-8">
        {loadingPage ? (
          <StandardCardGridSkeleton count={8} />
        ) : pageData.results.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-8 shadow-sm">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
              <MapPin className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Nenhum município encontrado</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              {initialPage.count === 0
                ? "Não há municípios cadastrados ou a API está temporariamente indisponível."
                : "Não encontramos resultados correspondentes aos filtros informados."}
            </p>
            {(searchTerm || ibgeCode || estadoId || igrId) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setIbgeCode("");
                  setEstadoId("");
                  setIgrId("");
                  setPage(1);
                }}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {pageData.results.map((cidade) => (
                <CidadeCard
                  key={cidade.id || cidade.slug || cidade.name}
                  cidade={cidade}
                  noticiasCount={noticiasPorCidadeCount.get(String(cidade.id)) || 0}
                  onSelect={handleSelectCidade}
                />
              ))}
            </div>

            <PaginationControls
              currentPage={pageData.page}
              totalPages={pageData.totalPages}
              totalItems={pageData.count}
              pageSize={PAGE_SIZE}
              loading={loadingPage}
              itemLabel="municípios"
              onPageChange={handlePageChange}
            />
          </>
        )}
      </section>

      {selectedCidade && (
        <CidadeDetalhesModal
          cidade={selectedCidade}
          allNoticias={initialNoticias}
          noticiasLoading={false}
          noticiasError={false}
          onSelectNoticia={setSelectedNoticia}
          onClose={handleCloseModal}
        />
      )}
      <NoticiaModal noticia={selectedNoticia} onClose={() => setSelectedNoticia(null)} />
    </>
  );
}
