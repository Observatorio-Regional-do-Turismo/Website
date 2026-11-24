"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Compass, CalendarDays, MapPin, Search, UtensilsCrossed, ZoomIn } from "lucide-react";
import { FilterBar } from "@/components/FilterBar";
import type { MapLayerVisibility } from "@/components/InteractiveMap";
import { normalizeText } from "@/lib/utils";

const InteractiveMap = dynamic(
  () => import("@/components/InteractiveMap").then((mod) => mod.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[65vh] min-h-[460px] rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-sm font-semibold text-slate-500">
        Carregando mapa interativo...
      </div>
    ),
  },
);

interface MapaClientProps {
  initialData: ApiMapaOverview;
}

export function MapaClient({ initialData }: MapaClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("");
  const [currentZoom, setCurrentZoom] = useState(8);
  const [focusTarget, setFocusTarget] = useState<{
    lat: number;
    lon: number;
    zoom?: number;
  } | null>(null);
  const [layers, setLayers] = useState<MapLayerVisibility>({
    cidades: true,
    pontos: true,
    estabelecimentos: true,
    eventos: true,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const citySlug = params.get("cidade");
    if (!citySlug) return;
    const city = initialData.cidades.find((c) => c.slug === citySlug);
    if (city && city.latitude !== null && city.longitude !== null) {
      setSelectedSlug(city.slug);
      setFocusTarget({ lat: Number(city.latitude), lon: Number(city.longitude), zoom: 13 });
    }
  }, [initialData.cidades]);

  const filteredCidades = useMemo(() => {
    const q = normalizeText(searchTerm);
    if (!q) return initialData.cidades;
    return initialData.cidades.filter(
      (c) =>
        normalizeText(c.name).includes(q) || (c.igr_name && normalizeText(c.igr_name).includes(q)),
    );
  }, [initialData.cidades, searchTerm]);

  const filteredPontos = useMemo(() => {
    const q = normalizeText(searchTerm);
    if (!q) return initialData.pontos_turisticos;
    return initialData.pontos_turisticos.filter((p) =>
      normalizeText(`${p.name} ${p.category || ""} ${p.cidade_name || ""}`).includes(q),
    );
  }, [initialData.pontos_turisticos, searchTerm]);

  const filteredEstabelecimentos = useMemo(() => {
    const q = normalizeText(searchTerm);
    if (!q) return initialData.estabelecimentos;
    return initialData.estabelecimentos.filter((e) =>
      normalizeText(`${e.nome} ${e.categoria} ${e.cidade_name || ""} ${e.endereco || ""}`).includes(
        q,
      ),
    );
  }, [initialData.estabelecimentos, searchTerm]);

  const filteredEventos = useMemo(() => {
    const q = normalizeText(searchTerm);
    if (!q) return initialData.eventos;
    return initialData.eventos.filter((ev) =>
      normalizeText(`${ev.name} ${ev.cidade_name || ""}`).includes(q),
    );
  }, [initialData.eventos, searchTerm]);

  const handleSelectCity = (slug: string) => {
    setSelectedSlug(slug);
    const city = initialData.cidades.find((c) => c.slug === slug);
    if (city && city.latitude !== null && city.longitude !== null) {
      setFocusTarget({ lat: Number(city.latitude), lon: Number(city.longitude), zoom: 13 });
    }
  };

  const toggleLayer = (key: keyof MapLayerVisibility) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isDetailZoom = currentZoom >= 11;

  return (
    <>
      <FilterBar>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                aria-label="Buscar município, atrativo ou restaurante no mapa"
                placeholder="Buscar município, atrativo, restaurante ou IGR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830]"
              />
            </div>

            <select
              aria-label="Ir para município no mapa"
              value={selectedSlug}
              onChange={(e) => handleSelectCity(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830]"
            >
              <option value="">Aproximar em um município...</option>
              {initialData.cidades
                .filter((c) => c.latitude !== null && c.longitude !== null)
                .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
                .map((cidade) => (
                  <option key={cidade.id} value={cidade.slug}>
                    {cidade.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => toggleLayer("cidades")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition cursor-pointer ${
                layers.cidades
                  ? "bg-[#1D5C1B] text-white border-[#1D5C1B]"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              Cidades
            </button>
            <button
              type="button"
              onClick={() => toggleLayer("pontos")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition cursor-pointer ${
                layers.pontos
                  ? "bg-[#2E7D32] text-white border-[#2E7D32]"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              Atrativos Turísticos
            </button>
            <button
              type="button"
              onClick={() => toggleLayer("estabelecimentos")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition cursor-pointer ${
                layers.estabelecimentos
                  ? "bg-[#E65100] text-white border-[#E65100]"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <UtensilsCrossed className="h-3.5 w-3.5" />
              Restaurantes & Serviços
            </button>
            <button
              type="button"
              onClick={() => toggleLayer("eventos")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition cursor-pointer ${
                layers.eventos
                  ? "bg-[#C90C0F] text-white border-[#C90C0F]"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Eventos
            </button>
          </div>
        </div>
      </FilterBar>

      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5 flex-1">
        <div
          className={`rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm ${
            isDetailZoom
              ? "bg-[#EAF4E9] border-[#5BAF56] text-[#1D5C1B]"
              : "bg-white border-slate-200 text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            <ZoomIn className="h-4 w-4 text-[#359830] shrink-0" />
            <span>
              {isDetailZoom
                ? "Visão detalhada ativa: municípios, atrativos turísticos, restaurantes, estabelecimentos e eventos visíveis."
                : "Municípios e atrativos turísticos visíveis no mapa; dê zoom (nível 11+) ou selecione uma cidade para revelar restaurantes, serviços e eventos."}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-bold">
              Zoom: {currentZoom} · {filteredCidades.length} municípios · {filteredPontos.length}{" "}
              atrativos
            </span>
            <Link href="/atrativos" className="text-xs font-bold text-[#1D5C1B] hover:underline">
              Ver lista de atrativos e serviços →
            </Link>
          </div>
        </div>

        <div className="bg-white p-2 sm:p-3 rounded-3xl border border-slate-200 shadow-sm">
          <InteractiveMap
            cidades={filteredCidades}
            pontos={filteredPontos}
            eventos={filteredEventos}
            estabelecimentos={filteredEstabelecimentos}
            layers={layers}
            focusTarget={focusTarget}
            onZoomChange={setCurrentZoom}
            onSelectCidade={setSelectedSlug}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-white rounded-2xl border border-slate-200 px-4 py-3">
          <span className="font-bold text-slate-800">Legenda:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#1D5C1B] inline-block" /> C (Município)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#2E7D32] inline-block" /> A (Atrativo
            Turístico)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#E65100] inline-block" /> R (Restaurante /
            Alimentação)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#1976D2] inline-block" /> H (Hospedagem /
            Serviço)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#C90C0F] inline-block" /> E (Evento)
          </span>
        </div>
      </section>
    </>
  );
}
