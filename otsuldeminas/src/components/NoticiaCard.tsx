"use client";

import { Calendar, Layers, MapPin, Newspaper, Sparkles } from "lucide-react";
import { StandardEntityCard } from "@/components/StandardEntityCard";
import { formatarDataCurta } from "@/lib/formatters";
import { getCoverImage, stripHtml } from "@/lib/utils";

interface NoticiaCardProps {
  noticia: ApiNoticia;
  showCityBadge?: boolean;
  showIgrBadge?: boolean;
  variant?: "featured" | "standard" | "compact" | "small";
  onSelect?: (noticia: ApiNoticia) => void;
  onClick?: (noticia: ApiNoticia) => void;
}

export function NoticiaCard({
  noticia,
  showCityBadge = true,
  showIgrBadge = true,
  onSelect,
  onClick,
}: NoticiaCardProps) {
  const handleCardClick = () => {
    if (onClick) onClick(noticia);
    else if (onSelect) onSelect(noticia);
  };

  const coverImage = getCoverImage(noticia.imagens, noticia.image);
  const shortSummary =
    (noticia.summary || "").trim() ||
    stripHtml(noticia.content) ||
    "Leia a notícia completa e acompanhe os comunicados do Observatório.";

  return (
    <StandardEntityCard
      title={noticia.title}
      description={shortSummary}
      imageUrl={coverImage}
      imageAlt={noticia.title}
      fallbackIcon={<Newspaper className="h-5 w-5" />}
      fallbackLabel={noticia.category || "Notícia"}
      highlighted={Boolean(noticia.is_featured)}
      onClick={handleCardClick}
      topLeftBadges={
        noticia.is_featured ? (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#C90C0F] text-white font-bold text-[10px] uppercase tracking-wider shadow-xs">
            <Sparkles className="h-2.5 w-2.5" />
            Destaque
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-black/60 text-white font-semibold text-[10px] backdrop-blur-md border border-white/10">
            {noticia.category || "Observatório"}
          </span>
        )
      }
      topRightBadge={
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 text-slate-800 text-[10px] font-bold shadow-xs">
          <Calendar className="h-2.5 w-2.5 text-[#359830]" />
          {formatarDataCurta(noticia.published_at)}
        </span>
      }
      bottomOverlay={
        <>
          {showCityBadge && noticia.cidade_name && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/65 text-emerald-200 text-[10px] font-bold backdrop-blur-md truncate max-w-[65%] border border-white/10">
              <MapPin className="h-2.5 w-2.5 text-[#C90C0F] shrink-0" />
              <span className="truncate">{noticia.cidade_name}</span>
            </span>
          )}
          {showIgrBadge && noticia.igr_name && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/65 text-emerald-100 text-[10px] font-semibold backdrop-blur-md truncate max-w-[65%] border border-white/10">
              <Layers className="h-2.5 w-2.5 text-[#5BAF56] shrink-0" />
              <span className="truncate">{noticia.igr_name}</span>
            </span>
          )}
        </>
      }
      footerLeft={noticia.author || noticia.category || "Observatório"}
      actionLabel="Ler mais"
    />
  );
}
