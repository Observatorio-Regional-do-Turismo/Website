"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, Search, X } from "lucide-react";
import { FilterBar } from "@/components/FilterBar";
import { IGRCard } from "@/components/IGRCard";
import { IGRDetalhesModal } from "@/components/IGRDetalhesModal";
import { StandardCardGridSkeleton } from "@/components/LoadingSkeletons";
import { PaginationControls } from "@/components/PaginationControls";
import { fetchPaginatedPage, PaginatedResult } from "@/lib/website-api";

const PAGE_SIZE = 20;

interface SelosClientProps {
  initialPage: PaginatedResult<ApiIGR>;
  initialCidades: ApiCidade[];
}

export function SelosClient({ initialPage, initialCidades }: SelosClientProps) {
  const [pageData, setPageData] = useState<PaginatedResult<ApiIGR>>(initialPage);
  const [loadingPage, setLoadingPage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(initialPage.page || 1);
  const [selectedIgr, setSelectedIgr] = useState<ApiIGR | null>(null);
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  const loadPage = useCallback(async (nextPage: number, search: string) => {
    setLoadingPage(true);
    try {
      const result = await fetchPaginatedPage<ApiIGR>("igrs/", {
        page: nextPage,
        page_size: PAGE_SIZE,
        ordering: "name",
        search: search.trim() || undefined,
      });
      setPageData(result);
    } catch {
      // Mantém estado anterior
    } finally {
      setLoadingPage(false);
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      loadPage(page, searchTerm);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [page, searchTerm, loadPage]);

  const cidadesPorIgrCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const city of initialCidades) {
      if (Array.isArray(city.igr_ids) && city.igr_ids.length > 0) {
        for (const id of city.igr_ids) {
          counts.set(String(id), (counts.get(String(id)) || 0) + 1);
        }
      } else if (city.igr) {
        counts.set(String(city.igr), (counts.get(String(city.igr)) || 0) + 1);
      }
    }
    return counts;
  }, [initialCidades]);

  const handleSelectIgr = (igr: ApiIGR) => {
    setSelectedIgr(igr);
    const newUrl = `/selos?id=${encodeURIComponent(String(igr.id))}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  useEffect(() => {
    const igrParam = searchParams.get("id") || searchParams.get("igr");
    if (igrParam && pageData.results.length > 0) {
      const match = pageData.results.find(
        (i) =>
          String(i.id) === igrParam ||
          (i.slug && i.slug.toLowerCase() === igrParam.toLowerCase()) ||
          i.name.toLowerCase() === igrParam.toLowerCase(),
      );
      if (match) {
        setSelectedIgr(match);
      }
    }
  }, [searchParams, pageData.results]);

  const handleCloseModal = () => {
    setSelectedIgr(null);
    window.history.pushState({ path: "/selos" }, "", "/selos");
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 240, behavior: "smooth" });
    }
  };

  return (
    <>
      <FilterBar containerClassName="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            aria-label="Buscar IGR"
            placeholder="Buscar IGR..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830] transition-all shadow-inner"
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

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {pageData.count} {pageData.count === 1 ? "IGR" : "IGRs"}
          </span>
        </div>
      </FilterBar>

      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1 space-y-10">
        {/* O que é a IGR */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800 mb-3">O que é a IGR?</h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-4xl">
            A <strong>IGR (Instância de Governança Regional)</strong> é uma organização colegiada
            instituída no âmbito do Programa de Regionalização do Turismo (PRT), reunindo poder
            público municipal, setor privado e entidades da sociedade civil para planejar, coordenar
            e fortalecer políticas públicas de turismo sustentável de forma integrada entre os
            municípios participantes.
          </p>
        </div>

        {/* Cards das IGRs */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">IGRs Cadastradas</h2>
            <p className="text-sm text-slate-500">
              Selecione uma IGR para visualizar seus detalhes e municípios consorciados
            </p>
          </div>

          {loadingPage ? (
            <StandardCardGridSkeleton count={8} />
          ) : pageData.results.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-8 shadow-sm">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                <Building2 className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhuma IGR encontrada</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                {searchTerm
                  ? `Não encontramos resultados correspondentes a "${searchTerm}".`
                  : "Ainda não há IGRs cadastradas."}
              </p>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setPage(1);
                  }}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Ver todas as IGRs
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {pageData.results.map((igr) => (
                  <IGRCard
                    key={igr.id || igr.slug || igr.name}
                    igr={igr}
                    cidadesCount={cidadesPorIgrCount.get(String(igr.id))}
                    onSelect={handleSelectIgr}
                  />
                ))}
              </div>

              <PaginationControls
                currentPage={pageData.page}
                totalPages={pageData.totalPages}
                totalItems={pageData.count}
                pageSize={PAGE_SIZE}
                loading={loadingPage}
                itemLabel="IGRs"
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </section>

      {selectedIgr && (
        <IGRDetalhesModal igr={selectedIgr} cidades={initialCidades} onClose={handleCloseModal} />
      )}
    </>
  );
}
