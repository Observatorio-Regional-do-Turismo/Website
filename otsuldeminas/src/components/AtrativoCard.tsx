"use client";

import Link from "next/link";
import { Compass, MapPin, Sparkles, ArrowUpRight, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getCoverImage, stripHtml } from "@/lib/utils";

interface AtrativoCardProps {
  atrativo: ApiPontoTuristico;
  onSelect: (atrativo: ApiPontoTuristico) => void;
  featuredBadge?: boolean;
}

export function AtrativoCard({ atrativo, onSelect, featuredBadge = false }: AtrativoCardProps) {
  const coverImage = getCoverImage(atrativo.imagens);
  const summary = stripHtml(atrativo.description);
  const imagesCount = atrativo.imagens?.length ?? 0;

  return (
    <Card className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-emerald-300/80 transition-all duration-300">
      <button
        type="button"
        onClick={() => onSelect(atrativo)}
        className="relative h-52 w-full bg-slate-100 overflow-hidden text-left cursor-pointer"
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt={atrativo.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1D5C1B] to-[#2b7a29] text-white p-6">
            <Compass className="h-12 w-12 text-white/50 mb-2" />
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-100">
              Atrativo Turístico
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          {(featuredBadge || atrativo.is_featured) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-bold shadow-sm">
              <Sparkles className="h-3 w-3" />
              Destaque
            </span>
          )}
          {atrativo.category && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-black/55 text-white text-[11px] font-medium backdrop-blur-sm">
              {atrativo.category}
            </span>
          )}
        </div>

        {imagesCount > 1 && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 text-white text-[11px] font-medium backdrop-blur-sm">
            {imagesCount} fotos
          </span>
        )}

        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="text-lg font-bold leading-snug line-clamp-1 group-hover:text-emerald-200 transition-colors">
            {atrativo.name}
          </h3>
          {atrativo.cidade_name && (
            <p className="text-xs text-slate-200 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
              {atrativo.cidade_name}
              {atrativo.cidade_state_name ? ` — ${atrativo.cidade_state_name}` : ""}
            </p>
          )}
        </div>
      </button>

      <div className="p-4 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2">
          {atrativo.igr_name && (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1D5C1B] bg-emerald-50 px-2.5 py-0.5 rounded-full">
              <Layers className="h-3 w-3" />
              {atrativo.igr_name}
            </div>
          )}
          <p className="text-sm text-slate-600 line-clamp-3">
            {summary || "Ponto turístico integrante do inventário regional do observatório."}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
          <button
            type="button"
            onClick={() => onSelect(atrativo)}
            className="text-xs font-bold text-[#1D5C1B] hover:text-[#144212] transition-colors cursor-pointer"
          >
            Visualização rápida
          </button>
          <Link
            href={`/atrativos/${encodeURIComponent(atrativo.slug)}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#1D5C1B] transition-colors"
          >
            Página completa
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
