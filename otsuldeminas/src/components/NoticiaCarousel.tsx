"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NoticiaCard } from "@/components/NoticiaCard";

const MAX_CAROUSEL_ITEMS = 10;

interface NoticiaCarouselProps {
  noticias: ApiNoticia[];
  onSelect: (noticia: ApiNoticia) => void;
  label: string;
}

export function NoticiaCarousel({ noticias, onSelect, label }: NoticiaCarouselProps) {
  const limitedNoticias = useMemo(() => noticias.slice(0, MAX_CAROUSEL_ITEMS), [noticias]);
  const [activePage, setActivePage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(limitedNoticias.length / 3));
  const currentNoticias = useMemo(
    () => limitedNoticias.slice(activePage * 3, activePage * 3 + 3),
    [limitedNoticias, activePage],
  );

  useEffect(() => {
    setActivePage(0);
  }, [limitedNoticias]);

  if (limitedNoticias.length === 0) return null;

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
        aria-label="Notícia anterior"
        className="shrink-0 rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:border-[#359830] hover:text-[#1D5C1B] focus:outline-none focus:ring-2 focus:ring-[#359830]/40 sm:p-2.5 cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
      <div className="min-w-0 flex-1" aria-live="polite">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {currentNoticias.map((noticia) => (
            <NoticiaCard key={noticia.id} noticia={noticia} onClick={onSelect} />
          ))}
        </div>
        <p className="mt-3 text-center text-xs font-semibold text-slate-500">
          {activePage * 3 + 1}–
          {Math.min(activePage * 3 + currentNoticias.length, limitedNoticias.length)} de{" "}
          {limitedNoticias.length}
        </p>
      </div>
      <button
        type="button"
        onClick={showNext}
        aria-label="Próxima notícia"
        className="shrink-0 rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:border-[#359830] hover:text-[#1D5C1B] focus:outline-none focus:ring-2 focus:ring-[#359830]/40 sm:p-2.5 cursor-pointer"
      >
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
    </div>
  );
}
