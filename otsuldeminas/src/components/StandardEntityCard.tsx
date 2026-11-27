"use client";

import { ReactNode, useState } from "react";
import { ArrowRight } from "lucide-react";

export interface StandardEntityCardProps {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  imageAlt?: string;
  fallbackIcon: ReactNode;
  fallbackLabel?: string;
  topLeftBadges?: ReactNode;
  topRightBadge?: ReactNode;
  bottomOverlay?: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  actionLabel?: string;
  highlighted?: boolean;
  onClick?: () => void;
}

/**
 * Card compacto padronizado inspirado no CidadeCard:
 * - Proporção vertical/enxuta ideal para grids de até 4 colunas
 * - Metadados específicos da entidade sobre a imagem (status, data, categoria, cidade/IGR)
 * - Título e descrição curta na área branca abaixo da imagem
 */
export function StandardEntityCard({
  title,
  description,
  imageUrl,
  imageAlt,
  fallbackIcon,
  fallbackLabel,
  topLeftBadges,
  topRightBadge,
  bottomOverlay,
  footerLeft,
  footerRight,
  actionLabel = "Ver detalhes",
  highlighted = false,
  onClick,
}: StandardEntityCardProps) {
  const [imageError, setImageError] = useState(false);

  const interactiveProps = onClick
    ? {
        onClick,
        role: "button" as const,
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        },
      }
    : {};

  return (
    <article
      {...interactiveProps}
      className={`group bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden text-left relative focus:outline-none focus:ring-2 focus:ring-[#359830]/40 ${
        onClick ? "cursor-pointer" : ""
      } ${
        highlighted
          ? "border-emerald-300/90 hover:border-[#359830]"
          : "border-slate-200 hover:border-[#359830]/50"
      }`}
    >
      {/* Mídia + informações características sobre a imagem */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 shrink-0">
        {!imageError && imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt || title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImageError(true)}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#EAF4E9] via-white to-[#EAF4E9] text-slate-400 group-hover:bg-[#EAF4E9] transition-colors p-4 text-center">
            <div className="w-11 h-11 rounded-2xl bg-[#359830]/10 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform text-[#359830]">
              {fallbackIcon}
            </div>
            {fallbackLabel && (
              <span className="text-[11px] font-semibold text-slate-500 line-clamp-1">
                {fallbackLabel}
              </span>
            )}
          </div>
        )}

        {/* Gradientes sutis para leitura dos selos sobre a foto */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-transparent to-slate-950/60 pointer-events-none" />

        {/* Selos superiores (categoria, status, data, contagem) */}
        {(topLeftBadges || topRightBadge) && (
          <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-start justify-between gap-1.5">
            <div className="flex flex-wrap items-center gap-1 min-w-0">{topLeftBadges}</div>
            {topRightBadge && <div className="shrink-0">{topRightBadge}</div>}
          </div>
        )}

        {/* Metadados na base da imagem (localização, data/hora, distância, IGR) */}
        {bottomOverlay && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex flex-wrap items-center gap-1.5">
            {bottomOverlay}
          </div>
        )}
      </div>

      {/* Área branca abaixo da imagem: título + descrição curta + rodapé */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between bg-white">
        <div className="space-y-1.5">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight leading-snug group-hover:text-[#1D5C1B] transition-colors line-clamp-2">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{description}</p>
          )}
        </div>

        <div className="pt-2.5 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="text-[11px] font-semibold text-slate-400 truncate min-w-0">
            {footerLeft}
          </div>
          {footerRight ?? (
            <span className="inline-flex items-center text-xs font-bold text-[#359830] group-hover:text-[#C90C0F] gap-1 transition-colors shrink-0">
              {actionLabel}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1 text-[#C90C0F]" />
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
