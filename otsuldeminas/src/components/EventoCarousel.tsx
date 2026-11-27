"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EventoCard } from "@/components/EventoCard";

const MAX_CAROUSEL_ITEMS = 10;

export interface EventoWithDistance {
  evento: ApiEventos;
  distanceKm?: number | null;
}

interface EventoCarouselProps {
  items: EventoWithDistance[];
  onSelect: (evento: ApiEventos) => void;
  label: string;
}

export function EventoCarousel({ items, onSelect, label }: EventoCarouselProps) {
  const limitedItems = useMemo(() => items.slice(0, MAX_CAROUSEL_ITEMS), [items]);
  const [activePage, setActivePage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(limitedItems.length / 3));
  const currentItems = useMemo(
    () => limitedItems.slice(activePage * 3, activePage * 3 + 3),
    [limitedItems, activePage],
  );

  useEffect(() => {
    setActivePage(0);
  }, [limitedItems]);

  if (limitedItems.length === 0) return null;

  const showPrevious = () => {
    setActivePage((page) => (page - 1 + pageCount) % pageCount);
  };
  const showNext = () => {
    setActivePage((page) => (page + 1) % pageCount);
  };

  return (
    <div
      className="mx-auto flex w-full items-center gap-2 sm:gap-4"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <button
        type="button"
        onClick={showPrevious}
        aria-label="Eventos anteriores"
        className="shrink-0 rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:border-[#359830] hover:text-[#1D5C1B] focus:outline-none focus:ring-2 focus:ring-[#359830]/40 sm:p-2.5 cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
      <div className="min-w-0 flex-1" aria-live="polite">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {currentItems.map(({ evento, distanceKm }) => (
            <EventoCard
              key={evento.id}
              evento={evento}
              distanceKm={distanceKm}
              onClick={onSelect}
            />
          ))}
        </div>
        <p className="mt-4 text-center text-xs font-semibold text-slate-500">
          {activePage * 3 + 1}–{Math.min(activePage * 3 + currentItems.length, limitedItems.length)}{" "}
          de {limitedItems.length}
        </p>
      </div>
      <button
        type="button"
        onClick={showNext}
        aria-label="Próximos eventos"
        className="shrink-0 rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:border-[#359830] hover:text-[#1D5C1B] focus:outline-none focus:ring-2 focus:ring-[#359830]/40 sm:p-2.5 cursor-pointer"
      >
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
    </div>
  );
}
