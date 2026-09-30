"use client";

import { useState } from "react";
import { Newspaper, Calendar, MapPin, Layers, Sparkles, ArrowRight, ExternalLink } from "lucide-react";

interface NoticiaCardProps {
  noticia: ApiNoticia;
  showCityBadge?: boolean;
  showIgrBadge?: boolean;
  variant?: "featured" | "standard" | "compact";
  onSelect?: (noticia: ApiNoticia) => void;
  onClick?: (noticia: ApiNoticia) => void;
}

export function NoticiaCard({
  noticia,
  showCityBadge = true,
  showIgrBadge = true,
  variant = "standard",
  onSelect,
  onClick,
}: NoticiaCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleCardClick = () => {
    if (onClick) onClick(noticia);
    else if (onSelect) onSelect(noticia);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const coverImage = (noticia.imagens && noticia.imagens.length > 0)
    ? (noticia.imagens.find((i) => i.is_cover)?.image || noticia.imagens[0]?.image)
    : (noticia.image || null);

  if (variant === "compact") {
    return (
      <div
        onClick={handleCardClick}
        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#359830]/50 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-semibold text-primary">
              <Calendar className="h-3 w-3" />
              {formatDate(noticia.published_at)}
            </span>
            {noticia.is_featured && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-[#C90C0F] font-bold text-[10px] border border-[#C90C0F]/20">
                <Sparkles className="h-2.5 w-2.5" /> Destaque
              </span>
            )}
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-2">
            {noticia.title}
          </h4>
        </div>

        {showCityBadge && noticia.cidade_name && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1 text-slate-600 font-medium truncate">
              <MapPin className="h-3 w-3 text-[#C90C0F] shrink-0" />
              {noticia.cidade_name}
            </span>
            <span className="text-primary font-bold">Ler &rarr;</span>
          </div>
        )}
      </div>
    );
  }

  const isFeaturedVariant = variant === "featured" || noticia.is_featured;

  return (
    <div
      onClick={handleCardClick}
      className={`group bg-white rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden text-left relative cursor-pointer ${
        isFeaturedVariant
          ? "border-emerald-200 shadow-md hover:shadow-xl hover:border-primary"
          : "border-slate-200 shadow-sm hover:shadow-lg hover:border-[#359830]/40"
      }`}
    >
      {/* Imagem */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        {!imageError && coverImage ? (
          <img
            src={coverImage}
            alt={noticia.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#EAF4E9] via-white to-[#EAF4E9] text-slate-400 p-4">
            <Newspaper className="h-8 w-8 text-[#359830]/40 mb-1" />
            <span className="text-xs font-semibold text-slate-500 line-clamp-1">{noticia.category || "Notícia"}</span>
          </div>
        )}

        {/* Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/10 pointer-events-none" />

        {/* Badges de topo */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          {noticia.is_featured ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C90C0F] text-white font-bold text-[10px] uppercase tracking-wider shadow-md">
              <Sparkles className="h-3 w-3" /> Destaque
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 text-white font-semibold text-[10px] backdrop-blur-md">
              {noticia.category || "Observatório"}
            </span>
          )}

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 text-slate-800 text-[11px] font-semibold backdrop-blur-md shadow-sm">
            <Calendar className="h-3 w-3 text-primary" />
            {formatDate(noticia.published_at)}
          </span>
        </div>

        {/* Cidades e IGRs sobrepostas na imagem */}
        <div className="absolute bottom-2.5 left-3 right-3 flex flex-wrap gap-1.5 z-10">
          {showCityBadge && noticia.cidade_name && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 text-emerald-300 text-[10px] font-bold backdrop-blur-sm">
              <MapPin className="h-2.5 w-2.5 text-[#C90C0F]" />
              {noticia.cidade_name}
            </span>
          )}
          {showIgrBadge && noticia.igr_name && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 text-emerald-200 text-[10px] font-semibold backdrop-blur-sm">
              <Layers className="h-2.5 w-2.5 text-primary" />
              {noticia.igr_name}
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo textual */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 group-hover:text-primary transition-colors leading-snug line-clamp-2 mb-2">
            {noticia.title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
            {noticia.summary}
          </p>
        </div>

        {/* Rodapé do Card */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span className="text-[11px] text-slate-400">
            {noticia.author || "Redação Observatório"}
          </span>
          <span className="inline-flex items-center gap-1 text-primary group-hover:text-[#C90C0F] transition-colors">
            Ler mais
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </div>
  );
}
