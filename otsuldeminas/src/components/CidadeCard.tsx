"use client";

import { Layers, MapPin, Newspaper } from "lucide-react";
import { StandardEntityCard } from "@/components/StandardEntityCard";
import { getCoverImage, stripHtml } from "@/lib/utils";

interface CidadeCardProps {
  cidade: ApiCidade;
  noticiasCount?: number;
  onSelect?: (cidade: ApiCidade) => void;
}

export function CidadeCard({ cidade, noticiasCount = 0, onSelect }: CidadeCardProps) {
  const coverImage = getCoverImage(cidade.imagens);
  const shortDesc =
    stripHtml(cidade.description) ||
    (cidade.igr_name
      ? `Integrante de ${cidade.igr_name}. Consulte indicadores socioeconômicos e turísticos.`
      : "Consulte indicadores socioeconômicos, demográficos e agenda turística do município.");

  return (
    <StandardEntityCard
      title={cidade.name}
      description={shortDesc}
      imageUrl={coverImage}
      imageAlt={cidade.name}
      fallbackIcon={<MapPin className="h-5 w-5" />}
      fallbackLabel={cidade.name}
      onClick={onSelect ? () => onSelect(cidade) : undefined}
      topLeftBadges={
        cidade.state_name ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md border border-white/10">
            <MapPin className="h-2.5 w-2.5 text-emerald-300 shrink-0" />
            {cidade.state_name}
          </span>
        ) : undefined
      }
      topRightBadge={
        noticiasCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] font-bold text-emerald-200 backdrop-blur-md">
            <Newspaper className="h-2.5 w-2.5" />
            {noticiasCount} {noticiasCount === 1 ? "notícia" : "notícias"}
          </span>
        ) : undefined
      }
      bottomOverlay={
        cidade.igr_name ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-semibold text-emerald-200 backdrop-blur-md max-w-full truncate border border-white/10">
            <Layers className="h-2.5 w-2.5 text-[#5BAF56] shrink-0" />
            <span className="truncate">{cidade.igr_name}</span>
          </span>
        ) : undefined
      }
      footerLeft={
        noticiasCount
          ? `${noticiasCount} ${noticiasCount === 1 ? "publicação" : "publicações"}`
          : cidade.ibge_code
            ? `IBGE ${cidade.ibge_code}`
            : "Indicadores"
      }
      actionLabel="Ver detalhes"
    />
  );
}
