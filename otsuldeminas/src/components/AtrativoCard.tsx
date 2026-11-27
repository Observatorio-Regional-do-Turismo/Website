"use client";

import Link from "next/link";
import { ArrowUpRight, Compass, Layers, MapPin, Sparkles } from "lucide-react";
import { StandardEntityCard } from "@/components/StandardEntityCard";
import { getCoverImage, stripHtml } from "@/lib/utils";

interface AtrativoCardProps {
  atrativo: ApiPontoTuristico;
  onSelect: (atrativo: ApiPontoTuristico) => void;
  featuredBadge?: boolean;
}

export function AtrativoCard({ atrativo, onSelect, featuredBadge = false }: AtrativoCardProps) {
  const coverImage = getCoverImage(atrativo.imagens);
  const summary =
    stripHtml(atrativo.description) ||
    "Ponto turístico integrante do inventário regional do observatório.";
  const imagesCount = atrativo.imagens?.length ?? 0;

  return (
    <StandardEntityCard
      title={atrativo.name}
      description={summary}
      imageUrl={coverImage}
      imageAlt={atrativo.name}
      fallbackIcon={<Compass className="h-5 w-5" />}
      fallbackLabel="Atrativo Turístico"
      highlighted={Boolean(featuredBadge || atrativo.is_featured)}
      onClick={() => onSelect(atrativo)}
      topLeftBadges={
        <>
          {(featuredBadge || atrativo.is_featured) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold shadow-xs">
              <Sparkles className="h-2.5 w-2.5" />
              Destaque
            </span>
          )}
          {atrativo.category && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold backdrop-blur-md border border-white/10">
              {atrativo.category}
            </span>
          )}
        </>
      }
      topRightBadge={
        imagesCount > 1 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold backdrop-blur-md border border-white/10">
            {imagesCount} fotos
          </span>
        ) : undefined
      }
      bottomOverlay={
        <>
          {atrativo.cidade_name && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/65 text-emerald-200 text-[10px] font-bold backdrop-blur-md max-w-[70%] truncate border border-white/10">
              <MapPin className="h-2.5 w-2.5 text-[#C90C0F] shrink-0" />
              <span className="truncate">{atrativo.cidade_name}</span>
            </span>
          )}
          {atrativo.igr_name && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/65 text-emerald-100 text-[10px] font-semibold backdrop-blur-md max-w-[60%] truncate border border-white/10">
              <Layers className="h-2.5 w-2.5 text-[#5BAF56] shrink-0" />
              <span className="truncate">{atrativo.igr_name}</span>
            </span>
          )}
        </>
      }
      footerLeft={
        <span className="text-xs font-bold text-[#1D5C1B] group-hover:text-[#359830]">
          Ver detalhes
        </span>
      }
      footerRight={
        <Link
          href={`/atrativos/${encodeURIComponent(atrativo.slug)}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#1D5C1B] transition-colors shrink-0"
        >
          Página
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      }
    />
  );
}
