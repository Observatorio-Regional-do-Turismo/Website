"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  X, 
  Building2, 
  MapPin, 
  Target, 
  Eye, 
  HeartHandshake, 
  ChevronRight, 
  Layers
} from "lucide-react";
import axios from "axios";

interface IGRDetalhesModalProps {
  igr: ApiIGR | null;
  cidades?: ApiCidade[];
  onClose: () => void;
}

export function IGRDetalhesModal({ igr, cidades = [], onClose }: IGRDetalhesModalProps) {
  const [imageError, setImageError] = useState(false);
  const [igrDetalhesApi, setIgrDetalhesApi] = useState<ApiIGR | null>(null);

  useEffect(() => {
    let active = true;
    setIgrDetalhesApi(null);

    if (!igr) return;

    const rawUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!rawUrl) return () => { active = false; };

    const baseUrl = rawUrl.trim().replace(/\/$/, "");
    axios.get<ApiIGR>(`${baseUrl}/igrs/${encodeURIComponent(igr.id)}/`)
      .catch(() => axios.get<ApiIGR>(`${baseUrl}/igr/${encodeURIComponent(igr.id)}/`))
      .then((response) => {
        if (active && response?.data) setIgrDetalhesApi(response.data);
      })
      .catch(() => {});

    return () => { active = false; };
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
      setImageError(false);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [igr]);

  if (!igr) return null;

  const currentIgr = igrDetalhesApi || igr;

  // Filtrar cidades associadas a esta IGR (por ID ou nome/slug)
  const memberCities = cidades.filter(c => {
    if (c.igr !== undefined && c.igr !== null) {
      return String(c.igr) === String(currentIgr.id) || String(c.igr) === String(currentIgr.slug);
    }
    return false;
  });

  const imagens = (currentIgr.imagens && Array.isArray(currentIgr.imagens) && currentIgr.imagens.length > 0)
    ? currentIgr.imagens
    : (igr.imagens && Array.isArray(igr.imagens) ? igr.imagens : []);

  const coverImage = imagens.length > 0
    ? (imagens.find(img => img.is_cover)?.image || imagens[0]?.image)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
      />

      {/* Container do Modal */}
      <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Botão Fechar Flutuante */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md transition-all shadow-lg focus:outline-none"
          title="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Hero do Modal */}
        <div className="relative h-48 sm:h-64 w-full bg-slate-900 shrink-0 overflow-hidden">
          {!imageError && coverImage ? (
            <img
              src={coverImage}
              alt={currentIgr.name}
              className="w-full h-full object-cover object-center brightness-95"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1D5C1B] to-[#287524] text-white">
              <Building2 className="h-14 w-14 text-white/40 mb-2" />
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-200">IGR</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          <div className="absolute bottom-5 left-5 right-5 z-20">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/80 text-white text-xs font-bold uppercase tracking-wider mb-2 backdrop-blur-md">
              <Layers className="h-3.5 w-3.5" />
              IGR
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              {currentIgr.name}
            </h2>
          </div>
        </div>

        {/* Conteúdo Rolável */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          
          {/* Descrição & Propósito */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">
              Introdução & Atuação da Entidade
            </h3>
            {(currentIgr.description?.trim() && currentIgr.description !== "string") ? (
              <div
                className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-600 sm:text-base"
                dangerouslySetInnerHTML={{ __html: currentIgr.description }}
              />
            ) : (
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                Informações detalhadas sobre esta IGR serão atualizadas em breve.
              </p>
            )}
          </div>

          {/* Missão, Visão e Valores (Eixos Estratégicos) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
                  <Target className="h-4 w-4 text-emerald-600" />
                  Missão
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Promover o desenvolvimento sustentável do turismo local integrando os setores público e privado para geração de renda e valorização do território.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#EAF4E9] border border-[#5BAF56]/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#359830] font-bold text-sm mb-2">
                  <Eye className="h-4 w-4 text-[#359830]" />
                  Visão
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Consolidar os destinos da região como referência em sustentabilidade, hospitalidade mineira e experiências turísticas de qualidade.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-red-50/60 border border-[#C90C0F]/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#C90C0F] font-bold text-sm mb-2">
                  <HeartHandshake className="h-4 w-4 text-[#C90C0F]" />
                  Valores
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sustentabilidade, cooperação intermunicipal, hospitalidade mineira, transparência e preservação cultural e ambiental.
                </p>
              </div>
            </div>
          </div>

          {/* Municípios Integrantes */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Municípios Integrantes
                </h3>
                <p className="text-xs text-slate-500">
                  Cidades associadas a esta IGR
                </p>
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
                    href={`/cidades?cidade=${encodeURIComponent(cidade.slug || cidade.name)}`}
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
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Observatório de Turismo do Sul de Minas Gerais</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>

    </div>
  );
}
