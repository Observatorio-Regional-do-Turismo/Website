"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import type { Cidade } from "@/data/cidades";

interface CidadeCardProps {
  cidade: Cidade;
  onSelect?: (cidade: Cidade) => void;
}

export function CidadeCard({ cidade, onSelect }: CidadeCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSelect) {
      onSelect(cidade);
    }
  };

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
      className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col overflow-hidden text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      {/* Imagem da Cidade */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        {!imageError && cidade.imagem ? (
          <img
            src={cidade.imagem}
            alt={`Fotografia turística de ${cidade.nome}`}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          /* Placeholder visual elegante quando a imagem ainda não foi adicionada */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-primary/5 to-primary/10 text-slate-400 group-hover:bg-primary/15 transition-colors">
            <MapPin className="h-8 w-8 text-primary/40 mb-1 group-hover:text-primary transition-colors" />
            <span className="text-xs font-medium text-slate-500">{cidade.nome}</span>
          </div>
        )}
      </div>

      {/* Conteúdo do Card */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 gap-2">
        <h3 className="font-bold text-slate-800 text-base sm:text-lg group-hover:text-primary transition-colors line-clamp-1">
          {cidade.nome}
        </h3>
        
        <div className="pt-1">
          <span className="inline-flex items-center text-sm font-medium text-primary group-hover:text-secondary gap-1 group-hover:gap-1.5 transition-all">
            Ver cidade
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </span>
        </div>
      </div>
    </div>
  );
}
