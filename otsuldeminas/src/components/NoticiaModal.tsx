"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, Calendar, MapPin, Layers, Newspaper, User, Share2, Sparkles } from "lucide-react";

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

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const coverImage = (noticia.imagens && noticia.imagens.length > 0)
    ? (noticia.imagens.find((i) => i.is_cover)?.image || noticia.imagens[0]?.image)
    : (noticia.image || null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
      />

      {/* Container do Modal */}
      <div className="relative bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200 border border-slate-200">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md transition-all shadow-lg focus:outline-none"
          title="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Hero da Notícia */}
        {coverImage && (
          <div className="relative h-56 sm:h-72 w-full bg-slate-900 shrink-0 overflow-hidden">
            <img
              src={coverImage}
              alt={noticia.title}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
          </div>
        )}

        {/* Conteúdo da Notícia */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Metadados */}
          <div className="flex flex-wrap items-center gap-2">
            {noticia.is_featured && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#C90C0F] text-white font-bold text-xs uppercase tracking-wider shadow-sm">
                <Sparkles className="h-3.5 w-3.5" /> Destaque
              </span>
            )}
            {noticia.cidade_name && (
              <Link
                href={`/cidades?cidade=${encodeURIComponent(noticia.cidade_slug || noticia.cidade_name)}`}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs hover:bg-primary hover:text-white transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 text-[#C90C0F]" />
                {noticia.cidade_name}
              </Link>
            )}
            {noticia.igr_name && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs">
                <Layers className="h-3.5 w-3.5 text-primary" />
                {noticia.igr_name}
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {noticia.title}
          </h2>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pb-4 border-b border-slate-100">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              {formatDate(noticia.published_at)}
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <User className="h-3.5 w-3.5" />
              {noticia.author || "Redação Observatório Sul de Minas"}
            </span>
          </div>

          {/* Resumo */}
          <p className="text-base sm:text-lg font-medium text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border-l-4 border-primary">
            {noticia.summary}
          </p>

          {/* Texto Completo */}
          <div className="text-sm sm:text-base text-slate-600 leading-relaxed space-y-4 text-justify">
            <p>
              {noticia.content || noticia.summary}
            </p>
          </div>

          {/* Tags */}
          {noticia.tags && noticia.tags.length > 0 && (
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1">Tags:</span>
              {noticia.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
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
