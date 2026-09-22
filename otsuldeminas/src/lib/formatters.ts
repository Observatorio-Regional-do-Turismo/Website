/**
 * Funções utilitárias de formatação para os indicadores municipais e socioeconômicos.
 */

export function formatarPopulacao(pop: number | string | null | undefined): string {
  if (pop === null || pop === undefined || pop === "") return "—";
  const str = String(pop).trim();
  if (str.toLowerCase().includes("hab")) return str;
  const num = Number(str.replace(/[^\d.-]/g, ""));
  if (isNaN(num) || num === 0) return str;
  return `${num.toLocaleString("pt-BR")} hab.`;
}

export function formatarPIB(pib: number | string | null | undefined): string {
  if (pib === null || pib === undefined || pib === "") return "—";
  const str = String(pib).trim();
  if (str.startsWith("R$")) return str;
  const num = Number(str.replace(/[^\d.-]/g, ""));
  if (isNaN(num) || num === 0) return str;
  
  const valorTotal = num > 10_000_000 ? num : (num > 1000 ? num * 1000 : num);
  if (valorTotal >= 1_000_000_000) {
    return `R$ ${(valorTotal / 1_000_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} Bi`;
  }
  if (valorTotal >= 1_000_000) {
    return `R$ ${(valorTotal / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} Mi`;
  }
  return `R$ ${valorTotal.toLocaleString("pt-BR")}`;
}

export function formatarIDH(idh: number | string | null | undefined): string {
  if (idh === null || idh === undefined || idh === "") return "—";
  const str = String(idh).replace(",", ".").trim();
  const num = parseFloat(str);
  if (isNaN(num)) return String(idh);
  return num.toFixed(3).replace(".", ",");
}

export function getIDHClass(idh: number | string | null | undefined): { label: string; color: string } {
  if (idh === null || idh === undefined || idh === "") return { label: "N/D", color: "text-slate-600 bg-slate-100 border-slate-200" };
  const str = String(idh).replace(",", ".").trim();
  const num = parseFloat(str);
  if (isNaN(num)) return { label: "IDHM", color: "text-slate-600 bg-slate-100 border-slate-200" };
  
  if (num >= 0.800) return { label: "Muito Alto", color: "text-[#1D5C1B] bg-[#EAF4E9] border-[#5BAF56]" };
  if (num >= 0.700) return { label: "Alto", color: "text-[#1D5C1B] bg-[#EAF4E9] border-[#359830]/40" };
  if (num >= 0.600) return { label: "Médio", color: "text-[#359830] bg-[#EAF4E9] border-[#5BAF56]/30" };
  return { label: "Baixo", color: "text-[#C90C0F] bg-red-50 border-[#C90C0F]/30" };
}

export function formatarHospedagem(hosp: number | string | null | undefined): string {
  if (hosp === null || hosp === undefined || hosp === "") return "—";
  const num = Number(String(hosp).replace(/[^\d]/g, ""));
  if (isNaN(num)) return String(hosp);
  return `${num.toLocaleString("pt-BR")}`;
}

export function formatarRestaurantes(rest: number | string | null | undefined): string {
  if (rest === null || rest === undefined || rest === "") return "—";
  const num = Number(String(rest).replace(/[^\d]/g, ""));
  if (isNaN(num)) return String(rest);
  return `${num.toLocaleString("pt-BR")}`;
}

export function formatarMUNIC(munic: number | string | null | undefined): string {
  if (munic === null || munic === undefined || munic === "") return "—";
  const str = String(munic).trim();
  if (typeof munic === "number" || !isNaN(Number(str))) {
    const num = Number(str);
    if (num <= 10 && num > 0) return `${num.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}/10`;
    return `${num.toLocaleString("pt-BR")}`;
  }
  return str;
}

export function formatarPNAD(pnad: number | string | null | undefined): string {
  if (pnad === null || pnad === undefined || pnad === "") return "—";
  const str = String(pnad).trim();
  if (str.includes("%") || str.startsWith("R$")) return str;
  const num = parseFloat(str.replace(",", "."));
  if (!isNaN(num)) {
    if (num <= 100) return `${num.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
    return `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  }
  return str;
}

export function formatarArea(area: number | string | null | undefined): string {
  if (area === null || area === undefined || area === "") return "—";
  const str = String(area).trim();
  if (str.toLowerCase().includes("km")) return str;
  const num = parseFloat(str.replace(",", "."));
  if (isNaN(num) || num === 0) return str;
  return `${num.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} km²`;
}

export function formatarDensidade(dens: number | string | null | undefined): string {
  if (dens === null || dens === undefined || dens === "") return "—";
  const str = String(dens).trim();
  if (str.toLowerCase().includes("hab")) return str;
  const num = parseFloat(str.replace(",", "."));
  if (isNaN(num) || num === 0) return str;
  return `${num.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} hab/km²`;
}

export function formatarEscolarizacao(esc: number | string | null | undefined): string {
  if (esc === null || esc === undefined || esc === "") return "—";
  const str = String(esc).trim();
  if (str.includes("%")) return str;
  const num = parseFloat(str.replace(",", "."));
  if (isNaN(num)) return str;
  return `${num.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}
