import * as htmlToImage from "html-to-image";
import { normalizeText } from "./api";

export type ExportCellValue = string | number | boolean | null | undefined;
export type ExportRow = Record<string, ExportCellValue>;

export interface ExportFilenameOptions {
  cities?: string[];
  period?: string;
  suffix?: string;
  date?: Date;
}

/** Formata data no padrão brasileiro DD/MM/AAAA para rodapés e relatórios. */
export function formatExportDateBR(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Formata data ISO local YYYY-MM-DD para composição de nomes de arquivo. */
export function formatExportDateISO(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Converte competência YYYY-MM em MM/YYYY para leitura amigável. */
export function formatMonthYearBR(yearMonth: string): string {
  if (!yearMonth) return "";
  const [year, month] = yearMonth.split("-");
  if (!year || !month) return yearMonth;
  return `${month.padStart(2, "0")}/${year}`;
}

/** Gera segmento seguro para nome de arquivo (ASCII minúsculo com hífens). */
export function slugifySegment(text: string): string {
  return normalizeText(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Monta nome de arquivo rastreável e compatível com Windows/macOS/Linux:
 * ot_<indicador>_<cidades-ou-qtd>[_<periodo>][_<sufixo>]_<YYYY-MM-DD>
 */
export function buildExportFilename(
  indicator: string,
  options: ExportFilenameOptions = {}
): string {
  const parts: string[] = ["ot", slugifySegment(indicator) || "dados"];

  const cleanCities = (options.cities ?? []).map((c) => c.trim()).filter(Boolean);
  if (cleanCities.length > 0 && cleanCities.length <= 3) {
    const citySegment = cleanCities.map(slugifySegment).filter(Boolean).join("_");
    if (citySegment) parts.push(citySegment);
  } else if (cleanCities.length > 3) {
    parts.push(`${cleanCities.length}-cidades`);
  }

  if (options.period) {
    const periodSegment = slugifySegment(options.period);
    if (periodSegment) parts.push(periodSegment);
  }

  if (options.suffix) {
    const suffixSegment = slugifySegment(options.suffix);
    if (suffixSegment) parts.push(suffixSegment);
  }

  parts.push(formatExportDateISO(options.date));
  return parts.join("_");
}

/**
 * Formata uma célula CSV preservando tipagem numérica no Excel pt-BR, LibreOffice Calc e Power BI:
 * - Números finitos saem sem aspas (com vírgula decimal quando fracionários);
 * - Valores nulos/indefinidos saem como célula realmente vazia (sem aspas);
 * - Textos são protegidos contra injeção de fórmulas em planilhas e escapados segundo RFC 4180.
 */
export function formatCSVCell(value: ExportCellValue): string {
  if (value === null || value === undefined) return "";

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    return Number.isInteger(value) ? String(value) : String(value).replace(".", ",");
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  let str = String(value);
  if (str === "") return "";

  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  return `"${str.replace(/"/g, '""')}"`;
}

/** Gera conteúdo CSV 100% tabular (delimitador `;`, CRLF RFC 4180) pronto para BI e planilhas pt-BR. */
export function buildCSVContent(rows: ExportRow[], orderedKeys?: string[]): string {
  if (!rows || rows.length === 0) return "";

  const keySet = new Set<string>(orderedKeys ?? []);
  rows.forEach((row) => Object.keys(row).forEach((k) => keySet.add(k)));
  const keys = Array.from(keySet);

  const headerLine = keys.map((k) => formatCSVCell(k)).join(";");
  const dataLines = rows.map((row) => keys.map((k) => formatCSVCell(row[k])).join(";"));

  return [headerLine, ...dataLines].join("\r\n");
}

/** Dispara o download de um arquivo CSV com BOM UTF-8 para acentuação nativa no Excel em português. */
export function exportToCSV(
  rows: ExportRow[],
  filename: string,
  orderedKeys?: string[]
): boolean {
  const csvContent = buildCSVContent(rows, orderedKeys);
  if (!csvContent) return false;

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  return true;
}

/** Captura o elemento de gráfico em alta resolução (2x) ocultando controles interativos (.no-export). */
export async function exportChartAsPNG(elementId: string, filename: string): Promise<boolean> {
  const chartWrapper = document.getElementById(elementId);
  if (!chartWrapper) return false;

  try {
    const pngFile = await htmlToImage.toPng(chartWrapper, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      filter: (node) => {
        if (node instanceof HTMLElement && node.classList.contains("no-export")) {
          return false;
        }
        return true;
      },
    });

    const downloadLink = document.createElement("a");
    downloadLink.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    downloadLink.href = pngFile;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    return true;
  } catch (error) {
    console.warn("Erro ao exportar imagem:", error);
    return false;
  }
}
