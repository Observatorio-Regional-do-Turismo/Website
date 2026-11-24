"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Search, X } from "lucide-react";
import { EventoCard } from "@/components/EventoCard";
import { EventoModal } from "@/components/EventoModal";
import { FilterBar } from "@/components/FilterBar";
import { normalizeText } from "@/lib/utils";

type EventPeriod = "all" | "upcoming" | "past";

interface EventosClientProps {
  initialEventos: ApiEventos[];
}

export function EventosClient({ initialEventos }: EventosClientProps) {
  const [selectedEvento, setSelectedEvento] = useState<ApiEventos | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cidadeId, setCidadeId] = useState("");
  const [period, setPeriod] = useState<EventPeriod>("all");
  const searchParams = useSearchParams();

  useEffect(() => {
    const idParam = searchParams.get("id") || searchParams.get("evento");
    if (!idParam || initialEventos.length === 0) return;
    const match = initialEventos.find(
      (ev) =>
        String(ev.id) === idParam || (ev.slug && ev.slug.toLowerCase() === idParam.toLowerCase()),
    );
    if (match) {
      setSelectedEvento(match);
    }
  }, [searchParams, initialEventos]);

  const handleSelectEvento = (evento: ApiEventos) => {
    setSelectedEvento(evento);
    const newUrl = `/eventos?id=${encodeURIComponent(String(evento.id))}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  const handleCloseEvento = () => {
    setSelectedEvento(null);
    window.history.pushState({ path: "/eventos" }, "", "/eventos");
  };

  const cidades = useMemo(() => {
    const cities = new Map<string, string>();
    initialEventos.forEach((evento) => {
      if (evento.cidade_name) cities.set(String(evento.cidade), evento.cidade_name);
    });
    return [...cities.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [initialEventos]);

  const filteredEventos = useMemo(() => {
    const normalizedQuery = normalizeText(searchTerm);
    const now = Date.now();

    return initialEventos.filter((evento) => {
      if (cidadeId && String(evento.cidade) !== cidadeId) return false;

      const start = evento.start_date ? new Date(evento.start_date).getTime() : NaN;
      const end = evento.end_date ? new Date(evento.end_date).getTime() : start;
      const ongoingOrUpcoming = Number.isNaN(end) || end >= now;
      if (period === "upcoming" && !ongoingOrUpcoming) return false;
      if (period === "past" && ongoingOrUpcoming) return false;

      if (!normalizedQuery) return true;
      const searchable = normalizeText(
        `${evento.name} ${evento.description || ""} ${evento.cidade_name || ""}`,
      );
      return searchable.includes(normalizedQuery);
    });
  }, [initialEventos, cidadeId, period, searchTerm]);

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
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830] transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
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
            onChange={(event) => setCidadeId(event.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830]"
          >
            <option value="">Todos os municípios</option>
            {cidades.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar eventos por período"
            value={period}
            onChange={(event) => setPeriod(event.target.value as EventPeriod)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830]"
          >
            <option value="all">Todos os períodos</option>
            <option value="upcoming">Em andamento e futuros</option>
            <option value="past">Encerrados</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto justify-between xl:justify-end">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {filteredEventos.length} {filteredEventos.length === 1 ? "evento" : "eventos"}
          </span>
        </div>
      </FilterBar>

      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1">
        {filteredEventos.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <CalendarDays className="mx-auto mb-3 h-9 w-9 text-slate-400" />
            <h2 className="mb-2 text-lg font-bold text-slate-800">
              {initialEventos.length === 0
                ? "Nenhum evento cadastrado"
                : "Nenhum evento encontrado"}
            </h2>
            <p className="text-sm text-slate-600">
              {initialEventos.length === 0
                ? "Ainda não há eventos publicados para a região."
                : "Altere os filtros para encontrar outros eventos."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredEventos.map((evento) => (
              <EventoCard key={evento.id} evento={evento} onClick={handleSelectEvento} />
            ))}
          </div>
        )}
      </section>

      <EventoModal evento={selectedEvento} onClose={handleCloseEvento} />
    </>
  );
}
