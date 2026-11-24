"use client";

import { useState } from "react";
import { CalendarDays, MapPin, ArrowRight, Sparkles, Navigation } from "lucide-react";
import { formatarDataHoraCurta } from "@/lib/formatters";
import { getCoverImage, stripHtml } from "@/lib/utils";

interface EventoCardProps {
  evento: ApiEventos;
  distanceKm?: number | null;
  onClick?: (evento: ApiEventos) => void;
  onSelect?: (evento: ApiEventos) => void;
}

export function EventoCard({ evento, distanceKm, onClick, onSelect }: EventoCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    if (onClick) onClick(evento);
    else if (onSelect) onSelect(evento);
  };

  const cover = getCoverImage(evento.imagens);

  const now = Date.now();
  const start = evento.start_date ? new Date(evento.start_date).getTime() : NaN;
  const end = evento.end_date ? new Date(evento.end_date).getTime() : start;
  const isPast = !Number.isNaN(end) && end < now;
  const isOngoing = !Number.isNaN(start) && !Number.isNaN(end) && now >= start && now <= end;

  const cleanDescription = stripHtml(evento.description);

  return (
    <article
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#359830]/50 transition-all duration-300 flex flex-col overflow-hidden text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#359830]/40 relative"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 shrink-0">
        {!imageError && cover ? (
          <img
            src={cover}
            alt={evento.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#EAF4E9] via-white to-[#EAF4E9] text-slate-400 group-hover:bg-[#EAF4E9] transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#359830]/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <CalendarDays className="h-6 w-6 text-[#359830]" />
            </div>
            <span className="text-xs font-semibold text-slate-600">Evento Regional</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/15 pointer-events-none" />

        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          {isOngoing ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Acontecendo
            </span>
          ) : isPast ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-900/80 text-slate-300 text-[10px] font-bold backdrop-blur-md">
              Encerrado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#359830] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="h-3 w-3" />
              Programado
            </span>
          )}

          {evento.cidade_name && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-emerald-300 text-[10px] font-bold backdrop-blur-sm max-w-[150px] truncate border border-white/10">
              <MapPin className="h-3 w-3 text-[#C90C0F] shrink-0" />
              <span className="truncate">{evento.cidade_name}</span>
            </span>
          )}
        </div>

        {distanceKm !== null && distanceKm !== undefined && (
          <div className="absolute bottom-2.5 left-3 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 text-[#1D5C1B] text-[10px] font-bold shadow-sm">
              <Navigation className="h-2.5 w-2.5 text-[#359830]" />
              {distanceKm < 1 ? "< 1 km" : `~${Math.round(distanceKm)} km`}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 p-5 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#1D5C1B]">
            <CalendarDays className="h-4 w-4 shrink-0 text-[#359830]" />
            <span>
              {formatarDataHoraCurta(evento.start_date)}
              {evento.end_date ? ` – ${formatarDataHoraCurta(evento.end_date)}` : ""}
            </span>
          </p>

          <h3 className="text-lg font-bold leading-snug text-slate-800 group-hover:text-[#359830] transition-colors line-clamp-2">
            {evento.name}
          </h3>

          {cleanDescription && (
            <p className="line-clamp-3 text-xs leading-relaxed text-slate-600">
              {cleanDescription}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400">
            {evento.cidade_name || "Regional"}
          </span>
          <span className="inline-flex items-center text-xs font-bold text-[#359830] group-hover:text-[#C90C0F] gap-1 transition-colors">
            Ver detalhes
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1.5 text-[#C90C0F]" />
          </span>
        </div>
      </div>
    </article>
  );
}
