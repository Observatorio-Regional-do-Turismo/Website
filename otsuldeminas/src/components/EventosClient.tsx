"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Search, X } from "lucide-react";
import { EventoCard } from "@/components/EventoCard";
import { EventoModal } from "@/components/EventoModal";
import { FilterBar } from "@/components/FilterBar";
import { StandardCardGridSkeleton } from "@/components/LoadingSkeletons";
import { PaginationControls } from "@/components/PaginationControls";
import { fetchPaginatedPage, PaginatedResult } from "@/lib/website-api";

const PAGE_SIZE = 20;

type EventPeriod = "all" | "upcoming" | "past";

interface EventosClientProps {
  initialPage: PaginatedResult<ApiEventos>;
  cidades: ApiCidade[];
}

export function EventosClient({ initialPage, cidades }: EventosClientProps) {
  const [pageData, setPageData] = useState<PaginatedResult<ApiEventos>>(initialPage);
  const [loadingPage, setLoadingPage] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<ApiEventos | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cidadeId, setCidadeId] = useState("");
  const [period, setPeriod] = useState<EventPeriod>("all");
  const [page, setPage] = useState(initialPage.page || 1);
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  const loadPage = useCallback(
    async (nextPage: number, filters: { search: string; cidade: string; period: EventPeriod }) => {
      setLoadingPage(true);
      try {
        const result = await fetchPaginatedPage<ApiEventos>("eventos/", {
          page: nextPage,
          page_size: PAGE_SIZE,
          ordering: "start_date",
          search: filters.search.trim() || undefined,
          cidade: filters.cidade || undefined,
          period: filters.period !== "all" ? filters.period : undefined,
        });
        setPageData(result);
      } catch {
        // Mantém estado anterior em caso de falha transitória
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
      loadPage(page, { search: searchTerm, cidade: cidadeId, period });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [page, searchTerm, cidadeId, period, loadPage]);

  useEffect(() => {
    const idParam = searchParams.get("id") || searchParams.get("evento");
    if (!idParam || pageData.results.length === 0) return;
    const match = pageData.results.find(
      (ev) =>
        String(ev.id) === idParam || (ev.slug && ev.slug.toLowerCase() === idParam.toLowerCase()),
    );
    if (match) {
      setSelectedEvento(match);
    }
  }, [searchParams, pageData.results]);

  const handleSelectEvento = (evento: ApiEventos) => {
    setSelectedEvento(evento);
    const newUrl = `/eventos?id=${encodeURIComponent(String(evento.id))}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  const handleCloseEvento = () => {
    setSelectedEvento(null);
    window.history.pushState({ path: "/eventos" }, "", "/eventos");
  };

  const sortedCidades = useMemo(
    () => [...cidades].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [cidades],
  );

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 240, behavior: "smooth" });
    }
  };

  return (
    <>
      <FilterBar containerClassName="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        <div className="grid w-full flex-1 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              aria-label="Buscar eventos"
              placeholder="Buscar por evento ou município..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
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
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <select
            aria-label="Filtrar eventos por município"
            value={cidadeId}
            onChange={(event) => {
              setCidadeId(event.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830]"
          >
            <option value="">Todos os municípios</option>
            {sortedCidades.map((city) => (
              <option key={city.id} value={String(city.id)}>
                {city.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar eventos por período"
            value={period}
            onChange={(event) => {
              setPeriod(event.target.value as EventPeriod);
              setPage(1);
            }}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830]"
          >
            <option value="all">Todos os períodos</option>
            <option value="upcoming">Em andamento e futuros</option>
            <option value="past">Encerrados</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto justify-between xl:justify-end">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {pageData.count} {pageData.count === 1 ? "evento" : "eventos"}
          </span>
        </div>
      </FilterBar>

      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1">
        {loadingPage ? (
          <StandardCardGridSkeleton count={8} />
        ) : pageData.results.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <CalendarDays className="mx-auto mb-3 h-9 w-9 text-slate-400" />
            <h2 className="mb-2 text-lg font-bold text-slate-800">
              {initialPage.count === 0 ? "Nenhum evento cadastrado" : "Nenhum evento encontrado"}
            </h2>
            <p className="text-sm text-slate-600">
              {initialPage.count === 0
                ? "Ainda não há eventos publicados para a região."
                : "Altere os filtros para encontrar outros eventos."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pageData.results.map((evento) => (
                <EventoCard key={evento.id} evento={evento} onClick={handleSelectEvento} />
              ))}
            </div>

            <PaginationControls
              currentPage={pageData.page}
              totalPages={pageData.totalPages}
              totalItems={pageData.count}
              pageSize={PAGE_SIZE}
              loading={loadingPage}
              itemLabel="eventos"
              onPageChange={handlePageChange}
            />
          </>
        )}
      </section>

      <EventoModal evento={selectedEvento} onClose={handleCloseEvento} />
    </>
  );
}
