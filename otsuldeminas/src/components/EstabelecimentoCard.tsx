"use client";

import Link from "next/link";
import {
  Building2,
  Compass,
  ExternalLink,
  Layers,
  MapPin,
  Phone,
  UtensilsCrossed,
} from "lucide-react";
import { Card } from "@/components/ui/card";

interface EstabelecimentoCardProps {
  local: ApiEstabelecimentoGeo;
}

export function EstabelecimentoCard({ local }: EstabelecimentoCardProps) {
  const catLower = local.categoria.toLowerCase();
  const isFood = catLower.includes("aliment");
  const isLodging = catLower.includes("hosped");

  const Icon = isFood ? UtensilsCrossed : isLodging ? Building2 : Compass;
  const badgeClasses = isFood
    ? "bg-orange-50 text-orange-800 border-orange-200"
    : isLodging
      ? "bg-blue-50 text-blue-800 border-blue-200"
      : "bg-emerald-50 text-emerald-800 border-emerald-200";
  const accentBg = isFood
    ? "from-orange-500 to-amber-600"
    : isLodging
      ? "from-blue-600 to-indigo-700"
      : "from-[#1D5C1B] to-[#2b7a29]";

  const lat = Number(local.latitude);
  const lon = Number(local.longitude);
  const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lon);

  return (
    <Card className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-200">
      <div
        className={`bg-gradient-to-r ${accentBg} px-5 py-4 text-white flex items-center justify-between gap-3`}
      >
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm">
            <Icon className="h-3 w-3" />
            {local.categoria}
          </span>
          <h3 className="text-base sm:text-lg font-extrabold leading-snug line-clamp-1 mt-1.5">
            {local.nome}
          </h3>
        </div>
        <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-2 text-xs sm:text-sm text-slate-600">
          <div className="flex flex-wrap items-center gap-1.5">
            {local.cidade_name && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${badgeClasses}`}
              >
                <MapPin className="h-3 w-3 shrink-0" />
                {local.cidade_name}
              </span>
            )}
            {local.igr_name && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                <Layers className="h-3 w-3 text-[#1D5C1B] shrink-0" />
                {local.igr_name}
              </span>
            )}
          </div>

          {local.endereco && (
            <p className="text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{local.endereco}</span>
            </p>
          )}

          {local.telefone && (
            <p className="text-xs font-semibold text-[#1D5C1B] flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>{local.telefone}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
          <Link
            href={
              local.cidade_slug ? `/mapa?cidade=${encodeURIComponent(local.cidade_slug)}` : "/mapa"
            }
            className="font-bold text-[#1D5C1B] hover:underline inline-flex items-center gap-1"
          >
            <MapPin className="h-3.5 w-3.5" />
            Ver no mapa
          </Link>
          {hasCoords && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
            >
              Google Maps
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
