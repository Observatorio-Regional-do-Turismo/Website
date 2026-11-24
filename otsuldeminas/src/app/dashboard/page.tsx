"use client";

import { useEffect, useState, useMemo, useRef, useCallback, useId } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ReferenceLine
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterBar } from "@/components/FilterBar";
import { Header } from "@/components/Header";
import {
  PieChart as PieChartIcon,
  BarChart3,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Search,
  ChevronDown,
  Trash2,
  RefreshCw,
  Printer
} from "lucide-react";
import {
  AnalyticsRecord,
  clearAnalyticsCache,
  fetchJSONAndFlatten,
  getGraphsApiBaseUrl,
  hasCachedData,
  hasFetchError,
  normalizarClassificacaoCurta,
  normalizeText,
  parseNumericValue
} from "@/lib/api";
import {
  buildExportFilename,
  exportChartAsPNG,
  exportToCSV,
  ExportRow,
  formatExportDateBR,
  formatMonthYearBR
} from "@/lib/export";
import { ChartExportFooter, ExportMenu } from "@/components/ExportMenu";

type ChartDatum = Record<string, string | number>;

interface PieSlice {
  name: string;
  value: number;
}

interface RankingDatum {
  cidade: string;
  funcionarios: number;
}

interface StatusInfo {
  status: "green" | "yellow" | "red";
  message: string;
}

interface PieLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  percent?: number;
}

const FOCUS_RING_CLASS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700";

const formatNumber = (value: number | string | undefined) => {
  const numeric = parseNumericValue(value);
  return new Intl.NumberFormat("pt-BR").format(numeric);
};

const subtractMonths = (yearMonth: string, monthsToSubtract: number): string => {
  const [yStr, mStr] = yearMonth.split("-");
  const year = Number.parseInt(yStr, 10);
  const month = Number.parseInt(mStr, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return yearMonth;
  const totalMonths = year * 12 + (month - 1) - monthsToSubtract;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  return `${String(targetYear).padStart(4, "0")}-${String(targetMonth).padStart(2, "0")}`;
};

const roundOneDecimal = (value: number): number => Math.round(value * 10) / 10;

const getStatusWarningNote = (info: StatusInfo): string | null => {
  if (info.status === "yellow") return "Obs.: dados parciais neste recorte";
  if (info.status === "red") return "Obs.: há lacunas ou ausência de dados neste recorte";
  return null;
};

const StatusBadge = ({ statusInfo }: { statusInfo: StatusInfo }) => {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  const isVisible = pinned || (!dismissed && (hovered || focused));

  useEffect(() => {
    if (!isVisible) return;
    const handleOutside = (e: MouseEvent) => {
      if (badgeRef.current && !badgeRef.current.contains(e.target as Node)) {
        setPinned(false);
        setHovered(false);
        setFocused(false);
        setDismissed(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPinned(false);
        setDismissed(true);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isVisible]);

  const Icon =
    statusInfo.status === "green"
      ? CheckCircle2
      : statusInfo.status === "yellow"
        ? AlertTriangle
        : AlertCircle;
  const colorClass =
    statusInfo.status === "green"
      ? "text-green-600"
      : statusInfo.status === "yellow"
        ? "text-amber-600"
        : "text-red-600";

  return (
    <div
      ref={badgeRef}
      className="relative flex items-center justify-center no-export print:hidden"
      onMouseEnter={() => {
        setHovered(true);
        setDismissed(false);
      }}
      onMouseLeave={() => {
        setHovered(false);
        setDismissed(false);
      }}
      onBlur={(e) => {
        if (!badgeRef.current?.contains(e.relatedTarget as Node | null)) {
          setFocused(false);
          setDismissed(false);
        }
      }}
    >
      <button
        type="button"
        onClick={() => {
          if (pinned) {
            setPinned(false);
            setDismissed(true);
          } else {
            setDismissed(false);
            setPinned(true);
          }
        }}
        onFocus={() => {
          setFocused(true);
          setDismissed(false);
        }}
        aria-label={statusInfo.message}
        aria-expanded={isVisible}
        aria-describedby={isVisible ? tooltipId : undefined}
        className={`p-0.5 rounded-full cursor-help ${FOCUS_RING_CLASS}`}
      >
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </button>
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full right-0 mb-2 w-64 bg-slate-800 text-white text-xs rounded-lg p-3 shadow-xl z-50 whitespace-pre-wrap"
        >
          {statusInfo.message}
          <div className="absolute -bottom-1 right-2 w-2 h-2 bg-slate-800 transform rotate-45" />
        </div>
      )}
    </div>
  );
};

const EmptyChartState = ({ message }: { message: string }) => (
  <div className="h-full flex items-center justify-center text-sm text-slate-600 text-center px-6">
    {message}
  </div>
);

// Paleta de alto contraste (WCAG AA >= 4.5:1 sobre fundo branco) para séries e chips
const CITY_COLORS = [
  "#2E7D32", // Verde Esmeralda
  "#1976D2", // Azul Safira
  "#C43E00", // Laranja Escuro
  "#7B1FA2", // Púrpura
  "#00838F", // Ciano Petróleo
  "#C2185B", // Framboesa Escuro
  "#9A5800", // Ocre Escuro
  "#37474F", // Grafite Escuro
  "#006978", // Azul Petróleo
  "#B7320E"  // Terracota Escuro
];

const COLORS = [
  "#2E7D32",
  "#1976D2",
  "#C43E00",
  "#7B1FA2",
  "#00838F",
  "#C2185B",
  "#9A5800",
  "#37474F"
];
const MAX_RECOMMENDED_CITIES = 6;

const MONTHS_LIST = [
  { value: "01", label: "Jan" }, { value: "02", label: "Fev" }, { value: "03", label: "Mar" },
  { value: "04", label: "Abr" }, { value: "05", label: "Mai" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Ago" }, { value: "09", label: "Set" },
  { value: "10", label: "Out" }, { value: "11", label: "Nov" }, { value: "12", label: "Dez" }
];

const formatXAxisDate = (dateStr: string) => {
  if (!dateStr) return "";
  const [year, month] = dateStr.split("-");
  return `${month}/${year.slice(-2)}`;
};

const formatTooltipDate = (dateStr: string) => {
  if (!dateStr) return "";
  const [year, month] = dateStr.split("-");
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return `${months[parseInt(month, 10) - 1] ?? month} de ${year}`;
};

export default function Dashboard() {
  const [estabelecimentos, setEstabelecimentos] = useState<AnalyticsRecord[]>([]);
  const [funcionarios, setFuncionarios] = useState<AnalyticsRecord[]>([]);
  const [estoque, setEstoque] = useState<AnalyticsRecord[]>([]);
  const [postos, setPostos] = useState<AnalyticsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [funcionariosFetchFailed, setFuncionariosFetchFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Conectando aos dados regionais...");

  const [selectedCities, setSelectedCities] = useState<string[]>(["Poços de Caldas"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showPieChart, setShowPieChart] = useState(true);
  const [pieChartCity, setPieChartCity] = useState<string>("Total");
  const [timeFilter, setTimeFilter] = useState<"6m" | "12m" | "all" | "custom">("12m");
  const [startYear, setStartYear] = useState<string>("");
  const [startMonth, setStartMonth] = useState<string>("");
  const [endYear, setEndYear] = useState<string>("");
  const [endMonth, setEndMonth] = useState<string>("");
  const [draftStartYear, setDraftStartYear] = useState<string>("");
  const [draftStartMonth, setDraftStartMonth] = useState<string>("");
  const [draftEndYear, setDraftEndYear] = useState<string>("");
  const [draftEndMonth, setDraftEndMonth] = useState<string>("");
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);

  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const customDateRef = useRef<HTMLDivElement>(null);
  const hasReconciledDefaultRef = useRef(false);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (customDateRef.current && !customDateRef.current.contains(e.target as Node)) {
        setIsCustomDateOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDropdownOpen(false);
        setIsCustomDateOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const loadData = useCallback(async (forceRefresh = false) => {
    const currentRequestId = ++requestIdRef.current;
    const isActiveRequest = () => mountedRef.current && requestIdRef.current === currentRequestId;

    try {
      if (forceRefresh) {
        const failedTypes = (["estabelecimentos", "funcionarios", "estoque", "postos"] as const).filter(
          (t) => hasFetchError(t)
        );
        if (failedTypes.length > 0 && failedTypes.length < 4) {
          failedTypes.forEach((t) => clearAnalyticsCache(t));
        } else {
          clearAnalyticsCache();
        }
      }
      if (!isActiveRequest()) return;

      setLoading(true);
      setFetchError(null);
      setFuncionariosFetchFailed(false);

      const baseUrl = getGraphsApiBaseUrl();
      if (!baseUrl) {
        setFetchError("URL da API de gráficos (NEXT_PUBLIC_GRAPHS_URL) não está configurada.");
        setLoading(false);
        return;
      }

      const allCached =
        hasCachedData("estabelecimentos") &&
        hasCachedData("funcionarios") &&
        hasCachedData("estoque") &&
        hasCachedData("postos");

      if (allCached) {
        setProgress(100);
        setLoadingMessage("Carregando dados do cache em memória...");
      } else {
        setProgress(10);
        setLoadingMessage("Consultando bases regionais (0/4)...");
      }

      let completed = 0;
      const total = 4;
      const stepMessages = [
        "Processando indicadores municipais (1/4)...",
        "Normalizando séries de estabelecimentos e vínculos (2/4)...",
        "Consolidando histórico mensal dos 146 municípios (3/4)...",
        "Montando painéis analíticos (4/4)..."
      ];

      const onStepComplete = () => {
        completed++;
        if (!isActiveRequest()) return;
        setProgress((prev) => Math.max(prev, Math.floor((completed / total) * 100)));
        setLoadingMessage(stepMessages[completed - 1] ?? "Finalizando...");
      };

      const [estData, funcData, estoqueData, postosData] = await Promise.all([
        fetchJSONAndFlatten(`${baseUrl}/estabelecimentos/`, "estabelecimentos").then((d) => {
          onStepComplete();
          return d;
        }),
        fetchJSONAndFlatten(`${baseUrl}/funcionarios/`, "funcionarios").then((d) => {
          onStepComplete();
          return d;
        }),
        fetchJSONAndFlatten(`${baseUrl}/estoque_acumulado/`, "estoque").then((d) => {
          onStepComplete();
          return d;
        }),
        fetchJSONAndFlatten(`${baseUrl}/postos_de_trabalho/`, "postos").then((d) => {
          onStepComplete();
          return d;
        })
      ]);

      if (!isActiveRequest()) return;

      setEstabelecimentos(estData);
      setFuncionarios(funcData);
      setEstoque(estoqueData);
      setPostos(postosData);

      const failedSources: string[] = [];
      const funcHasError = hasFetchError("funcionarios");
      setFuncionariosFetchFailed(funcHasError);
      if (hasFetchError("estabelecimentos")) failedSources.push("Estabelecimentos");
      if (funcHasError) failedSources.push("Funcionários");
      if (hasFetchError("estoque")) failedSources.push("Estoque Acumulado");
      if (hasFetchError("postos")) failedSources.push("Saldo de Postos");

      if (failedSources.length === 4) {
        setFetchError(
          "Não foi possível conectar à API de indicadores no momento. Verifique sua conexão ou tente novamente."
        );
      } else if (failedSources.length > 0) {
        setFetchError(
          `Alguns indicadores não puderam ser carregados (${failedSources.join(", ")}). Os demais gráficos continuam disponíveis.`
        );
      }
    } catch (error) {
      console.warn("Erro ao carregar dados do dashboard:", error);
      if (isActiveRequest()) {
        setFetchError("Ocorreu uma falha inesperada ao carregar os indicadores regionais.");
      }
    } finally {
      if (isActiveRequest()) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Lista única de municípios considerando todas as 4 bases (deduplicada via normalizeText)
  const allCities = useMemo(() => {
    const cityByNorm = new Map<string, string>();
    const extract = (data: AnalyticsRecord[]) => {
      data.forEach((row) => {
        const display = String(row.Município ?? "").trim();
        const norm = normalizeText(display);
        if (norm && !cityByNorm.has(norm)) {
          cityByNorm.set(norm, display);
        }
      });
    };
    extract(estabelecimentos);
    extract(funcionarios);
    extract(estoque);
    extract(postos);
    return Array.from(cityByNorm.values()).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [estabelecimentos, funcionarios, estoque, postos]);

  // Reconcilia a seleção inicial (via parâmetro ?cidade= ou padrão) contra os nomes reais da base
  useEffect(() => {
    if (hasReconciledDefaultRef.current || allCities.length === 0) return;
    hasReconciledDefaultRef.current = true;
    const cityByNorm = new Map(allCities.map((c) => [normalizeText(c), c]));

    const queryCities: string[] = [];
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const rawParam = params.get("cidade") ?? params.get("cidades") ?? "";
      rawParam
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .forEach((item) => {
          const matched = cityByNorm.get(normalizeText(item));
          if (matched && !queryCities.includes(matched)) {
            queryCities.push(matched);
          }
        });
    }

    if (queryCities.length > 0) {
      setSelectedCities(queryCities);
      if (queryCities.length >= 2) {
        setShowPieChart(false);
      }
      return;
    }

    setSelectedCities((prev) => {
      if (prev.length === 0) return prev;
      const reconciled: string[] = [];
      for (const item of prev) {
        const matched = cityByNorm.get(normalizeText(item));
        if (matched && !reconciled.includes(matched)) {
          reconciled.push(matched);
        }
      }
      return reconciled.length > 0 ? reconciled : [allCities[0]];
    });
  }, [allCities]);

  const filteredCities = useMemo(() => {
    if (!searchTerm) return allCities;
    const lowerSearch = normalizeText(searchTerm);
    return allCities.filter((city) => normalizeText(city).includes(lowerSearch));
  }, [searchTerm, allCities]);

  const availableFilteredCities = useMemo(
    () => filteredCities.filter((city) => !selectedCities.includes(city)),
    [filteredCities, selectedCities]
  );

  const addCity = (city: string) => {
    if (selectedCities.includes(city)) return;
    const prevLen = selectedCities.length;
    const next = [...selectedCities, city];
    setSelectedCities(next);
    if (prevLen === 1 && next.length === 2) {
      setShowPieChart(false);
    }
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const removeCity = (city: string) => {
    const next = selectedCities.filter((c) => c !== city);
    setSelectedCities(next);
    if (pieChartCity === city || (pieChartCity !== "Total" && !next.includes(pieChartCity))) {
      setPieChartCity("Total");
    }
  };

  const isComparing = selectedCities.length > 0;
  const dataKeys = selectedCities;

  // Datas disponíveis considerando tanto Estoque quanto Postos
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    const collect = (records: AnalyticsRecord[]) => {
      records.forEach((curr) => {
        if (curr.Ano && curr.Mês) {
          dates.add(`${curr.Ano}-${String(curr.Mês).padStart(2, "0")}`);
        }
      });
    };
    collect(estoque);
    collect(postos);
    return Array.from(dates).sort();
  }, [estoque, postos]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    availableDates.forEach((d) => years.add(d.split("-")[0]));
    return Array.from(years).sort().reverse();
  }, [availableDates]);

  // Validação do período personalizado aplicado e do rascunho no popover
  const isCustomRangeInvalid = useMemo(() => {
    if (timeFilter !== "custom") return false;
    if (!startYear || !startMonth || !endYear || !endMonth) return false;
    return `${startYear}-${startMonth}` > `${endYear}-${endMonth}`;
  }, [timeFilter, startYear, startMonth, endYear, endMonth]);

  const isDraftRangeComplete = Boolean(draftStartYear && draftStartMonth && draftEndYear && draftEndMonth);
  const isDraftRangeInvalid =
    isDraftRangeComplete && `${draftStartYear}-${draftStartMonth}` > `${draftEndYear}-${draftEndMonth}`;

  // Limites da janela temporal ativa por meses-calendário
  const activeDateBounds = useMemo<{ min: string | null; max: string | null }>(() => {
    if (timeFilter === "custom") {
      if (isCustomRangeInvalid) return { min: null, max: null };
      if (startYear && startMonth && endYear && endMonth) {
        return { min: `${startYear}-${startMonth}`, max: `${endYear}-${endMonth}` };
      }
      return { min: null, max: null };
    }
    if (timeFilter === "all" || availableDates.length === 0) {
      return { min: null, max: null };
    }
    const maxDate = availableDates[availableDates.length - 1];
    if (timeFilter === "6m") {
      return { min: subtractMonths(maxDate, 5), max: maxDate };
    }
    if (timeFilter === "12m") {
      return { min: subtractMonths(maxDate, 11), max: maxDate };
    }
    return { min: null, max: null };
  }, [timeFilter, isCustomRangeInvalid, startYear, startMonth, endYear, endMonth, availableDates]);

  // Auditoria de integridade de dados (verde: completos, amarelo: parciais, vermelho: ausentes)
  const computeDataStatus = useCallback(
    (data: AnalyticsRecord[], type: "total" | "time"): StatusInfo => {
      if (!data.length) {
        return {
          status: "red",
          message: "Nenhum dado disponível para este indicador no momento."
        };
      }

      if (type === "time" && isCustomRangeInvalid) {
        return {
          status: "yellow",
          message: "O intervalo personalizado selecionado está invertido (data inicial posterior à final)."
        };
      }

      if (!isComparing) {
        return {
          status: "green",
          message: "Selecione uma cidade para visualizar a integridade dos dados."
        };
      }

      const isDateInWindow = (dt: string) => {
        if (activeDateBounds.min && dt < activeDateBounds.min) return false;
        if (activeDateBounds.max && dt > activeDateBounds.max) return false;
        return true;
      };

      let hasCompleteMiss = false;
      let hasPartialMiss = false;
      const messages: string[] = [];

      const allCategoriesSet = new Set<string>();
      data.forEach((r) => {
        if (type === "total") {
          const cat = normalizarClassificacaoCurta(r.Classificação);
          if (cat) allCategoriesSet.add(cat);
        } else if (r.Ano && r.Mês) {
          const dt = `${r.Ano}-${String(r.Mês).padStart(2, "0")}`;
          if (isDateInWindow(dt)) {
            allCategoriesSet.add(dt);
          }
        }
      });
      const allCategories = Array.from(allCategoriesSet).sort();

      if (type === "time" && allCategories.length === 0) {
        return {
          status: "yellow",
          message: "Nenhum dado registrado no recorte temporal selecionado."
        };
      }

      selectedCities.forEach((city) => {
        const normalizedCity = normalizeText(city);
        const rows = data.filter((r) => normalizeText(r.Município) === normalizedCity);
        if (rows.length === 0) {
          hasCompleteMiss = true;
          messages.push(`${city}: Sem dados registrados nesta categoria.`);
          return;
        }

        const cityCatsSet = new Set<string>();
        rows.forEach((r) => {
          if (type === "total") {
            cityCatsSet.add(normalizarClassificacaoCurta(r.Classificação));
          } else if (r.Ano && r.Mês) {
            const dt = `${r.Ano}-${String(r.Mês).padStart(2, "0")}`;
            if (isDateInWindow(dt)) {
              cityCatsSet.add(dt);
            }
          }
        });

        if (type === "time" && cityCatsSet.size === 0) {
          hasCompleteMiss = true;
          messages.push(`${city}: Sem dados registrados no período selecionado.`);
          return;
        }

        const missing = allCategories.filter((c) => !cityCatsSet.has(c));
        if (missing.length > 0) {
          hasPartialMiss = true;
          const displayMissing = missing.slice(0, 3).join(", ");
          const andMore = missing.length > 3 ? ` e +${missing.length - 3}` : "";

          if (type === "total") {
            messages.push(`${city}: Faltam setores (${displayMissing}${andMore}).`);
          } else {
            messages.push(`${city}: Faltam meses (${displayMissing}${andMore}).`);
          }
        }
      });

      if (hasCompleteMiss) {
        return { status: "red", message: "Cidades com dados ausentes:\n" + messages.join("\n") };
      }
      if (hasPartialMiss) {
        return { status: "yellow", message: "Cidades com dados parciais:\n" + messages.join("\n") };
      }
      return { status: "green", message: "Todos os dados estão íntegros para as cidades selecionadas." };
    },
    [isComparing, selectedCities, isCustomRangeInvalid, activeDateBounds]
  );

  const statusEstabelecimentos = useMemo(
    () => computeDataStatus(estabelecimentos, "total"),
    [computeDataStatus, estabelecimentos]
  );
  const statusFuncionarios = useMemo(
    () => computeDataStatus(funcionarios, "total"),
    [computeDataStatus, funcionarios]
  );
  const statusEstoque = useMemo(
    () => computeDataStatus(estoque, "time"),
    [computeDataStatus, estoque]
  );
  const statusPostos = useMemo(
    () => computeDataStatus(postos, "time"),
    [computeDataStatus, postos]
  );

  // Processamento memoizado de Estabelecimentos e Funcionários com nomes padronizados
  const chartDataEstabelecimentos = useMemo<ChartDatum[]>(() => {
    if (!isComparing) return [];
    const selectedCityMap = new Map(selectedCities.map((c) => [normalizeText(c), c]));
    const acc: Record<string, ChartDatum> = {};

    estabelecimentos.forEach((curr) => {
      const matchedCity = selectedCityMap.get(normalizeText(curr.Município));
      if (!matchedCity) return;
      const categoria = normalizarClassificacaoCurta(curr.Classificação);
      const qtde = parseNumericValue(curr.Estabelecimentos);

      if (!acc[categoria]) acc[categoria] = { name: categoria };
      acc[categoria][matchedCity] = (Number(acc[categoria][matchedCity]) || 0) + qtde;
    });

    return Object.values(acc).sort((a, b) => {
      const sumA = dataKeys.reduce((s, k) => s + (Number(a[k]) || 0), 0);
      const sumB = dataKeys.reduce((s, k) => s + (Number(b[k]) || 0), 0);
      return sumB - sumA;
    });
  }, [estabelecimentos, isComparing, selectedCities, dataKeys]);

  const chartDataFuncionarios = useMemo<ChartDatum[]>(() => {
    if (!isComparing) return [];
    const selectedCityMap = new Map(selectedCities.map((c) => [normalizeText(c), c]));
    const acc: Record<string, ChartDatum> = {};

    funcionarios.forEach((curr) => {
      const matchedCity = selectedCityMap.get(normalizeText(curr.Município));
      if (!matchedCity) return;
      const categoria = normalizarClassificacaoCurta(curr.Classificação);
      const qtde = parseNumericValue(curr.Funcionarios);

      if (!acc[categoria]) acc[categoria] = { name: categoria };
      acc[categoria][matchedCity] = (Number(acc[categoria][matchedCity]) || 0) + qtde;
    });

    return Object.values(acc).sort((a, b) => {
      const sumA = dataKeys.reduce((s, k) => s + (Number(a[k]) || 0), 0);
      const sumB = dataKeys.reduce((s, k) => s + (Number(b[k]) || 0), 0);
      return sumB - sumA;
    });
  }, [funcionarios, isComparing, selectedCities, dataKeys]);

  const activePieCity = isComparing
    ? selectedCities.length === 1
      ? selectedCities[0]
      : pieChartCity === "Total" || selectedCities.includes(pieChartCity)
        ? pieChartCity
        : "Total"
    : "Total";

  const pieChartData = useMemo<PieSlice[]>(() => {
    return chartDataFuncionarios
      .map((d) => {
        if (activePieCity === "Total" && isComparing) {
          const total = selectedCities.reduce((s, k) => s + (Number(d[k]) || 0), 0);
          return { name: String(d.name), value: total };
        }
        return { name: String(d.name), value: Number(d[activePieCity]) || 0 };
      })
      .filter((d) => d.value > 0);
  }, [chartDataFuncionarios, activePieCity, isComparing, selectedCities]);

  const renderCustomizedLabel = (props: PieLabelProps) => {
    const cx = props.cx ?? 0;
    const cy = props.cy ?? 0;
    const midAngle = props.midAngle ?? 0;
    const outerRadius = props.outerRadius ?? 0;
    const percent = props.percent ?? 0;
    if (percent < 0.04) return null;

    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.12;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#292929"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={11}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const applyTimeWindow = useCallback(
    (sortedRows: ChartDatum[]): ChartDatum[] => {
      if (timeFilter === "custom" && isCustomRangeInvalid) return [];
      const { min, max } = activeDateBounds;
      if (!min && !max) return sortedRows;
      return sortedRows.filter((d) => {
        const dt = String(d.data);
        if (min && dt < min) return false;
        if (max && dt > max) return false;
        return true;
      });
    },
    [timeFilter, isCustomRangeInvalid, activeDateBounds]
  );

  // Série histórica completa de Estoque Acumulado (separada do recorte de janela temporal)
  const fullChartDataEstoque = useMemo<ChartDatum[]>(() => {
    if (!isComparing) return [];
    const selectedCityMap = new Map(selectedCities.map((c) => [normalizeText(c), c]));
    const acc: Record<string, ChartDatum> = {};

    estoque.forEach((curr) => {
      if (!curr.Ano || !curr.Mês) return;
      const matchedCity = selectedCityMap.get(normalizeText(curr.Município));
      if (!matchedCity) return;
      const dataStr = `${curr.Ano}-${String(curr.Mês).padStart(2, "0")}`;
      const valor = parseNumericValue(curr.Estoque);
      if (!acc[dataStr]) acc[dataStr] = { data: dataStr };
      acc[dataStr][matchedCity] = (Number(acc[dataStr][matchedCity]) || 0) + valor;
    });

    return Object.values(acc).sort((a, b) => String(a.data).localeCompare(String(b.data)));
  }, [estoque, isComparing, selectedCities]);

  const chartDataEstoque = useMemo<ChartDatum[]>(
    () => applyTimeWindow(fullChartDataEstoque),
    [fullChartDataEstoque, applyTimeWindow]
  );

  // Série histórica completa de Saldo de Postos (separada do recorte de janela temporal)
  const fullChartDataPostos = useMemo<ChartDatum[]>(() => {
    if (!isComparing) return [];
    const selectedCityMap = new Map(selectedCities.map((c) => [normalizeText(c), c]));
    const acc: Record<string, ChartDatum> = {};

    postos.forEach((curr) => {
      if (!curr.Ano || !curr.Mês) return;
      const matchedCity = selectedCityMap.get(normalizeText(curr.Município));
      if (!matchedCity) return;
      const dataStr = `${curr.Ano}-${String(curr.Mês).padStart(2, "0")}`;
      const valor = parseNumericValue(curr.Saldo);
      if (!acc[dataStr]) acc[dataStr] = { data: dataStr };
      acc[dataStr][matchedCity] = (Number(acc[dataStr][matchedCity]) || 0) + valor;
    });

    return Object.values(acc).sort((a, b) => String(a.data).localeCompare(String(b.data)));
  }, [postos, isComparing, selectedCities]);

  const chartDataPostos = useMemo<ChartDatum[]>(
    () => applyTimeWindow(fullChartDataPostos),
    [fullChartDataPostos, applyTimeWindow]
  );

  // Radar de Perfil Turístico (até 8 setores padronizados) e totais reais por cidade para percentual no tooltip e CSV
  const radarData = useMemo(() => chartDataEstabelecimentos.slice(0, 8), [chartDataEstabelecimentos]);
  const radarCityTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    dataKeys.forEach((city) => {
      totals[city] = chartDataEstabelecimentos.reduce((sum, row) => sum + parseNumericValue(row[city]), 0);
    });
    return totals;
  }, [chartDataEstabelecimentos, dataKeys]);

  // Ranking Top 10 municípios por volume de funcionários (agrupado por normalizeText)
  const chartDataRanking = useMemo<RankingDatum[]>(() => {
    const funcPorCidade = new Map<string, { cidade: string; total: number }>();
    funcionarios.forEach((curr) => {
      const display = String(curr.Município ?? "").trim();
      const norm = normalizeText(display);
      if (!norm) return;
      const qtde = parseNumericValue(curr.Funcionarios);
      const existing = funcPorCidade.get(norm);
      if (existing) {
        existing.total += qtde;
      } else {
        funcPorCidade.set(norm, { cidade: display, total: qtde });
      }
    });

    return Array.from(funcPorCidade.values())
      .map(({ cidade, total }) => ({ cidade, funcionarios: total }))
      .sort((a, b) => b.funcionarios - a.funcionarios)
      .slice(0, 10);
  }, [funcionarios]);

  const statusRanking = useMemo<StatusInfo>(() => {
    if (funcionariosFetchFailed) {
      return {
        status: "red",
        message: "Não foi possível carregar a base de funcionários para o ranking regional."
      };
    }
    if (!funcionarios.length || !chartDataRanking.length) {
      return {
        status: "red",
        message: "Nenhum dado disponível para o ranking regional de funcionários no momento."
      };
    }
    return {
      status: "green",
      message: `Ranking consolidado com os ${chartDataRanking.length} municípios de maior força de trabalho na base regional.`
    };
  }, [funcionarios, chartDataRanking, funcionariosFetchFailed]);

  const activeTimeLabel =
    timeFilter === "6m"
      ? "Últimos 6 meses"
      : timeFilter === "12m"
        ? "Últimos 12 meses"
        : timeFilter === "all"
          ? "Série completa"
          : isCustomRangeInvalid
            ? "Período inválido"
            : startYear && startMonth && endYear && endMonth
              ? `${startMonth}/${startYear} a ${endMonth}/${endYear}`
              : "Período personalizado";

  const activePieScopeLabel =
    selectedCities.length === 1
      ? selectedCities[0]
      : activePieCity === "Total"
        ? selectedCities.length <= 3
          ? selectedCities.join(", ")
          : `Todas selecionadas (${selectedCities.length} municípios)`
        : activePieCity;

  const selectedCitiesScopeLabel =
    selectedCities.length === 0
      ? "Nenhum município selecionado"
      : selectedCities.length <= 4
        ? selectedCities.join(", ")
        : `${selectedCities.slice(0, 3).join(", ")} e +${selectedCities.length - 3}`;

  const buildPeriodMeta = (rows: ChartDatum[]) => {
    if (rows.length > 0) {
      const first = String(rows[0].data ?? "");
      const last = String(rows[rows.length - 1].data ?? "");
      if (first && last) {
        return {
          display: first === last ? formatMonthYearBR(first) : `${formatMonthYearBR(first)} a ${formatMonthYearBR(last)}`,
          slug: first === last ? first : `${first}_a_${last}`
        };
      }
    }
    return {
      display: activeTimeLabel,
      slug: timeFilter === "custom" ? "personalizado" : timeFilter
    };
  };

  const estoquePeriodMeta = buildPeriodMeta(chartDataEstoque);
  const postosPeriodMeta = buildPeriodMeta(chartDataPostos);

  const hasForcaTrabalhoData = showPieChart ? pieChartData.length > 0 : chartDataFuncionarios.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col relative">
        {/* Loading Overlay */}
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-site-surface p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Preparando Painel</h3>
              <span className="text-emerald-600 font-bold">{progress}%</span>
            </div>

            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso de carregamento dos indicadores"
              className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden"
            >
              <div
                className="bg-emerald-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center text-slate-600 text-sm font-medium">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin text-emerald-600" />
              {loadingMessage}
            </div>

            {/* Aviso de Primeiro Carregamento */}
            <div className="mt-5 p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl flex items-start gap-3 text-left">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-semibold block text-amber-950 mb-0.5">Primeiro carregamento:</span>
                Na primeira vez, a consulta pode demorar alguns segundos enquanto compilamos e sincronizamos os dados de todos os municípios da região.
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton Header */}
        <div className="h-64 bg-slate-900 animate-pulse w-full" />
        {/* Skeleton Filter Bar */}
        <div className="h-20 bg-site-surface border-b border-slate-200 shadow-sm animate-pulse w-full" />
        {/* Skeleton Content */}
        <div className="max-w-7xl mx-auto w-full px-4 py-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {[1, 2].map((i) => (
              <div key={i} className="h-96 bg-slate-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="dashboard-main" className="min-h-screen bg-background pb-20">
      {/* Header com Background Padronizado */}
      <Header
        badge="Inteligência de Dados"
        title="Visão Geral & Indicadores"
        subtitle="Acompanhe estabelecimentos, força de trabalho e evolução temporal dos municípios."
      />

      {/* Seção de Filtro: Busca Inteligente & Chips */}
      <FilterBar containerClassName="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div ref={searchDropdownRef} className="relative flex-1 w-full max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                aria-label="Buscar cidade para analisar"
                placeholder="Busque uma cidade para analisar..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onClick={() => setIsDropdownOpen(true)}
                className={`block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-500 focus:border-primary sm:text-sm transition-colors ${FOCUS_RING_CLASS}`}
              />
            </div>

            {/* Dropdown de sugestões */}
            {isDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-site-surface shadow-lg rounded-md border border-slate-200 max-h-60 overflow-y-auto">
                <div className="p-2">
                  <div className="flex justify-between items-center px-2 py-1 mb-1 border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Cidades disponíveis ({availableFilteredCities.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(false)}
                      aria-label="Fechar lista de cidades"
                      className={`text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-1 cursor-pointer ${FOCUS_RING_CLASS}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  {filteredCities.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-slate-500 text-center">Nenhuma cidade encontrada.</div>
                  ) : availableFilteredCities.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-slate-500 text-center">
                      Todas as cidades encontradas já estão selecionadas.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 mt-2">
                      {availableFilteredCities.map((city) => (
                        <button
                          type="button"
                          key={city}
                          onClick={() => addCity(city)}
                          className={`group w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-primary/10 hover:text-primary rounded-md transition-colors flex items-center justify-between cursor-pointer ${FOCUS_RING_CLASS}`}
                        >
                          <span>{city}</span>
                          <span className="text-xs text-primary/70 opacity-0 group-hover:opacity-100 transition-opacity">
                            Adicionar +
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cidades Selecionadas (Chips sincronizados com a cor da série no gráfico) */}
          <div className="flex-1 flex flex-wrap gap-2 items-center min-h-[38px]">
            {selectedCities.length === 0 ? (
              <span className="text-sm text-slate-500 italic bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                Nenhuma cidade selecionada. Pesquise e adicione cidades para iniciar a análise.
              </span>
            ) : (
              <>
                <span className="font-semibold text-slate-600 mr-1 uppercase tracking-wide text-xs">
                  Comparando:
                </span>
                {selectedCities.map((city, idx) => {
                  const chipColor = CITY_COLORS[idx % CITY_COLORS.length];
                  return (
                    <span
                      key={city}
                      style={{ backgroundColor: chipColor }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white shadow-sm"
                    >
                      {city}
                      <button
                        type="button"
                        onClick={() => removeCity(city)}
                        className={`hover:bg-white/20 p-0.5 rounded-full transition-colors flex-shrink-0 cursor-pointer ${FOCUS_RING_CLASS}`}
                        title={`Remover ${city}`}
                        aria-label={`Remover ${city}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCities([]);
                    setPieChartCity("Total");
                  }}
                  className={`text-xs font-semibold text-slate-600 hover:text-destructive transition-colors ml-2 hover:underline bg-slate-100 px-2.5 py-1.5 rounded cursor-pointer ${FOCUS_RING_CLASS}`}
                >
                  Limpar tudo
                </button>
              </>
            )}
          </div>
      </FilterBar>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Aviso explícito em caso de indisponibilidade total ou parcial da API */}
        {fetchError && (
          <div
            role="alert"
            className="mb-6 p-5 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-900">Falha ao carregar os dados</h4>
                <p className="text-xs text-red-800 mt-0.5">{fetchError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadData(true)}
              className={`inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors cursor-pointer shrink-0 ${FOCUS_RING_CLASS}`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar novamente
            </button>
          </div>
        )}

        {/* Aviso de excesso de cidades selecionadas */}
        {selectedCities.length > MAX_RECOMMENDED_CITIES && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-900 print:hidden">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              Você selecionou {selectedCities.length} cidades. Para manter a legibilidade dos gráficos comparativos, recomenda-se comparar até {MAX_RECOMMENDED_CITIES} municípios simultaneamente.
            </span>
          </div>
        )}

        {/* Resumo Dinâmico */}
        <div className="mb-8 p-6 bg-site-surface rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-4 print:shadow-none print:border-slate-300 print:break-inside-avoid">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-full text-primary mt-1 print:hidden">
              <Info className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">
                {isComparing ? `Analisando ${selectedCities.length} cidade(s)` : "Aguardando seleção de cidades"}
              </h3>
              <p className="text-slate-600 text-base leading-relaxed print:hidden">
                {isComparing
                  ? `Você está visualizando indicadores turísticos restritos aos municípios de ${selectedCities.join(", ")}. Verifique os ícones de integridade de dados nos cantos dos gráficos: ícones amarelos ou vermelhos indicam que um ou mais municípios selecionados possuem dados parciais ou ausentes para aquele indicador (clique ou passe o cursor para ver os detalhes).`
                  : "Utilize a barra de busca acima para selecionar uma ou mais cidades. Os gráficos serão preenchidos automaticamente com os dados da região escolhida."}
              </p>
              {/* Cabeçalho executivo dedicado para impressão / salvar em PDF */}
              <div className="hidden print:block text-sm text-slate-700 space-y-1 mt-2">
                <p>
                  <strong>Municípios analisados:</strong> {selectedCitiesScopeLabel}
                </p>
                <p>
                  <strong>Recorte temporal das séries históricas:</strong> {estoquePeriodMeta.display}
                </p>
                <p>
                  <strong>Emissão:</strong> {formatExportDateBR()} • <strong>Fonte:</strong> Observatório Regional do Turismo – IFSULDEMINAS (RAIS/CAGED)
                </p>
              </div>
            </div>
          </div>

          {isComparing && (
            <div className="flex items-center gap-2 shrink-0 self-start no-export print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer ${FOCUS_RING_CLASS}`}
                title="Gerar versão pronta para impressão ou salvar como PDF"
              >
                <Printer className="h-4 w-4 text-emerald-700" />
                Imprimir / PDF
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 print:block print:space-y-8">
          {/* Gráfico de Estabelecimentos */}
          <Card
            id="card-estabelecimentos"
            className="shadow-sm hover:shadow-md transition-shadow border-slate-100 print:shadow-none print:border-slate-200 print:break-inside-avoid"
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-xl text-slate-800">Estabelecimentos por Setor</CardTitle>
                  <CardDescription>Quantidade de negócios turísticos classificados por categoria.</CardDescription>
                </div>
                <div className="flex items-center gap-2 no-export print:hidden">
                  <ExportMenu
                    label="Estabelecimentos por Setor"
                    disabledCSV={chartDataEstabelecimentos.length === 0}
                    disabledPNG={chartDataEstabelecimentos.length === 0}
                    onExportCSV={() => {
                      const rows: ExportRow[] = chartDataEstabelecimentos.map(({ name, ...rest }) => {
                        const row: ExportRow = { Setor: name };
                        let total = 0;
                        selectedCities.forEach((city) => {
                          if (rest[city] !== undefined) {
                            const val = parseNumericValue(rest[city]);
                            row[city] = val;
                            total += val;
                          } else {
                            row[city] = null;
                          }
                        });
                        if (selectedCities.length >= 2) {
                          row["Total Selecionadas"] = total;
                        }
                        return row;
                      });
                      const cols = [
                        "Setor",
                        ...selectedCities,
                        ...(selectedCities.length >= 2 ? ["Total Selecionadas"] : [])
                      ];
                      return exportToCSV(
                        rows,
                        buildExportFilename("estabelecimentos_setor", { cities: selectedCities }),
                        cols
                      );
                    }}
                    onExportPNG={() =>
                      exportChartAsPNG(
                        "card-estabelecimentos",
                        buildExportFilename("estabelecimentos_setor", { cities: selectedCities })
                      )
                    }
                  />
                  <StatusBadge statusInfo={statusEstabelecimentos} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[400px] bg-slate-50/80 pt-4 border-t border-slate-100">
              {!isComparing ? (
                <EmptyChartState message="Selecione ao menos uma cidade para comparar estabelecimentos por setor." />
              ) : chartDataEstabelecimentos.length === 0 ? (
                <EmptyChartState message="Nenhum registro de estabelecimentos disponível para as cidades selecionadas." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataEstabelecimentos} margin={{ top: 20, right: 10, left: 0, bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF4E9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#292929" }} interval={0} angle={-35} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12, fill: "#292929" }} width={45} tickFormatter={formatNumber} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "#EAF4E9" }}
                      formatter={(value: number | string) => formatNumber(value)}
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px", paddingBottom: "8px" }} />
                    {dataKeys.map((key, i) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        fill={CITY_COLORS[i % CITY_COLORS.length]}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
            <ChartExportFooter
              scope={selectedCitiesScopeLabel}
              warningNote={getStatusWarningNote(statusEstabelecimentos)}
            />
          </Card>

          {/* Gráfico de Funcionários (Pizza ou Barras Agrupadas) */}
          <Card
            id="card-forca-trabalho"
            className="shadow-sm hover:shadow-md transition-shadow border-slate-100 print:shadow-none print:border-slate-200 print:break-inside-avoid"
          >
            <CardHeader className="flex flex-col pb-2 gap-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-xl text-slate-800">Força de Trabalho</CardTitle>
                  <CardDescription>
                    {showPieChart && isComparing
                      ? `Distribuição percentual de funcionários formais (${activePieScopeLabel}).`
                      : "Distribuição de funcionários formais nos setores turísticos."}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-start no-export print:hidden">
                  <ExportMenu
                    label="Força de Trabalho"
                    disabledCSV={!hasForcaTrabalhoData}
                    disabledPNG={!hasForcaTrabalhoData}
                    onExportCSV={() => {
                      if (showPieChart) {
                        const pieCities =
                          activePieCity === "Total" ? selectedCities : [activePieCity];
                        const totalPie = pieChartData.reduce((acc, item) => acc + item.value, 0);
                        return exportToCSV(
                          pieChartData.map((d) => ({
                            Setor: d.name,
                            Funcionários: d.value,
                            "Participação (%)":
                              totalPie > 0 ? roundOneDecimal((d.value / totalPie) * 100) : 0
                          })),
                          buildExportFilename("forca_trabalho", {
                            cities: pieCities,
                            suffix: "proporcao"
                          }),
                          ["Setor", "Funcionários", "Participação (%)"]
                        );
                      } else {
                        const rows: ExportRow[] = chartDataFuncionarios.map(({ name, ...rest }) => {
                          const row: ExportRow = { Setor: name };
                          let total = 0;
                          selectedCities.forEach((city) => {
                            if (rest[city] !== undefined) {
                              const val = parseNumericValue(rest[city]);
                              row[city] = val;
                              total += val;
                            } else {
                              row[city] = null;
                            }
                          });
                          if (selectedCities.length >= 2) {
                            row["Total Selecionadas"] = total;
                          }
                          return row;
                        });
                        const cols = [
                          "Setor",
                          ...selectedCities,
                          ...(selectedCities.length >= 2 ? ["Total Selecionadas"] : [])
                        ];
                        return exportToCSV(
                          rows,
                          buildExportFilename("forca_trabalho", { cities: selectedCities }),
                          cols
                        );
                      }
                    }}
                    onExportPNG={() =>
                      exportChartAsPNG(
                        "card-forca-trabalho",
                        buildExportFilename("forca_trabalho", {
                          cities:
                            showPieChart && activePieCity !== "Total"
                              ? [activePieCity]
                              : selectedCities,
                          suffix: showPieChart ? "proporcao" : undefined
                        })
                      )
                    }
                  />
                  <StatusBadge statusInfo={statusFuncionarios} />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-2 no-export print:hidden">
                <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                  <button
                    type="button"
                    aria-pressed={showPieChart}
                    onClick={() => setShowPieChart(true)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all cursor-pointer ${FOCUS_RING_CLASS} ${
                      showPieChart ? "bg-site-surface shadow-sm text-primary font-medium" : "text-slate-600 hover:text-slate-800"
                    }`}
                    title="Visão em Pizza (Proporção)"
                  >
                    <PieChartIcon className="h-4 w-4" />
                    <span className="text-xs hidden sm:inline">Pizza</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={!showPieChart}
                    onClick={() => setShowPieChart(false)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all cursor-pointer ${FOCUS_RING_CLASS} ${
                      !showPieChart ? "bg-site-surface shadow-sm text-primary font-medium" : "text-slate-600 hover:text-slate-800"
                    }`}
                    title="Visão em Barras (Comparativo)"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-xs hidden sm:inline">Barras</span>
                  </button>
                </div>

                {showPieChart && selectedCities.length > 1 && (
                  <select
                    aria-label="Selecionar município para gráfico de pizza"
                    value={activePieCity}
                    onChange={(e) => setPieChartCity(e.target.value)}
                    className={`text-sm border border-slate-200 rounded-md p-1.5 bg-site-surface text-slate-700 shadow-sm ${FOCUS_RING_CLASS}`}
                  >
                    <option value="Total">Todas Selecionadas</option>
                    {selectedCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </CardHeader>
            <CardContent className="h-[400px] bg-slate-50/80 pt-4 border-t border-slate-100">
              {!isComparing ? (
                <EmptyChartState message="Selecione ao menos uma cidade para visualizar a força de trabalho." />
              ) : !hasForcaTrabalhoData ? (
                <EmptyChartState message="Nenhum registro de funcionários disponível para o recorte selecionado." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {showPieChart ? (
                    <PieChart margin={{ top: 10, right: 16, left: 16, bottom: 10 }}>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="46%"
                        innerRadius="34%"
                        outerRadius="62%"
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={renderCustomizedLabel}
                        labelLine={true}
                      >
                        {pieChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number | string) => formatNumber(value)}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #EAF4E9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                      />
                    </PieChart>
                  ) : (
                    <BarChart data={chartDataFuncionarios} margin={{ top: 20, right: 10, left: 0, bottom: 70 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF4E9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#292929" }} interval={0} angle={-35} textAnchor="end" height={80} />
                      <YAxis tick={{ fontSize: 12, fill: "#292929" }} width={50} tickFormatter={formatNumber} allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: "#EAF4E9" }}
                        formatter={(value: number | string) => formatNumber(value)}
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px", paddingBottom: "8px" }} />
                      {dataKeys.map((key, i) => (
                        <Bar
                          key={key}
                          dataKey={key}
                          fill={CITY_COLORS[i % CITY_COLORS.length]}
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </CardContent>
            <ChartExportFooter
              scope={showPieChart ? activePieScopeLabel : selectedCitiesScopeLabel}
              warningNote={getStatusWarningNote(statusFuncionarios)}
            />
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8 mb-12 print:block print:space-y-8">
          {/* Gráfico de Estoque Acumulado */}
          <Card
            id="card-estoque"
            className="shadow-sm hover:shadow-md transition-shadow border-slate-100 print:shadow-none print:border-slate-200 print:break-inside-avoid"
          >
            <CardHeader className="pb-2">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl text-slate-800">Estoque Acumulado de Empregos</CardTitle>
                  <CardDescription>
                    Série histórica do volume de vagas ativas ({estoquePeriodMeta.display}
                    <span className="no-export print:hidden"> — aplica-se também ao Saldo de Postos</span>).
                  </CardDescription>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 no-export print:hidden">
                  {/* Filtros de Tempo */}
                  <div ref={customDateRef} className="flex flex-col gap-2 no-export print:hidden max-w-full">
                    <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 self-end relative">
                      <button
                        type="button"
                        aria-pressed={timeFilter === "6m"}
                        onClick={() => {
                          setTimeFilter("6m");
                          setIsCustomDateOpen(false);
                        }}
                        className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors cursor-pointer ${FOCUS_RING_CLASS} ${
                          timeFilter === "6m" ? "bg-site-surface shadow-sm text-primary font-medium" : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        6 Meses
                      </button>
                      <button
                        type="button"
                        aria-pressed={timeFilter === "12m"}
                        onClick={() => {
                          setTimeFilter("12m");
                          setIsCustomDateOpen(false);
                        }}
                        className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors cursor-pointer ${FOCUS_RING_CLASS} ${
                          timeFilter === "12m" ? "bg-site-surface shadow-sm text-primary font-medium" : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        1 Ano
                      </button>
                      <button
                        type="button"
                        aria-pressed={timeFilter === "all"}
                        onClick={() => {
                          setTimeFilter("all");
                          setIsCustomDateOpen(false);
                        }}
                        className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors cursor-pointer ${FOCUS_RING_CLASS} ${
                          timeFilter === "all" ? "bg-site-surface shadow-sm text-primary font-medium" : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        Tudo
                      </button>

                      <div>
                        <button
                          type="button"
                          aria-pressed={timeFilter === "custom"}
                          aria-expanded={isCustomDateOpen}
                          onClick={() => {
                            if (!isCustomDateOpen) {
                              setDraftStartMonth(startMonth);
                              setDraftStartYear(startYear);
                              setDraftEndMonth(endMonth);
                              setDraftEndYear(endYear);
                            }
                            setIsCustomDateOpen((prev) => !prev);
                          }}
                          className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors flex items-center cursor-pointer ${FOCUS_RING_CLASS} ${
                            timeFilter === "custom" ? "bg-site-surface shadow-sm text-primary font-medium" : "text-slate-600 hover:text-slate-800"
                          }`}
                        >
                          Personalizado
                          <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${isCustomDateOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isCustomDateOpen && (
                          <div className="absolute top-full right-0 mt-2 p-4 bg-site-surface border border-slate-200 rounded-xl shadow-xl z-50 w-72 origin-top-right">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-slate-700">Período Personalizado</h4>
                              <button
                                type="button"
                                onClick={() => setIsCustomDateOpen(false)}
                                aria-label="Fechar seletor de período"
                                className={`text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 cursor-pointer ${FOCUS_RING_CLASS}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex flex-col gap-3">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label htmlFor="custom-start-month" className="text-xs text-slate-600 font-medium">
                                    Data Inicial
                                  </label>
                                  {(draftStartMonth || draftStartYear) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDraftStartMonth("");
                                        setDraftStartYear("");
                                      }}
                                      aria-label="Limpar data inicial"
                                      className={`text-slate-500 hover:text-red-600 transition-colors cursor-pointer rounded ${FOCUS_RING_CLASS}`}
                                      title="Limpar Data Inicial"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <select
                                    id="custom-start-month"
                                    aria-label="Mês inicial"
                                    value={draftStartMonth}
                                    onChange={(e) => setDraftStartMonth(e.target.value)}
                                    className={`w-1/2 text-sm border border-slate-200 rounded-md bg-slate-50 p-2 text-slate-700 ${FOCUS_RING_CLASS}`}
                                  >
                                    <option value="">Mês...</option>
                                    {MONTHS_LIST.map((m) => (
                                      <option key={`sm-${m.value}`} value={m.value}>
                                        {m.label}
                                      </option>
                                    ))}
                                  </select>
                                  <select
                                    id="custom-start-year"
                                    aria-label="Ano inicial"
                                    value={draftStartYear}
                                    onChange={(e) => setDraftStartYear(e.target.value)}
                                    className={`w-1/2 text-sm border border-slate-200 rounded-md bg-slate-50 p-2 text-slate-700 ${FOCUS_RING_CLASS}`}
                                  >
                                    <option value="">Ano...</option>
                                    {availableYears.map((y) => (
                                      <option key={`sy-${y}`} value={y}>
                                        {y}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label htmlFor="custom-end-month" className="text-xs text-slate-600 font-medium">
                                    Data Final
                                  </label>
                                  {(draftEndMonth || draftEndYear) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDraftEndMonth("");
                                        setDraftEndYear("");
                                      }}
                                      aria-label="Limpar data final"
                                      className={`text-slate-500 hover:text-red-600 transition-colors cursor-pointer rounded ${FOCUS_RING_CLASS}`}
                                      title="Limpar Data Final"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <select
                                    id="custom-end-month"
                                    aria-label="Mês final"
                                    value={draftEndMonth}
                                    onChange={(e) => setDraftEndMonth(e.target.value)}
                                    className={`w-1/2 text-sm border border-slate-200 rounded-md bg-slate-50 p-2 text-slate-700 ${FOCUS_RING_CLASS}`}
                                  >
                                    <option value="">Mês...</option>
                                    {MONTHS_LIST.map((m) => (
                                      <option key={`em-${m.value}`} value={m.value}>
                                        {m.label}
                                      </option>
                                    ))}
                                  </select>
                                  <select
                                    id="custom-end-year"
                                    aria-label="Ano final"
                                    value={draftEndYear}
                                    onChange={(e) => setDraftEndYear(e.target.value)}
                                    className={`w-1/2 text-sm border border-slate-200 rounded-md bg-slate-50 p-2 text-slate-700 ${FOCUS_RING_CLASS}`}
                                  >
                                    <option value="">Ano...</option>
                                    {availableYears.map((y) => (
                                      <option key={`ey-${y}`} value={y}>
                                        {y}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {isDraftRangeInvalid && (
                                <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
                                  A data inicial não pode ser posterior à data final.
                                </p>
                              )}
                              {!isDraftRangeComplete && (
                                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2">
                                  Preencha mês e ano inicial e final para aplicar o filtro.
                                </p>
                              )}

                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  disabled={!isDraftRangeComplete || isDraftRangeInvalid}
                                  onClick={() => {
                                    if (!isDraftRangeComplete || isDraftRangeInvalid) return;
                                    setStartMonth(draftStartMonth);
                                    setStartYear(draftStartYear);
                                    setEndMonth(draftEndMonth);
                                    setEndYear(draftEndYear);
                                    setTimeFilter("custom");
                                    setIsCustomDateOpen(false);
                                  }}
                                  className={`px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS_RING_CLASS}`}
                                >
                                  Aplicar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 no-export print:hidden">
                    <ExportMenu
                      label="Estoque Acumulado de Empregos"
                      disabledCSV={isCustomRangeInvalid || chartDataEstoque.length === 0}
                      disabledPNG={isCustomRangeInvalid || chartDataEstoque.length === 0}
                      onExportCSV={() => {
                        const cityCols = selectedCities.map((c) => `${c} (vagas ativas)`);
                        const rows: ExportRow[] = chartDataEstoque.map(({ data, ...rest }) => {
                          const dataStr = String(data ?? "");
                          const [ano, mes] = dataStr.split("-");
                          const row: ExportRow = {
                            Competência: dataStr,
                            Ano: ano ? Number.parseInt(ano, 10) : null,
                            Mês: mes ? Number.parseInt(mes, 10) : null
                          };
                          let total = 0;
                          selectedCities.forEach((city) => {
                            const colKey = `${city} (vagas ativas)`;
                            if (rest[city] !== undefined) {
                              const val = parseNumericValue(rest[city]);
                              row[colKey] = val;
                              total += val;
                            } else {
                              row[colKey] = null;
                            }
                          });
                          if (selectedCities.length >= 2) {
                            row["Total Selecionadas (vagas ativas)"] = total;
                          }
                          return row;
                        });
                        const cols = [
                          "Competência",
                          "Ano",
                          "Mês",
                          ...cityCols,
                          ...(selectedCities.length >= 2 ? ["Total Selecionadas (vagas ativas)"] : [])
                        ];
                        return exportToCSV(
                          rows,
                          buildExportFilename("estoque_acumulado", {
                            cities: selectedCities,
                            period: estoquePeriodMeta.slug
                          }),
                          cols
                        );
                      }}
                      onExportPNG={() =>
                        exportChartAsPNG(
                          "card-estoque",
                          buildExportFilename("estoque_acumulado", {
                            cities: selectedCities,
                            period: estoquePeriodMeta.slug
                          })
                        )
                      }
                    />
                    <StatusBadge statusInfo={statusEstoque} />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[400px] bg-slate-50/80 pt-4 border-t border-slate-100">
              {isCustomRangeInvalid ? (
                <div className="h-full flex items-center justify-center text-sm text-red-600 font-medium text-center px-6">
                  Intervalo inválido: ajuste a data inicial e final para visualizar a série histórica.
                </div>
              ) : !isComparing ? (
                <EmptyChartState message="Selecione ao menos uma cidade para visualizar a série histórica de estoque." />
              ) : chartDataEstoque.length === 0 ? (
                <EmptyChartState message="Nenhum dado de estoque acumulado disponível para o período selecionado." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataEstoque} margin={{ top: 20, right: 30, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF4E9" />
                    <XAxis dataKey="data" tickFormatter={formatXAxisDate} tick={{ fontSize: 12, fill: "#292929" }} height={50} dy={15} />
                    <YAxis tick={{ fontSize: 12, fill: "#292929" }} width={55} tickFormatter={formatNumber} allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(label) => formatTooltipDate(String(label))}
                      formatter={(value: number | string) => formatNumber(value)}
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px", paddingBottom: "10px" }} />
                    {dataKeys.map((key, i) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={CITY_COLORS[i % CITY_COLORS.length]}
                        strokeWidth={3}
                        dot={{ r: 3, fill: CITY_COLORS[i % CITY_COLORS.length], strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
            <ChartExportFooter
              scope={selectedCitiesScopeLabel}
              period={estoquePeriodMeta.display}
              warningNote={getStatusWarningNote(statusEstoque)}
            />
          </Card>
        </div>

        {/* Seção: Análises Exploratórias */}
        <div className="pt-8 border-t border-slate-200">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-2xl font-bold text-slate-800">Análises Exploratórias</h2>
            <span className="text-xs font-medium text-slate-500">
              Recorte temporal ativo: <strong className="text-slate-700">{postosPeriodMeta.display}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:space-y-8">
            {/* Gráfico 1: Saldo de Postos (Barras agrupadas com linha de referência em zero e legenda) */}
            <Card
              id="card-postos"
              className="shadow-sm hover:shadow-md transition-shadow border-slate-100 print:shadow-none print:border-slate-200 print:break-inside-avoid"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg text-slate-800">Saldo de Postos (Admissões vs Demissões)</CardTitle>
                    <CardDescription>Balanço líquido mensal de empregos gerados ({postosPeriodMeta.display}).</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 no-export print:hidden">
                    <ExportMenu
                      label="Saldo de Postos"
                      disabledCSV={isCustomRangeInvalid || chartDataPostos.length === 0}
                      disabledPNG={isCustomRangeInvalid || chartDataPostos.length === 0}
                      onExportCSV={() => {
                        const cityCols = selectedCities.map((c) => `${c} (saldo de vagas)`);
                        const rows: ExportRow[] = chartDataPostos.map(({ data, ...rest }) => {
                          const dataStr = String(data ?? "");
                          const [ano, mes] = dataStr.split("-");
                          const row: ExportRow = {
                            Competência: dataStr,
                            Ano: ano ? Number.parseInt(ano, 10) : null,
                            Mês: mes ? Number.parseInt(mes, 10) : null
                          };
                          let total = 0;
                          selectedCities.forEach((city) => {
                            const colKey = `${city} (saldo de vagas)`;
                            if (rest[city] !== undefined) {
                              const val = parseNumericValue(rest[city]);
                              row[colKey] = val;
                              total += val;
                            } else {
                              row[colKey] = null;
                            }
                          });
                          if (selectedCities.length >= 2) {
                            row["Total Selecionadas (saldo de vagas)"] = total;
                          }
                          return row;
                        });
                        const cols = [
                          "Competência",
                          "Ano",
                          "Mês",
                          ...cityCols,
                          ...(selectedCities.length >= 2 ? ["Total Selecionadas (saldo de vagas)"] : [])
                        ];
                        return exportToCSV(
                          rows,
                          buildExportFilename("saldo_postos", {
                            cities: selectedCities,
                            period: postosPeriodMeta.slug
                          }),
                          cols
                        );
                      }}
                      onExportPNG={() =>
                        exportChartAsPNG(
                          "card-postos",
                          buildExportFilename("saldo_postos", {
                            cities: selectedCities,
                            period: postosPeriodMeta.slug
                          })
                        )
                      }
                    />
                    <StatusBadge statusInfo={statusPostos} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[360px] bg-slate-50/80 pt-4 border-t border-slate-100">
                {isCustomRangeInvalid ? (
                  <div className="h-full flex items-center justify-center text-sm text-red-600 font-medium text-center px-6">
                    Intervalo inválido: ajuste a data inicial e final para visualizar a série histórica.
                  </div>
                ) : !isComparing ? (
                  <EmptyChartState message="Selecione ao menos uma cidade para visualizar o saldo de postos." />
                ) : chartDataPostos.length === 0 ? (
                  <EmptyChartState message="Nenhum dado de saldo de postos disponível para o período selecionado." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataPostos} margin={{ top: 10, right: 15, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF4E9" />
                      <XAxis dataKey="data" tickFormatter={formatXAxisDate} tick={{ fontSize: 11, fill: "#292929" }} dy={8} />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#292929" }}
                        width={45}
                        tickFormatter={formatNumber}
                        allowDecimals={false}
                        domain={[(dataMin: number) => Math.min(0, dataMin), (dataMax: number) => Math.max(0, dataMax)]}
                      />
                      <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4" ifOverflow="extendDomain" />
                      <Tooltip
                        cursor={{ fill: "#EAF4E9" }}
                        labelFormatter={(label) => formatTooltipDate(String(label))}
                        formatter={(value: number | string) => {
                          const num = parseNumericValue(value);
                          return `${num > 0 ? "+" : ""}${formatNumber(num)} vagas`;
                        }}
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      />
                      <Legend verticalAlign="top" height={34} wrapperStyle={{ fontSize: "12px" }} />
                      {dataKeys.map((key, i) => (
                        <Bar
                          key={key}
                          dataKey={key}
                          fill={CITY_COLORS[i % CITY_COLORS.length]}
                          radius={[3, 3, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
              <ChartExportFooter
                scope={selectedCitiesScopeLabel}
                period={postosPeriodMeta.display}
                warningNote={getStatusWarningNote(statusPostos)}
              />
            </Card>

            {/* Gráfico 2: Radar - Perfil Turístico */}
            <Card
              id="card-perfil"
              className="shadow-sm hover:shadow-md transition-shadow border-slate-100 print:shadow-none print:border-slate-200 print:break-inside-avoid"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg text-slate-800">Perfil Turístico (Setores)</CardTitle>
                    <CardDescription>Distribuição proporcional de estabelecimentos por segmento.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 no-export print:hidden">
                    <ExportMenu
                      label="Perfil Turístico"
                      disabledCSV={radarData.length === 0}
                      disabledPNG={radarData.length === 0}
                      onExportCSV={() => {
                        const rows: ExportRow[] = radarData.map(({ name, ...rest }) => {
                          const row: ExportRow = { Setor: name };
                          selectedCities.forEach((city) => {
                            const total = radarCityTotals[city] || 0;
                            if (rest[city] !== undefined) {
                              const val = parseNumericValue(rest[city]);
                              row[city] = val;
                              row[`${city} (%)`] = total > 0 ? roundOneDecimal((val / total) * 100) : 0;
                            } else {
                              row[city] = null;
                              row[`${city} (%)`] = null;
                            }
                          });
                          return row;
                        });
                        const cols = [
                          "Setor",
                          ...selectedCities.flatMap((c) => [c, `${c} (%)`])
                        ];
                        return exportToCSV(
                          rows,
                          buildExportFilename("perfil_turistico", { cities: selectedCities }),
                          cols
                        );
                      }}
                      onExportPNG={() =>
                        exportChartAsPNG(
                          "card-perfil",
                          buildExportFilename("perfil_turistico", { cities: selectedCities })
                        )
                      }
                    />
                    <StatusBadge statusInfo={statusEstabelecimentos} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[360px] bg-slate-50/80 pt-4 border-t border-slate-100">
                {!isComparing ? (
                  <EmptyChartState message="Selecione ao menos uma cidade para comparar o perfil turístico." />
                ) : radarData.length === 0 ? (
                  <EmptyChartState message="Nenhum dado setorial disponível para compor o radar." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="56%" data={radarData}>
                      <PolarGrid stroke="#d1e7d0" />
                      <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "#292929" }} />
                      <PolarRadiusAxis angle={30} domain={[0, "auto"]} tick={{ fontSize: 10 }} tickFormatter={formatNumber} />
                      <Tooltip
                        formatter={(value: number | string, name: string) => {
                          const num = parseNumericValue(value);
                          const total = radarCityTotals[name] || 0;
                          const pct = total > 0 ? ((num / total) * 100).toFixed(1).replace(".", ",") : "0,0";
                          return [`${formatNumber(num)} (${pct}%)`, name];
                        }}
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      />
                      <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: "12px" }} />
                      {dataKeys.map((key, i) => (
                        <Radar
                          key={key}
                          name={key}
                          dataKey={key}
                          stroke={CITY_COLORS[i % CITY_COLORS.length]}
                          fill={CITY_COLORS[i % CITY_COLORS.length]}
                          fillOpacity={0.35}
                        />
                      ))}
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
              <ChartExportFooter
                scope={selectedCitiesScopeLabel}
                warningNote={getStatusWarningNote(statusEstabelecimentos)}
              />
            </Card>

            {/* Gráfico 3: Ranking de Cidades */}
            {selectedCities.length <= 1 && (
              <Card
                id="card-ranking"
                className="shadow-sm hover:shadow-md transition-shadow border-slate-100 lg:col-span-2 print:shadow-none print:border-slate-200 print:break-inside-avoid"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg text-slate-800">Top 10 Volume de Funcionários</CardTitle>
                      <CardDescription>
                        Os municípios com maior força de trabalho no turismo regional
                        {selectedCities.length === 1 &&
                        chartDataRanking.some(
                          (r) => normalizeText(r.cidade) === normalizeText(selectedCities[0])
                        )
                          ? ` (destaque em verde escuro: ${selectedCities[0]}).`
                          : "."}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 no-export print:hidden">
                      <ExportMenu
                        label="Top 10 Volume de Funcionários"
                        disabledCSV={chartDataRanking.length === 0}
                        disabledPNG={chartDataRanking.length === 0}
                        onExportCSV={() => {
                          const totalTop10 = chartDataRanking.reduce(
                            (sum, r) => sum + r.funcionarios,
                            0
                          );
                          return exportToCSV(
                            chartDataRanking.map((r, index) => ({
                              Posição: index + 1,
                              Município: r.cidade,
                              Funcionários: r.funcionarios,
                              "Participação no Top 10 (%)":
                                totalTop10 > 0
                                  ? roundOneDecimal((r.funcionarios / totalTop10) * 100)
                                  : 0
                            })),
                            buildExportFilename("ranking_top10_funcionarios"),
                            ["Posição", "Município", "Funcionários", "Participação no Top 10 (%)"]
                          );
                        }}
                        onExportPNG={() =>
                          exportChartAsPNG(
                            "card-ranking",
                            buildExportFilename("ranking_top10_funcionarios")
                          )
                        }
                      />
                      <StatusBadge statusInfo={statusRanking} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-[360px] bg-slate-50/80 pt-4 border-t border-slate-100">
                  {chartDataRanking.length === 0 ? (
                    <EmptyChartState message="Nenhum dado disponível para o ranking regional de funcionários." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataRanking} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EAF4E9" />
                        <XAxis type="number" tick={{ fontSize: 11, fill: "#292929" }} tickFormatter={formatNumber} allowDecimals={false} />
                        <YAxis dataKey="cidade" type="category" tick={{ fontSize: 11, fill: "#292929" }} width={110} />
                        <Tooltip
                          cursor={{ fill: "#EAF4E9" }}
                          formatter={(value: number | string) => formatNumber(value)}
                          contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        />
                        <Bar dataKey="funcionarios" name="Funcionários" fill="#2E7D32" radius={[0, 4, 4, 0]}>
                          {chartDataRanking.map((entry, index) => {
                            const isSelected = selectedCities.some(
                              (c) => normalizeText(c) === normalizeText(entry.cidade)
                            );
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={isSelected ? "#1D5C1B" : "#2E7D32"}
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
                <ChartExportFooter
                  scope="Top 10 municípios do Sul de Minas"
                  warningNote={getStatusWarningNote(statusRanking)}
                />
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
