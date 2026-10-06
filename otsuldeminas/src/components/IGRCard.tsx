import { useState } from "react";
import { Building2, ArrowRight, Newspaper } from "lucide-react";

interface IGRCardProps {
  igr: ApiIGR;
  noticiasCount?: number;
  onSelect?: (igr: ApiIGR) => void;
}

export function IGRCard({ igr, noticiasCount = 0, onSelect }: IGRCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSelect) {
      onSelect(igr);
    }
  };

  // Imagem de capa
  const coverImage = (igr.imagens && Array.isArray(igr.imagens) && igr.imagens.length > 0)
    ? (igr.imagens.find(img => img.is_cover)?.image || igr.imagens[0]?.image)
    : null;

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (onSelect) onSelect(igr);
        }
      }}
      className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#359830]/50 transition-all duration-300 flex flex-col overflow-hidden text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#359830]/40 relative"
    >
      {/* Imagem da IGR */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        {!imageError && coverImage ? (
          <img
            src={coverImage}
            alt={igr.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#EAF4E9] via-white to-[#EAF4E9] text-slate-400 group-hover:bg-[#EAF4E9] transition-colors p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#359830]/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Building2 className="h-6 w-6 text-[#359830]" />
            </div>
            <span className="text-xs font-semibold text-slate-600 line-clamp-1">{igr.name}</span>
          </div>
        )}

        {/* Gradiente sutil */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/20 to-transparent pointer-events-none" />

        {/* Badge de Notícias Relacionadas no topo */}
        {noticiasCount > 0 && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-emerald-300 font-bold text-[10px] backdrop-blur-md border border-white/10 shadow-sm">
              <Newspaper className="h-3 w-3 text-emerald-400" />
              {noticiasCount} {noticiasCount === 1 ? "notícia" : "notícias"}
            </span>
          </div>
        )}

        {/* Nome sobreposto no rodapé da imagem */}
        <div className="absolute bottom-3 left-3.5 right-3.5 z-10">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-emerald-300 backdrop-blur-sm mb-1">
            IGR
          </span>
          <h3 className="font-extrabold text-white text-lg sm:text-xl tracking-tight leading-snug drop-shadow-md group-hover:text-emerald-200 transition-colors line-clamp-2">
            {igr.name}
          </h3>
        </div>
      </div>

      {/* Descrição resumida da IGR se houver */}
      {igr.description && (
        <div className="px-4 pt-3 pb-1 flex-1">
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {igr.description}
          </p>
        </div>
      )}

      {/* Rodapé do Card */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between bg-white border-t border-slate-100 mt-auto">
        <span className="text-[11px] font-semibold text-slate-400">
          {noticiasCount > 0 ? `${noticiasCount} publ.` : "Governança"}
        </span>
        <span className="inline-flex items-center text-xs font-bold text-[#359830] group-hover:text-[#C90C0F] gap-1 transition-colors">
          Ver detalhes
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1 text-[#C90C0F]" />
        </span>
      </div>
    </div>
  );
}
