"use client";

import { useEffect } from "react";
import { X, Calendar, MapPin, Layers, Sparkles, User, Tag, Newspaper } from "lucide-react";
import { RichTextContent } from "@/components/RichTextContent";
import { ImageGalleryCarousel } from "@/components/ImageGalleryCarousel";
import { ShareButton } from "@/components/ShareButton";
import { formatarDataHoraCurta } from "@/lib/formatters";

interface NoticiaModalProps {
  noticia: ApiNoticia | null;
  onClose: () => void;
}

export function NoticiaModal({ noticia, onClose }: NoticiaModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (noticia) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [noticia]);

  if (!noticia) return null;

  const formatDate = formatarDataHoraCurta;
  const sharePath = `/noticias?id=${encodeURIComponent(String(noticia.id))}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-[96vw] xl:max-w-[1440px] max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200 border border-slate-200">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 text-white hover:bg-[#C90C0F] backdrop-blur-md transition-all shadow-lg focus:outline-none cursor-pointer"
          title="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Hero / Galeria de Imagens */}
        <ImageGalleryCarousel
          imagens={noticia.imagens}
          fallbackUrl={noticia.image}
          title={noticia.title}
          heightClass="h-60 sm:h-80 lg:h-96"
          fallbackIcon={<Newspaper className="h-16 w-16 text-white/40 mb-2" />}
          fallbackSubtitle={noticia.category || "Observatório Regional"}
        >
          {/* Badges de Destaque / Categoria sobre o banner */}
          <div className="absolute bottom-4 left-4 right-4 sm:left-8 sm:right-8 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
            {noticia.is_featured && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#C90C0F] text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                <Sparkles className="h-3.5 w-3.5" /> Destaque
              </span>
            )}
            {noticia.cidade_name && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-emerald-300 text-xs font-bold border border-white/10">
                <MapPin className="h-3 w-3 text-[#C90C0F]" /> {noticia.cidade_name}
              </span>
            )}
            {noticia.igr_name && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-emerald-200 text-xs font-semibold border border-white/10">
                <Layers className="h-3 w-3 text-[#359830]" /> {noticia.igr_name}
              </span>
            )}
          </div>
        </ImageGalleryCarousel>

        {/* Conteúdo Rolável do Artigo */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          {/* Metadados: Data e Autor */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <Calendar className="h-4 w-4 text-[#359830]" />
                {formatDate(noticia.published_at)}
              </span>
              {noticia.author && (
                <span className="flex items-center gap-1.5 text-slate-600">
                  <User className="h-4 w-4 text-slate-400" />
                  {noticia.author}
                </span>
              )}
            </div>

            <ShareButton path={sharePath} />
          </div>

          {/* Título Principal */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 leading-snug">
            {noticia.title}
          </h1>

          {/* Resumo / Lead */}
          {noticia.summary && (
            <p className="text-sm sm:text-base font-medium text-slate-700 leading-relaxed bg-[#EAF4E9]/60 p-4 rounded-2xl border-l-4 border-[#359830]">
              {noticia.summary}
            </p>
          )}

          {/* Corpo do Texto */}
          <RichTextContent html={noticia.content || noticia.summary} className="text-justify" />

          {/* Tags */}
          {noticia.tags && noticia.tags.length > 0 && (
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> Tags:
              </span>
              {noticia.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Observatório Regional do Turismo</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#359830] text-white font-bold rounded-xl hover:bg-[#1D5C1B] transition-colors"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}
