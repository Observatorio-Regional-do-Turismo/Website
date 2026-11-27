"use client";

import { Building2, Layers } from "lucide-react";
import { StandardEntityCard } from "@/components/StandardEntityCard";
import { getCoverImage, stripHtml } from "@/lib/utils";

interface IGRCardProps {
  igr: ApiIGR;
  cidadesCount?: number;
  onSelect?: (igr: ApiIGR) => void;
}

export function IGRCard({ igr, cidadesCount, onSelect }: IGRCardProps) {
  const coverImage = getCoverImage(igr.imagens);
  const shortDesc =
    stripHtml(igr.description) ||
    "Instância de Governança Regional voltada à coordenação e fortalecimento do turismo regional.";

  return (
    <StandardEntityCard
      title={igr.name}
      description={shortDesc}
      imageUrl={coverImage}
      imageAlt={igr.name}
      fallbackIcon={<Building2 className="h-5 w-5" />}
      fallbackLabel={igr.name}
      onClick={onSelect ? () => onSelect(igr) : undefined}
      topLeftBadges={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#1D5C1B]/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm shadow-xs">
          <Layers className="h-2.5 w-2.5 text-emerald-200" />
          IGR
        </span>
      }
      topRightBadge={
        typeof cidadesCount === "number" && cidadesCount > 0 ? (
          <span className="inline-flex items-center rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-emerald-200 backdrop-blur-md border border-white/10">
            {cidadesCount} {cidadesCount === 1 ? "cidade" : "cidades"}
          </span>
        ) : undefined
      }
      footerLeft="Governança Regional"
      actionLabel="Ver detalhes"
    />
  );
}
