"use client";

import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  loading?: boolean;
  itemLabel?: string;
  onPageChange: (page: number) => void;
}

function getVisiblePages(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, idx) => idx + 1);
  }
  const pages: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("ellipsis");
  for (let p = start; p <= end; p += 1) {
    pages.push(p);
  }
  if (end < total - 1) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  loading = false,
  itemLabel = "itens",
  onPageChange,
}: PaginationControlsProps) {
  if (totalItems === 0 || totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <nav
      aria-label="Paginação"
      className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-xs"
    >
      <p className="text-xs font-semibold text-slate-600 flex items-center gap-2">
        {loading && <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[#359830]" />}
        <span>
          Exibindo <strong className="text-slate-900">{startItem}</strong>–
          <strong className="text-slate-900">{endItem}</strong> de{" "}
          <strong className="text-slate-900">{totalItems}</strong> {itemLabel}
        </span>
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          disabled={loading || currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Página anterior"
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-[#359830] hover:text-[#1D5C1B] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Anterior
        </button>

        {pages.map((entry, index) =>
          entry === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-xs font-bold text-slate-400 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              disabled={loading}
              onClick={() => onPageChange(entry)}
              aria-current={entry === currentPage ? "page" : undefined}
              className={`min-w-8 h-8 rounded-xl px-2.5 text-xs font-bold transition cursor-pointer disabled:opacity-60 ${
                entry === currentPage
                  ? "bg-[#1D5C1B] text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-[#359830] hover:text-[#1D5C1B]"
              }`}
            >
              {entry}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={loading || currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Próxima página"
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-[#359830] hover:text-[#1D5C1B] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
        >
          Próxima
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </nav>
  );
}
