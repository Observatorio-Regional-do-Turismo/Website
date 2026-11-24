"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Flame,
  Navigation,
  Newspaper,
  Sparkles,
  Users,
} from "lucide-react";
import { EventoCarousel, EventoWithDistance } from "@/components/EventoCarousel";
import { EventoModal } from "@/components/EventoModal";
import { NoticiaCarousel } from "@/components/NoticiaCarousel";
import { NoticiaModal } from "@/components/NoticiaModal";
import { haversineDistanceKm } from "@/lib/utils";

type EventSortMode = "popularity" | "city_size" | "proximity";
type CitySizeFilter = "all" | "small" | "medium" | "large";

interface HomeInteractiveProps {
  noticiasDestaque: ApiNoticia[];
  eventos: ApiEventos[];
  cidades: ApiCidade[];
}

export function HomeInteractive({ noticiasDestaque, eventos, cidades }: HomeInteractiveProps) {
  const [selectedNoticia, setSelectedNoticia] = useState<ApiNoticia | null>(null);
  const [selectedEvento, setSelectedEvento] = useState<ApiEventos | null>(null);
  const [sortMode, setSortMode] = useState<EventSortMode>("popularity");
  const [citySize, setCitySize] = useState<CitySizeFilter>("all");
  const [referenceCitySlug, setReferenceCitySlug] = useState<string>("");
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const citiesWithCoords = useMemo(
    () =>
      cidades
        .filter(
          (c) =>
            c.latitude !== null &&
            c.latitude !== undefined &&
            c.longitude !== null &&
            c.longitude !== undefined,
        )
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [cidades],
  );

  const activeReferenceCoords = useMemo(() => {
    if (referenceCitySlug) {
      const city = citiesWithCoords.find((c) => c.slug === referenceCitySlug);
      if (city) return { lat: Number(city.latitude), lon: Number(city.longitude) };
    }
    if (userCoords) return userCoords;
    if (citiesWithCoords.length > 0) {
      return {
        lat: Number(citiesWithCoords[0].latitude),
        lon: Number(citiesWithCoords[0].longitude),
      };
    }
    return null;
  }, [referenceCitySlug, userCoords, citiesWithCoords]);

  const requestUserLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setReferenceCitySlug("");
        setSortMode("proximity");
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { timeout: 8000 },
    );
  };

  const carouselEventos: EventoWithDistance[] = useMemo(() => {
    const now = Date.now();
    const upcomingOrActive = eventos.filter((evento) => {
      const end = evento.end_date
        ? new Date(evento.end_date).getTime()
        : evento.start_date
          ? new Date(evento.start_date).getTime()
          : NaN;
      return Number.isNaN(end) || end >= now - 86_400_000 * 7;
    });

    const pool = upcomingOrActive.length > 0 ? upcomingOrActive : eventos;

    const filteredBySize = pool.filter((evento) => {
      const pop = evento.cidade_populacao ?? null;
      if (citySize === "all") return true;
      if (pop === null || pop === undefined) return false;
      if (citySize === "small") return pop < 20_000;
      if (citySize === "medium") return pop >= 20_000 && pop <= 100_000;
      return pop > 100_000;
    });

    const withDistance: EventoWithDistance[] = filteredBySize.map((evento) => {
      const evLat = evento.latitude ?? evento.cidade_latitude;
      const evLon = evento.longitude ?? evento.cidade_longitude;
      let distanceKm: number | null = null;
      if (
        activeReferenceCoords &&
        evLat !== null &&
        evLat !== undefined &&
        evLon !== null &&
        evLon !== undefined
      ) {
        distanceKm = haversineDistanceKm(
          activeReferenceCoords.lat,
          activeReferenceCoords.lon,
          Number(evLat),
          Number(evLon),
        );
      }
      return { evento, distanceKm };
    });

    return withDistance.sort((a, b) => {
      if (sortMode === "proximity") {
        const dA = a.distanceKm ?? Number.MAX_SAFE_INTEGER;
        const dB = b.distanceKm ?? Number.MAX_SAFE_INTEGER;
        if (dA !== dB) return dA - dB;
      }
      if (sortMode === "city_size") {
        const popA = a.evento.cidade_populacao ?? 0;
        const popB = b.evento.cidade_populacao ?? 0;
        if (popA !== popB) return popB - popA;
      }
      const featDiff = (b.evento.is_featured ? 1 : 0) - (a.evento.is_featured ? 1 : 0);
      if (featDiff !== 0) return featDiff;
      const popScoreDiff = (b.evento.popularity ?? 0) - (a.evento.popularity ?? 0);
      if (popScoreDiff !== 0) return popScoreDiff;
      return (
        new Date(a.evento.start_date || "").getTime() -
        new Date(b.evento.start_date || "").getTime()
      );
    });
  }, [eventos, citySize, sortMode, activeReferenceCoords]);

  return (
    <>
      {/* SEÇÃO: NOTÍCIAS EM DESTAQUE */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#C90C0F] text-xs font-bold uppercase tracking-wider mb-2 border border-[#C90C0F]/20">
              <Sparkles className="h-3.5 w-3.5" />
              Cobertura Regional
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              Notícias em Destaque
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Principais acontecimentos, lançamentos de roteiros e novidades do turismo
            </p>
          </div>

          <Link
            href="/noticias"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#359830] hover:text-[#1D5C1B] transition-colors self-start sm:self-auto group"
          >
            Ver todas as notícias
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {noticiasDestaque.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
            <Newspaper className="h-8 w-8 mx-auto mb-2 text-slate-400" />
            Nenhuma notícia em destaque no momento.
          </div>
        ) : (
          <NoticiaCarousel
            noticias={noticiasDestaque}
            onSelect={setSelectedNoticia}
            label="Notícias em destaque"
          />
        )}
      </section>

      {/* SEÇÃO: EVENTOS EM CARROSSEL (POPULARIDADE, PORTE E PROXIMIDADE) */}
      <section className="bg-white/70 border-y border-slate-200/80 py-10 sm:py-12">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF4E9] text-[#1D5C1B] text-xs font-bold uppercase tracking-wider mb-2 border border-[#5BAF56]/30">
                <CalendarDays className="h-3.5 w-3.5 text-[#359830]" />
                Agenda Turística
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                Eventos na Região
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Explore eventos filtrados por popularidade, porte do município e proximidade
              </p>
            </div>

            <Link
              href="/eventos"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#359830] hover:text-[#1D5C1B] transition-colors self-start lg:self-auto group"
            >
              Ver agenda completa
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Controles de Filtro do Carrossel */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="text-slate-500 uppercase tracking-wider mr-1">Ordenar por:</span>
              <button
                type="button"
                onClick={() => setSortMode("popularity")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition cursor-pointer ${
                  sortMode === "popularity"
                    ? "bg-[#1D5C1B] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                Popularidade
              </button>
              <button
                type="button"
                onClick={() => setSortMode("city_size")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition cursor-pointer ${
                  sortMode === "city_size"
                    ? "bg-[#1D5C1B] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Tamanho da cidade
              </button>
              <button
                type="button"
                onClick={() => setSortMode("proximity")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition cursor-pointer ${
                  sortMode === "proximity"
                    ? "bg-[#1D5C1B] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Navigation className="h-3.5 w-3.5" />
                Proximidade
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                aria-label="Filtrar eventos por porte do município"
                value={citySize}
                onChange={(e) => setCitySize(e.target.value as CitySizeFilter)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#359830]/30"
              >
                <option value="all">Todos os portes de cidade</option>
                <option value="small">Pequeno porte (&lt; 20 mil hab.)</option>
                <option value="medium">Médio porte (20–100 mil hab.)</option>
                <option value="large">Grande porte (&gt; 100 mil hab.)</option>
              </select>

              {citiesWithCoords.length > 0 && (
                <select
                  aria-label="Cidade de referência para proximidade"
                  value={referenceCitySlug}
                  onChange={(e) => {
                    setReferenceCitySlug(e.target.value);
                    if (e.target.value) setSortMode("proximity");
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#359830]/30"
                >
                  <option value="">Referência: minha localização / padrão</option>
                  {citiesWithCoords.map((city) => (
                    <option key={city.id} value={city.slug}>
                      Próximo a {city.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={requestUserLocation}
                disabled={locating}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#5BAF56]/40 bg-[#EAF4E9] text-[#1D5C1B] font-semibold hover:bg-[#359830] hover:text-white transition cursor-pointer disabled:opacity-60"
              >
                <Navigation className="h-3.5 w-3.5" />
                {locating ? "Localizando..." : "Usar minha localização"}
              </button>
            </div>
          </div>

          {carouselEventos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 text-slate-400" />
              Nenhum evento encontrado para o filtro selecionado.
            </div>
          ) : (
            <EventoCarousel
              items={carouselEventos}
              onSelect={setSelectedEvento}
              label="Eventos em destaque na região"
            />
          )}
        </div>
      </section>

      <NoticiaModal noticia={selectedNoticia} onClose={() => setSelectedNoticia(null)} />
      <EventoModal evento={selectedEvento} onClose={() => setSelectedEvento(null)} />
    </>
  );
}
