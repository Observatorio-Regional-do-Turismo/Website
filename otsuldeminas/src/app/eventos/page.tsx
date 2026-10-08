"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, RefreshCw, Search, X } from "lucide-react";
import { Header } from "@/components/Header";
import { fetchEventos } from "@/lib/eventos-api";

type EventPeriod = "all" | "upcoming" | "past";

function formatEventDate(value?: string) {
  if (!value) return "Data a definir";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data a definir";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function EventosPage() {
  const [eventos, setEventos] = useState<ApiEventos[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cidadeId, setCidadeId] = useState("");
  const [period, setPeriod] = useState<EventPeriod>("all");

  useEffect(() => {
    let isMounted = true;

    async function loadEventos() {
      try {
        const data = await fetchEventos();
        if (isMounted) setEventos(data);
      } catch (error) {
        console.error("Erro ao carregar eventos:", error);
        if (isMounted) setLoadError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEventos();
    return () => {
      isMounted = false;
    };
  }, []);

  const cidades = useMemo(() => {
    const cities = new Map<string, string>();
    eventos.forEach((evento) => {
      if (evento.cidade_name) cities.set(String(evento.cidade), evento.cidade_name);
    });
    return [...cities.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [eventos]);

  const filteredEventos = useMemo(() => {
    const normalizedQuery = searchTerm
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .trim();
    const now = Date.now();

    return eventos.filter((evento) => {
      if (cidadeId && String(evento.cidade) !== cidadeId) return false;

      const start = evento.start_date ? new Date(evento.start_date).getTime() : NaN;
      const end = evento.end_date ? new Date(evento.end_date).getTime() : start;
      const ongoingOrUpcoming = Number.isNaN(end) || end >= now;
      if (period === "upcoming" && !ongoingOrUpcoming) return false;
      if (period === "past" && ongoingOrUpcoming) return false;

      if (!normalizedQuery) return true;
      const searchable = `${evento.name} ${evento.description || ""} ${evento.cidade_name || ""}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR");
      return searchable.includes(normalizedQuery);
    });
  }, [eventos, cidadeId, period, searchTerm]);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Header
        imageSrc="/images/cidades-hero.jpg"
        imageAlt="Eventos turísticos no Sul de Minas Gerais"
        title="Eventos"
        subtitle="Agenda turística do Sul de Minas Gerais"
        badge="Agenda Regional"
      />

      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1">
        <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Eventos da região</h2>
            <p className="mt-1 text-sm text-slate-600">
              Consulte eventos turísticos cadastrados nos municípios do Sul de Minas.
            </p>
          </div>
          {!loading && !loadError && (
            <span className="self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 sm:self-auto">
              {filteredEventos.length} {filteredEventos.length === 1 ? "evento" : "eventos"}
            </span>
          )}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              aria-label="Buscar eventos"
              placeholder="Buscar por evento ou município..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-800 focus:border-[#359830] focus:outline-none focus:ring-2 focus:ring-[#359830]/30"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select
            aria-label="Filtrar eventos por município"
            value={cidadeId}
            onChange={(event) => setCidadeId(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 focus:border-[#359830] focus:outline-none focus:ring-2 focus:ring-[#359830]/30"
          >
            <option value="">Todos os municípios</option>
            {cidades.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <select
            aria-label="Filtrar eventos por período"
            value={period}
            onChange={(event) => setPeriod(event.target.value as EventPeriod)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 focus:border-[#359830] focus:outline-none focus:ring-2 focus:ring-[#359830]/30"
          >
            <option value="all">Todos os períodos</option>
            <option value="upcoming">Em andamento e futuros</option>
            <option value="past">Encerrados</option>
          </select>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-[#359830]" />
            <p className="text-sm font-semibold text-slate-600">Carregando eventos da API...</p>
          </div>
        ) : loadError ? (
          <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
            <h3 className="mb-2 text-lg font-bold text-red-900">Não foi possível carregar os eventos</h3>
            <p className="text-sm text-red-800">
              A conexão com o serviço de eventos falhou. Tente novamente mais tarde.
            </p>
          </div>
        ) : filteredEventos.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <CalendarDays className="mx-auto mb-3 h-9 w-9 text-slate-400" />
            <h3 className="mb-2 text-lg font-bold text-slate-800">
              {eventos.length === 0 ? "Nenhum evento cadastrado" : "Nenhum evento encontrado"}
            </h3>
            <p className="text-sm text-slate-600">
              {eventos.length === 0
                ? "Ainda não há eventos publicados para a região."
                : "Altere os filtros para encontrar outros eventos."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredEventos.map((evento) => {
              const cover = evento.imagens?.find((image) => image.is_cover)?.image || evento.imagens?.[0]?.image;
              return (
                <article key={evento.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                  {cover ? (
                    <img src={cover} alt={evento.name} className="h-48 w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-gradient-to-br from-[#EAF4E9] to-white">
                      <CalendarDays className="h-12 w-12 text-[#359830]/50" />
                    </div>
                  )}
                  <div className="space-y-3 p-5">
                    <h3 className="text-lg font-bold leading-snug text-slate-800">{evento.name}</h3>
                    <p className="flex items-center gap-2 text-sm font-medium text-[#1D5C1B]">
                      <CalendarDays className="h-4 w-4 shrink-0" />
                      <span>{formatEventDate(evento.start_date)}{evento.end_date ? ` – ${formatEventDate(evento.end_date)}` : ""}</span>
                    </p>
                    {evento.cidade_name && (
                      <p className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="h-4 w-4 shrink-0 text-[#C90C0F]" />
                        {evento.cidade_name}
                      </p>
                    )}
                    {evento.description && (
                      <p className="line-clamp-4 text-sm leading-relaxed text-slate-600">
                        {evento.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
