"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
import { formatExportDateBR } from "@/lib/export";

const FOCUS_RING_CLASS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700";

export interface ExportMenuProps {
  onExportCSV: () => boolean | void;
  onExportPNG: () => Promise<boolean> | boolean | void;
  disabledCSV?: boolean;
  disabledPNG?: boolean;
  label?: string;
  compact?: boolean;
}

export function ExportMenu({
  onExportCSV,
  onExportPNG,
  disabledCSV = false,
  disabledPNG = false,
  label,
  compact = false,
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportingPNG, setExportingPNG] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allDisabled = disabledCSV && disabledPNG;

  const showFeedback = (type: "success" | "error", message: string, durationMs = 2800) => {
    setFeedback({ type, message });
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), durationMs);
  };

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  const handleCSVClick = () => {
    if (disabledCSV) return;
    setIsOpen(false);
    try {
      const ok = onExportCSV();
      if (ok === false) {
        showFeedback("error", "Sem dados para exportar", 3200);
      } else {
        showFeedback("success", "Planilha CSV baixada!");
      }
    } catch {
      showFeedback("error", "Falha ao gerar CSV", 3500);
    }
  };

  const handlePNGClick = async () => {
    if (disabledPNG || exportingPNG) return;
    setIsOpen(false);
    setFeedback(null);
    setExportingPNG(true);
    try {
      const ok = await onExportPNG();
      if (ok === false) {
        showFeedback("error", "Falha ao gerar PNG", 3500);
      } else {
        showFeedback("success", "Imagem PNG baixada!");
      }
    } catch {
      showFeedback("error", "Falha ao gerar PNG", 3500);
    } finally {
      setExportingPNG(false);
    }
  };

  return (
    <div ref={menuRef} className="relative no-export print:hidden">
      <button
        type="button"
        disabled={allDisabled || exportingPNG}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={label ? `Exportar ${label}` : "Exportar dados do gráfico"}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`text-xs font-medium flex items-center gap-1.5 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-emerald-700 transition-all rounded-md shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          compact ? "px-2.5 py-1" : "px-3 py-1.5"
        } ${FOCUS_RING_CLASS}`}
      >
        {exportingPNG ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        <span>{exportingPNG ? "Gerando..." : "Exportar"}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </button>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`absolute right-0 mt-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium text-white shadow-md z-50 flex items-center gap-1.5 ${
            feedback.type === "success" ? "bg-emerald-700" : "bg-red-600"
          }`}
        >
          {feedback.type === "success" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-1.5 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col"
        >
          <button
            type="button"
            role="menuitem"
            disabled={disabledCSV}
            onClick={handleCSVClick}
            className={`text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-start gap-2.5 border-b border-slate-100 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${FOCUS_RING_CLASS}`}
          >
            <FileText className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
            <span className="flex flex-col">
              <span className="text-xs font-semibold text-slate-800">Planilha (CSV)</span>
              <span className="text-[11px] text-slate-500 leading-tight mt-0.5">
                Abrir no Excel, Calc ou Google Planilhas
              </span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={disabledPNG || exportingPNG}
            onClick={handlePNGClick}
            className={`text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-start gap-2.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${FOCUS_RING_CLASS}`}
          >
            <ImageIcon className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
            <span className="flex flex-col">
              <span className="text-xs font-semibold text-slate-800">Imagem (PNG)</span>
              <span className="text-[11px] text-slate-500 leading-tight mt-0.5">
                Salvar gráfico pronto para WhatsApp ou slides
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export interface ChartExportFooterProps {
  scope?: string;
  period?: string;
  warningNote?: string | null;
  roundedBottom?: boolean;
}

/** Rodapé institucional discreto exibido nos gráficos, nas imagens PNG e na impressão em PDF. */
export function ChartExportFooter({
  scope,
  period,
  warningNote,
  roundedBottom = true,
}: ChartExportFooterProps) {
  const exportDate = formatExportDateBR();

  return (
    <div
      className={`px-5 py-2.5 bg-white border-t border-slate-100 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1 ${
        roundedBottom ? "rounded-b-xl" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 leading-snug">
        {scope && (
          <span>
            <strong className="font-semibold text-slate-600">Recorte:</strong> {scope}
          </span>
        )}
        {period && (
          <span>
            {scope ? "• " : ""}
            <strong className="font-semibold text-slate-600">Período:</strong> {period}
          </span>
        )}
        {warningNote && (
          <span className="text-amber-700 font-medium">
            {scope || period ? "• " : ""}
            {warningNote}
          </span>
        )}
      </div>
      <div className="text-slate-500 sm:text-right shrink-0">
        Fonte: Observatório Regional do Turismo – IFSULDEMINAS (RAIS/CAGED) • {exportDate}
      </div>
    </div>
  );
}
