import { useState } from "react";
import { MapPin, ArrowRight } from "lucide-react";

interface CidadeCardProps {
  cidade: ApiCidade;
  onSelect?: (cidade: ApiCidade) => void;
}

export function CidadeCard({ cidade, onSelect }: CidadeCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSelect) {
      onSelect(cidade);
    }
  };

  // Safe checks for cover image
  const coverImage = (cidade.imagens && Array.isArray(cidade.imagens) && cidade.imagens.length > 0)
    ? (cidade.imagens.find(img => img.is_cover)?.image || cidade.imagens[0]?.image)
    : null;

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (onSelect) onSelect(cidade);
        }
      }}
      className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#359830]/50 transition-all duration-300 flex flex-col overflow-hidden text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#359830]/40 relative"
    >
      {/* Imagem da Cidade */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        {!imageError && coverImage ? (
          <img
            src={coverImage}
            alt={cidade.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#EAF4E9] via-white to-[#EAF4E9] text-slate-400 group-hover:bg-[#EAF4E9] transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#359830]/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <MapPin className="h-6 w-6 text-[#359830]" />
            </div>
            <span className="text-xs font-semibold text-slate-600">{cidade.name}</span>
          </div>
        )}

        {/* Gradiente sutil */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/10 pointer-events-none" />

        {/* Nome sobreposto no rodapé da imagem */}
        <div className="absolute bottom-3 left-3.5 right-3.5 z-10">
          <h3 className="font-extrabold text-white text-lg sm:text-xl tracking-tight leading-snug drop-shadow-md group-hover:text-emerald-200 transition-colors line-clamp-1">
            {cidade.name}
          </h3>
        </div>
      </div>

      {/* Rodapé do Card */}
      <div className="p-3.5 sm:p-4 flex items-center justify-end bg-white border-t border-slate-100">
        <span className="inline-flex items-center text-xs font-bold text-[#359830] group-hover:text-[#C90C0F] gap-1 transition-colors">
          Ver detalhes
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1 text-[#C90C0F]" />
        </span>
      </div>
    </div>
  );
}
