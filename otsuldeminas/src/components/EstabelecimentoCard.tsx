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
import { StandardEntityCard } from "@/components/StandardEntityCard";
import { getCoverImage } from "@/lib/utils";

interface EstabelecimentoCardProps {
  local: ApiEstabelecimentoGeo;
}

export function EstabelecimentoCard({ local }: EstabelecimentoCardProps) {
  const catLower = local.categoria.toLowerCase();
  const isFood = catLower.includes("aliment");
  const isLodging = catLower.includes("hosped");
  const Icon = isFood ? UtensilsCrossed : isLodging ? Building2 : Compass;
  const coverImage = getCoverImage(local.imagens);

  const badgeColor = isFood
    ? "bg-orange-600/90 text-white"
    : isLodging
      ? "bg-blue-700/90 text-white"
      : "bg-[#1D5C1B]/90 text-white";

  const lat = Number(local.latitude);
  const lon = Number(local.longitude);
  const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lon);

  const descriptionParts = [local.endereco, local.telefone].filter(Boolean);
  const shortDescription =
    descriptionParts.join(" • ") ||
    `${local.categoria} georreferenciado em ${local.cidade_name || "Sul de Minas"}.`;

  return (
    <StandardEntityCard
      title={local.nome}
      description={shortDescription}
      imageUrl={coverImage}
      imageAlt={local.nome}
      fallbackIcon={<Icon className="h-5 w-5" />}
      fallbackLabel={local.categoria}
      topLeftBadges={
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs backdrop-blur-sm ${badgeColor}`}
        >
          <Icon className="h-2.5 w-2.5" />
          {local.categoria}
        </span>
      }
      topRightBadge={
        local.telefone ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 text-[#1D5C1B] text-[10px] font-bold shadow-xs">
            <Phone className="h-2.5 w-2.5 shrink-0" />
            {local.telefone}
          </span>
        ) : undefined
      }
      bottomOverlay={
        <>
          {local.cidade_name && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/65 text-emerald-200 text-[10px] font-bold backdrop-blur-md max-w-[70%] truncate border border-white/10">
              <MapPin className="h-2.5 w-2.5 text-[#C90C0F] shrink-0" />
              <span className="truncate">{local.cidade_name}</span>
            </span>
          )}
          {local.igr_name && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/65 text-emerald-100 text-[10px] font-semibold backdrop-blur-md max-w-[60%] truncate border border-white/10">
              <Layers className="h-2.5 w-2.5 text-[#5BAF56] shrink-0" />
              <span className="truncate">{local.igr_name}</span>
            </span>
          )}
        </>
      }
      footerLeft={
        <Link
          href={
            local.cidade_slug ? `/mapa?cidade=${encodeURIComponent(local.cidade_slug)}` : "/mapa"
          }
          className="font-bold text-[#1D5C1B] hover:underline inline-flex items-center gap-1 text-xs"
        >
          <MapPin className="h-3 w-3" />
          Ver no mapa
        </Link>
      }
      footerRight={
        hasCoords ? (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 text-xs shrink-0"
          >
            Maps
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-[11px] font-semibold text-slate-400">Local</span>
        )
      }
    />
  );
}
