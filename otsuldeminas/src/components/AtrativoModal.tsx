"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  X,
  Compass,
  MapPin,
  Layers,
  Sparkles,
  ExternalLink,
  Phone,
  Mail,
  Globe,
  Building2,
  ArrowUpRight,
} from "lucide-react";
import { getWebsiteApiBaseUrl } from "@/lib/website-api";
import { RichTextContent } from "@/components/RichTextContent";
import { ImageGalleryCarousel } from "@/components/ImageGalleryCarousel";
import { ShareButton } from "@/components/ShareButton";

interface AtrativoModalProps {
  atrativo: ApiPontoTuristico | null;
  onClose: () => void;
}

export function AtrativoModal({ atrativo, onClose }: AtrativoModalProps) {
  const [detalhesApi, setDetalhesApi] = useState<ApiPontoTuristico | null>(null);

  useEffect(() => {
    let active = true;
    setDetalhesApi(null);

    if (!atrativo?.id) return;

    try {
      const baseUrl = getWebsiteApiBaseUrl();
      axios
        .get<ApiPontoTuristico>(`${baseUrl}/pontos-turisticos/${encodeURIComponent(atrativo.id)}/`)
        .then((res) => {
          if (active && res?.data) setDetalhesApi(res.data);
        })
        .catch(() => {});
    } catch {
      // ignora erro de URL base
    }

    return () => {
      active = false;
    };
  }, [atrativo?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (atrativo) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [atrativo]);

  const current = detalhesApi || atrativo;
  if (!current) return null;

  const latitude =
    current.latitude !== undefined && current.latitude !== null ? Number(current.latitude) : null;
  const longitude =
    current.longitude !== undefined && current.longitude !== null
      ? Number(current.longitude)
      : null;
  const hasCoordinates =
    latitude !== null && longitude !== null && !Number.isNaN(latitude) && !Number.isNaN(longitude);

  const locationContact = current.contatos?.find((c) => c.type === "location");
  const otherContacts = (current.contatos || []).filter((c) => c.type !== "location");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-[96vw] xl:max-w-[1440px] max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200 border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 text-white hover:bg-[#C90C0F] backdrop-blur-md transition-all shadow-lg focus:outline-none cursor-pointer"
          title="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <ImageGalleryCarousel
          imagens={current.imagens}
          title={current.name}
          heightClass="h-64 sm:h-80 lg:h-[400px]"
          fallbackIcon={<Compass className="h-14 w-14 text-white/40 mb-2" />}
          fallbackSubtitle={current.category || "Atrativo Turístico"}
        >
          <div className="absolute bottom-4 left-5 right-5 sm:bottom-6 sm:left-8 sm:right-8 text-white pointer-events-none">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {current.is_featured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-bold shadow-sm">
                  <Sparkles className="h-3 w-3" />
                  Principal Atrativo
                </span>
              )}
              {current.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-600/90 text-white text-xs font-semibold shadow-sm backdrop-blur-sm">
                  {current.category}
                </span>
              )}
              {current.cidade_name && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-xs font-medium backdrop-blur-sm">
                  <MapPin className="h-3 w-3 text-emerald-300" />
                  {current.cidade_name}
                </span>
              )}
              {current.igr_name && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-xs font-medium backdrop-blur-sm">
                  <Layers className="h-3 w-3 text-emerald-300" />
                  {current.igr_name}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
              {current.name}
            </h2>
          </div>
        </ImageGalleryCarousel>

        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white space-y-6">
          {current.description && (
            <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-5 sm:p-6">
              <RichTextContent
                html={current.description}
                className="text-slate-700 leading-relaxed"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#1D5C1B]" />
                Localização
              </p>
              <p className="text-sm font-medium text-slate-800">
                {locationContact?.value ||
                  locationContact?.label ||
                  (current.cidade_name
                    ? `${current.cidade_name} — Minas Gerais`
                    : "Região do Observatório")}
              </p>
              {hasCoordinates && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D5C1B] hover:underline pt-1"
                >
                  Abrir no Google Maps
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            {otherContacts.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Contatos e Informações
                </p>
                <div className="space-y-1.5">
                  {otherContacts.map((contato) => {
                    const icon =
                      contato.type === "phone" || contato.type === "whatsapp" ? (
                        <Phone className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                      ) : contato.type === "email" ? (
                        <Mail className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                      ) : (
                        <Globe className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                      );
                    return (
                      <div
                        key={contato.id}
                        className="flex items-center gap-2 text-xs text-slate-700"
                      >
                        {icon}
                        <span className="font-semibold">
                          {contato.label || contato.type_display}:
                        </span>
                        <span className="truncate">{contato.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <ShareButton path={`/atrativos?id=${current.id}`} />
            <Link
              href={`/atrativos/${encodeURIComponent(current.slug)}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#1D5C1B] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              Ver página do atrativo
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            {current.cidade_slug && (
              <Link
                href={`/cidades/${encodeURIComponent(current.cidade_slug)}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <Building2 className="h-4 w-4 text-[#1D5C1B]" />
                Página de {current.cidade_name}
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
