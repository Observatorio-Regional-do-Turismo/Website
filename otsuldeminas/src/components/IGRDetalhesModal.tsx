"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Building2, MapPin, ChevronRight, Layers } from "lucide-react";
import axios from "axios";
import { RichTextContent } from "@/components/RichTextContent";
import { ImageGalleryCarousel } from "@/components/ImageGalleryCarousel";
import { ShareButton } from "@/components/ShareButton";

interface IGRDetalhesModalProps {
  igr: ApiIGR | null;
  cidades?: ApiCidade[];
  onClose: () => void;
}

export function IGRDetalhesModal({ igr, cidades = [], onClose }: IGRDetalhesModalProps) {
  const [igrDetalhesApi, setIgrDetalhesApi] = useState<ApiIGR | null>(null);

  useEffect(() => {
    let active = true;
    setIgrDetalhesApi(null);

    if (!igr) return;

    const rawUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!rawUrl)
      return () => {
        active = false;
      };

    const baseUrl = rawUrl.trim().replace(/\/$/, "");
    axios
      .get<ApiIGR>(`${baseUrl}/igrs/${encodeURIComponent(igr.id)}/`)
      .catch(() => axios.get<ApiIGR>(`${baseUrl}/igr/${encodeURIComponent(igr.id)}/`))
      .then((response) => {
        if (active && response?.data) setIgrDetalhesApi(response.data);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [igr]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (igr) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [igr]);

  if (!igr) return null;

  const currentIgr = igrDetalhesApi || igr;

  // Filtrar cidades associadas a esta IGR (suporta múltiplas IGRs por cidade)
  const memberCities = cidades.filter((c) => {
    if (Array.isArray(c.igrs) && c.igrs.length > 0) {
      return c.igrs.some(
        (i) => String(i.id) === String(currentIgr.id) || i.slug === currentIgr.slug,
      );
    }
    if (c.igr !== undefined && c.igr !== null) {
      return String(c.igr) === String(currentIgr.id) || String(c.igr) === String(currentIgr.slug);
    }
    return false;
  });

  const galleryImages =
    currentIgr.imagens && currentIgr.imagens.length > 0 ? currentIgr.imagens : igr.imagens;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Container do Modal */}
      <div className="relative bg-white w-full max-w-[96vw] xl:max-w-[1440px] max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200 border border-slate-200">
        {/* Botão Fechar Flutuante */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md transition-all shadow-lg focus:outline-none cursor-pointer"
          title="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Hero + Galeria do Modal */}
        <ImageGalleryCarousel
          imagens={galleryImages}
          title={currentIgr.name}
          heightClass="h-56 sm:h-72 lg:h-80"
          fallbackIcon={<Building2 className="h-14 w-14 text-white/40 mb-2" />}
          fallbackSubtitle="Instância de Governança Regional"
        >
          <div className="absolute bottom-5 left-5 right-5 sm:left-8 sm:right-8 z-20 pointer-events-none">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/80 text-white text-xs font-bold uppercase tracking-wider mb-2 backdrop-blur-md">
              <Layers className="h-3.5 w-3.5" />
              IGR
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
              {currentIgr.name}
            </h2>
          </div>
        </ImageGalleryCarousel>

        {/* Conteúdo Rolável */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          {/* Descrição & Propósito */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">Introdução & Atuação da Entidade</h3>
            <RichTextContent
              html={currentIgr.description}
              fallback="Informações detalhadas sobre esta IGR serão atualizadas em breve."
            />
          </div>

          {/* Municípios Integrantes */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Municípios Integrantes</h3>
                <p className="text-xs text-slate-500">Cidades associadas a esta IGR</p>
              </div>
              {memberCities.length > 0 && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  {memberCities.length} {memberCities.length === 1 ? "município" : "municípios"}
                </span>
              )}
            </div>

            {memberCities.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                Consulte a página de municípios para visualizar as cidades integradas a esta IGR.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {memberCities.map((cidade) => (
                  <Link
                    key={cidade.id || cidade.slug}
                    href={`/cidades/${encodeURIComponent(cidade.slug || String(cidade.id))}`}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-primary/40 hover:shadow-sm transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="h-4 w-4 text-[#C90C0F] shrink-0" />
                      <span className="text-xs font-bold text-slate-800 group-hover:text-primary transition-colors truncate">
                        {cidade.name}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-primary shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer do Modal */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <ShareButton path={`/selos?id=${currentIgr.id}`} />
            <span className="hidden sm:inline">Observatório Regional do Turismo</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
