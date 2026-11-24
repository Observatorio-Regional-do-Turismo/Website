"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Star } from "lucide-react";

interface ImageGalleryCarouselProps {
  imagens?: ApiImages[] | null;
  fallbackUrl?: string | null;
  title: string;
  heightClass?: string;
  fallbackIcon?: React.ReactNode;
  fallbackSubtitle?: string;
  showThumbnails?: boolean;
  children?: React.ReactNode;
}

export function ImageGalleryCarousel({
  imagens,
  fallbackUrl,
  title,
  heightClass = "h-64 sm:h-80 lg:h-96",
  fallbackIcon,
  fallbackSubtitle = "Observatório Regional do Turismo",
  showThumbnails = true,
  children,
}: ImageGalleryCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  const images = useMemo(() => {
    const items: {
      id: string | number;
      image: string;
      alt_text?: string;
      caption?: string;
      is_cover?: boolean;
    }[] = [];

    if (imagens && Array.isArray(imagens) && imagens.length > 0) {
      const sorted = [...imagens].sort((a, b) => {
        const coverDiff = (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0);
        if (coverDiff !== 0) return coverDiff;
        const orderDiff = (a.order ?? 0) - (b.order ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return Number(a.id) - Number(b.id);
      });
      for (const img of sorted) {
        if (img.image) {
          items.push({
            id: img.id,
            image: img.image,
            alt_text: img.alt_text,
            caption: img.caption,
            is_cover: img.is_cover,
          });
        }
      }
    }

    if (items.length === 0 && fallbackUrl) {
      items.push({
        id: "fallback",
        image: fallbackUrl,
        alt_text: title,
        is_cover: true,
      });
    }

    return items;
  }, [imagens, fallbackUrl, title]);

  useEffect(() => {
    setSelectedIndex(0);
    setFailedUrls({});
  }, [title, images.length]);

  const safeIndex = images.length > 0 ? Math.min(selectedIndex, images.length - 1) : 0;
  const current = images[safeIndex];
  const canShowImage = Boolean(current && !failedUrls[current.image]);

  const handlePrev = () => {
    if (images.length <= 1) return;
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (images.length <= 1) return;
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-full shrink-0 bg-slate-900">
      <div className={`relative w-full ${heightClass} overflow-hidden bg-slate-900`}>
        {canShowImage && current ? (
          <img
            src={current.image}
            alt={current.alt_text || title}
            className="w-full h-full object-cover object-center transition-all duration-300"
            onError={() =>
              setFailedUrls((prev) => ({
                ...prev,
                [current.image]: true,
              }))
            }
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1D5C1B] via-[#236921] to-[#113d10] text-white p-6 text-center">
            {fallbackIcon || <ImageIcon className="h-14 w-14 text-white/40 mb-2" />}
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-200 mt-1">
              {fallbackSubtitle}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent pointer-events-none" />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Imagem anterior"
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/55 hover:bg-black/80 text-white backdrop-blur-md transition-all shadow-lg cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Próxima imagem"
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/55 hover:bg-black/80 text-white backdrop-blur-md transition-all shadow-lg cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-md">
                {safeIndex + 1} / {images.length}
              </span>
              {current?.is_cover && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1D5C1B]/90 text-white text-xs font-semibold backdrop-blur-md">
                  <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                  Imagem principal
                </span>
              )}
            </div>
          </>
        )}

        {children}
      </div>

      {showThumbnails && images.length > 1 && (
        <div className="bg-slate-950/95 border-t border-slate-800 px-4 py-2.5 flex items-center gap-2.5 overflow-x-auto">
          {images.map((img, idx) => {
            const active = idx === safeIndex;
            return (
              <button
                key={`${img.id}-${idx}`}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative shrink-0 w-20 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  active
                    ? "border-emerald-400 ring-2 ring-emerald-400/40 opacity-100"
                    : "border-transparent opacity-65 hover:opacity-95"
                }`}
                title={img.caption || img.alt_text || `Foto ${idx + 1}`}
              >
                <img
                  src={img.image}
                  alt={img.alt_text || `${title} ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {img.is_cover && (
                  <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[#1D5C1B] flex items-center justify-center">
                    <Star className="h-2.5 w-2.5 fill-amber-300 text-amber-300" />
                  </span>
                )}
              </button>
            );
          })}
          {current?.caption && (
            <span className="ml-auto text-xs text-slate-300 truncate max-w-xs pl-2 hidden md:block">
              {current.caption}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
