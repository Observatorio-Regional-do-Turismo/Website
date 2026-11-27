"use client";

import { CalendarDays, MapPin, Navigation, Sparkles } from "lucide-react";
import { StandardEntityCard } from "@/components/StandardEntityCard";
import { formatarDataHoraCurta } from "@/lib/formatters";
import { getCoverImage, stripHtml } from "@/lib/utils";

interface EventoCardProps {
  evento: ApiEventos;
  distanceKm?: number | null;
  onClick?: (evento: ApiEventos) => void;
  onSelect?: (evento: ApiEventos) => void;
}

export function EventoCard({ evento, distanceKm, onClick, onSelect }: EventoCardProps) {
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
  const cleanDescription =
    stripHtml(evento.description) ||
    "Confira a programação completa, horário e informações deste evento regional.";

  return (
    <StandardEntityCard
      title={evento.name}
      description={cleanDescription}
      imageUrl={cover}
      imageAlt={evento.name}
      fallbackIcon={<CalendarDays className="h-5 w-5" />}
      fallbackLabel="Evento Regional"
      highlighted={Boolean(evento.is_featured || isOngoing)}
      onClick={handleClick}
      topLeftBadges={
        isOngoing ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Acontecendo
          </span>
        ) : isPast ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-200 text-[10px] font-bold backdrop-blur-md">
            Encerrado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#359830] text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
            <Sparkles className="h-2.5 w-2.5" />
            Programado
          </span>
        )
      }
      topRightBadge={
        evento.start_date ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 text-slate-800 text-[10px] font-bold shadow-xs">
            <CalendarDays className="h-2.5 w-2.5 text-[#359830] shrink-0" />
            {formatarDataHoraCurta(evento.start_date)}
          </span>
        ) : undefined
      }
      bottomOverlay={
        <>
          {evento.cidade_name && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/65 text-emerald-200 text-[10px] font-bold backdrop-blur-md max-w-[75%] truncate border border-white/10">
              <MapPin className="h-2.5 w-2.5 text-[#C90C0F] shrink-0" />
              <span className="truncate">{evento.cidade_name}</span>
            </span>
          )}
          {distanceKm !== null && distanceKm !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 text-[#1D5C1B] text-[10px] font-bold shadow-xs">
              <Navigation className="h-2.5 w-2.5 text-[#359830]" />
              {distanceKm < 1 ? "< 1 km" : `~${Math.round(distanceKm)} km`}
            </span>
          )}
        </>
      }
      footerLeft={evento.cidade_name || "Agenda Regional"}
      actionLabel="Ver detalhes"
    />
  );
}
