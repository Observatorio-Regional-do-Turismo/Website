"use client";

import { useEffect, useState } from "react";
import { 
  X, 
  Calendar, 
  MapPin, 
  Layers, 
  Sparkles, 
  User, 
  Tag, 
  Share2, 
  Check, 
  Newspaper 
} from "lucide-react";

interface NoticiaModalProps {
  noticia: ApiNoticia | null;
  onClose: () => void;
}

export function NoticiaModal({ noticia, onClose }: NoticiaModalProps) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

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
      setImageError(false);
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
        hour: "2-digit",
        minute: "2-digit"
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const coverImage = (noticia.imagens && noticia.imagens.length > 0)
    ? (noticia.imagens.find((i) => i.is_cover)?.image || noticia.imagens[0]?.image)
    : (noticia.image || null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 text-white hover:bg-[#C90C0F] backdrop-blur-md transition-all shadow-lg focus:outline-none"
          title="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Hero / Imagem de Capa */}
        <div className="relative h-56 sm:h-72 w-full bg-slate-900 shrink-0 overflow-hidden">
          {!imageError && coverImage ? (
            <img
              src={coverImage}
              alt={noticia.title}
              className="w-full h-full object-cover object-center brightness-95"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1D5C1B] to-[#287524] text-white p-6 text-center">
              <Newspaper className="h-16 w-16 text-white/40 mb-2" />
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-200">
                {noticia.category || "Observatório Sul de Minas"}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Badges de Destaque / Categoria sobre o banner */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center gap-2">
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
        </div>

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

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Copiar link"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-[#359830]" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copied ? "Copiado!" : "Compartilhar"}</span>
            </button>
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
          <div className="prose prose-slate max-w-none text-sm sm:text-base text-slate-600 leading-relaxed">
            {noticia.content ? (
              <div className="text-justify" dangerouslySetInnerHTML={{ __html: noticia.content }} />
            ) : (
              <p className="text-justify">{noticia.summary}</p>
            )}
          </div>

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
          <span>Observatório de Turismo do Sul de Minas Gerais</span>
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
