"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  Building2,
  UtensilsCrossed,
  Users,
  TrendingUp,
  X,
  Info,
  AlertCircle,
  BarChart3,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Globe,
  Sparkles,
  Calendar,
  Compass,
  Award,
  BarChart2,
  Maximize2,
  Layers,
  GraduationCap
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ReferenceLine
} from "recharts";
import {
  AnalyticsRecord,
  clearAnalyticsCache,
  fetchJSONAndFlatten,
  getCodigoIBGEParaGraficos,
  hasCachedData,
  hasFetchError,
  normalizarClassificacaoCurta,
  normalizeText,
  parseNumericValue
} from "@/lib/api";
import {
  formatarPopulacao,
  formatarPIB,
  formatarIDH,
  getIDHClass,
  formatarHospedagem,
  formatarRestaurantes,
  formatarMUNIC,
  formatarPNAD,
  formatarArea,
  formatarDensidade,
  formatarEscolarizacao
} from "@/lib/formatters";
import axios from "axios";
import { NoticiaCard } from "@/components/NoticiaCard";
import { getWebsiteApiBaseUrl } from "@/lib/website-api";

interface MonthlySaldoItem {
  Mês: string;
  MesLabel: string;
  MesCompleto: string;
  Saldo: number;
}

interface CombinedCityItem {
  Classificação: string;
  ClassificacaoOriginal: string;
  Estabelecimentos: number;
  Funcionarios: number;
}

interface SectorAuditState {
  hasEst: boolean;
  hasFunc: boolean;
  missingEstSectors: string[];
  missingFuncSectors: string[];
  failedBases: string[];
  regionalMonthsByYear: Record<string, string[]>;
  isRegionalPostos: boolean;
  unexpectedError: boolean;
}

const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES_COMPLETOS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function formatarNumeroGrafico(val: number | string | undefined): string {
  const num = parseNumericValue(val);
  return new Intl.NumberFormat("pt-BR").format(num);
}

function agregarPostosPorMes(registros: AnalyticsRecord[], year: string): MonthlySaldoItem[] {
  const targetYear = year.trim();
  if (!/^\d{4}$/.test(targetYear)) return [];

  const porMes = new Map<string, number>();
  registros.forEach((r) => {
    const rowYear = String(r.Ano ?? "").trim();
    if (rowYear !== targetYear) return;
    const mesRaw = String(r.Mês ?? "").trim();
    if (!/^\d{1,2}$/.test(mesRaw)) return;
    const mesNum = Number.parseInt(mesRaw, 10);
    if (mesNum < 1 || mesNum > 12) return;
    const mes = String(mesNum).padStart(2, "0");
    const saldo = parseNumericValue(r.Saldo);
    porMes.set(mes, (porMes.get(mes) || 0) + saldo);
  });

  return Array.from(porMes.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, saldo]) => {
      const idx = parseInt(mes, 10) - 1;
      return {
        Mês: mes,
        MesLabel: MESES_CURTOS[idx] || mes,
        MesCompleto: `${MESES_COMPLETOS[idx] || mes} de ${targetYear}`,
        Saldo: saldo
      };
    });
}

interface CidadeDetalhesModalProps {
  cidade: ApiCidade;
  allNoticias?: ApiNoticia[];
  noticiasLoading?: boolean;
  noticiasError?: boolean;
  onSelectNoticia: (noticia: ApiNoticia) => void;
  onClose: () => void;
}

function formatarDataEvento(dateStr?: string): { dia: string; mes: string; dataFormatada: string } {
  if (!dateStr) return { dia: "—", mes: "—", dataFormatada: "Data a definir" };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { dia: "—", mes: "—", dataFormatada: dateStr };
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase();
    const dataFormatada = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    return { dia, mes, dataFormatada };
  } catch {
    return { dia: "—", mes: "—", dataFormatada: dateStr };
  }
}

function temIndicador(valor: unknown): boolean {
  return valor !== null && valor !== undefined && String(valor).trim() !== "";
}

export function CidadeDetalhesModal({ cidade, allNoticias = [], noticiasLoading = false, noticiasError = false, onSelectNoticia, onClose }: CidadeDetalhesModalProps) {
  const [imageError, setImageError] = useState(false);
  const [cidadeDetalhesApi, setCidadeDetalhesApi] = useState<ApiCidade | null>(null);
  const [estadoNomeApi, setEstadoNomeApi] = useState<string | null>(null);
  const [rawPostosCity, setRawPostosCity] = useState<AnalyticsRecord[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [combinedData, setCombinedData] = useState<CombinedCityItem[]>([]);
  const [loadingRealData, setLoadingRealData] = useState(true);
  const [progressRealData, setProgressRealData] = useState(0);
  const [progressMessage, setProgressMessage] = useState("Conectando aos dados da cidade...");
  const [sectorAudit, setSectorAudit] = useState<SectorAuditState>({
    hasEst: false,
    hasFunc: false,
    missingEstSectors: [],
    missingFuncSectors: [],
    failedBases: [],
    regionalMonthsByYear: {},
    isRegionalPostos: false,
    unexpectedError: false
  });
  const [statusPinned, setStatusPinned] = useState(false);
  const [statusHovered, setStatusHovered] = useState(false);
  const [statusFocused, setStatusFocused] = useState(false);
  const [statusDismissed, setStatusDismissed] = useState(false);
  const statusBadgeRef = useRef<HTMLDivElement>(null);
  const statusTooltipId = useId();
  const [graphsFetchError, setGraphsFetchError] = useState<string | null>(null);
  const [graphsReloadKey, setGraphsReloadKey] = useState(0);

  // Pontos Turísticos e Eventos reais da API
  const [pontosTuristicos, setPontosTuristicos] = useState<ApiPontoTuristico[]>([]);
  const [eventos, setEventos] = useState<ApiEventos[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const noticiasDaCidade = allNoticias
    .filter((noticia) => String(noticia.cidade ?? "") === String(cidade.id))
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  // A resposta detalhada /cidades/{id}/ contém os indicadores dentro de "information".
  useEffect(() => {
    let active = true;
    setCidadeDetalhesApi(null);

    let baseUrl: string;
    try {
      baseUrl = getWebsiteApiBaseUrl();
    } catch (error) {
      console.error("Erro ao configurar a API do site:", error);
      return () => { active = false; };
    }
    axios.get<ApiCidade>(`${baseUrl}/cidades/${encodeURIComponent(cidade.id)}/`)
      .then((response) => {
        if (active) setCidadeDetalhesApi(response.data);
      })
      .catch((error) => {
        console.warn(`Não foi possível carregar os indicadores de ${cidade.name}:`, error);
      });

    return () => { active = false; };
  }, [cidade.id, cidade.name]);

  useEffect(() => {
    let active = true;
    setEstadoNomeApi(null);
    const stateId = cidadeDetalhesApi?.state ?? cidade.state;
    if (stateId === null || stateId === undefined) {
      return () => { active = false; };
    }

    let baseUrl: string;
    try {
      baseUrl = getWebsiteApiBaseUrl();
    } catch (error) {
      console.error("Erro ao configurar a API do site:", error);
      return () => { active = false; };
    }
    axios.get<ApiEstado>(`${baseUrl}/estados/${encodeURIComponent(String(stateId))}/`)
      .then((response) => {
        if (active) setEstadoNomeApi(response.data.name);
      })
      .catch((error) => {
        console.warn(`Não foi possível carregar o estado da cidade ${cidade.name}:`, error);
      });

    return () => { active = false; };
  }, [cidade.id, cidade.name, cidade.state, cidadeDetalhesApi?.state]);

  const cidadeId = cidade?.id;
  const cidadeName = cidade?.name ?? "";
  const cidadeIbgeCode = cidade?.ibge_code;

  // 1. Buscar dados analíticos da API de gráficos
  useEffect(() => {
    let active = true;
    if (!cidadeName) {
      setLoadingRealData(false);
      return () => {
        active = false;
      };
    }

    const loadGraphs = async () => {
      setLoadingRealData(true);
      setGraphsFetchError(null);
      setCombinedData([]);
      setRawPostosCity([]);
      setAvailableYears([]);
      setSelectedYear("");
      setStatusPinned(false);
      setStatusDismissed(false);
      setSectorAudit({
        hasEst: false,
        hasFunc: false,
        missingEstSectors: [],
        missingFuncSectors: [],
        failedBases: [],
        regionalMonthsByYear: {},
        isRegionalPostos: false,
        unexpectedError: false
      });

      const rawUrl = (process.env.NEXT_PUBLIC_GRAPHS_URL ?? "").trim();
      const baseUrl = (rawUrl || "/api/externo").replace(/\/$/, "");
      const codigoIBGE = getCodigoIBGEParaGraficos(cidadeIbgeCode);
      const postosUrl = codigoIBGE
        ? `${baseUrl}/postos_de_trabalho/?codigo_ibge=${codigoIBGE}`
        : `${baseUrl}/postos_de_trabalho/`;

      const hasAllCached =
        hasCachedData("estabelecimentos") &&
        hasCachedData("funcionarios") &&
        (hasCachedData("postos", postosUrl) || Boolean(codigoIBGE && hasCachedData("postos")));

      setProgressRealData(hasAllCached ? 95 : 15);
      setProgressMessage(hasAllCached ? "Carregando dados em cache..." : "Consultando bases do município (0/3)...");

      try {
        let completed = 0;
        const total = 3;
        const stepMessages = [
          "Processando estabelecimentos e vínculos (1/3)...",
          "Mapeando postos de trabalho do município (2/3)...",
          "Consolidando indicadores setoriais (3/3)..."
        ];

        const onStepComplete = () => {
          completed++;
          if (!active) return;
          setProgressRealData((prev) => Math.max(prev, Math.min(95, Math.floor((completed / total) * 100))));
          setProgressMessage(stepMessages[completed - 1] || "Finalizando gráficos...");
        };

        const [estData, funcData, postosData] = await Promise.all([
          fetchJSONAndFlatten(`${baseUrl}/estabelecimentos/`, "estabelecimentos").then((d) => {
            onStepComplete();
            return d;
          }),
          fetchJSONAndFlatten(`${baseUrl}/funcionarios/`, "funcionarios").then((d) => {
            onStepComplete();
            return d;
          }),
          fetchJSONAndFlatten(postosUrl, "postos").then((d) => {
            onStepComplete();
            return d;
          })
        ]);

        if (!active) return;

        const failedBases: string[] = [];
        if (hasFetchError("estabelecimentos")) failedBases.push("Estabelecimentos");
        if (hasFetchError("funcionarios")) failedBases.push("Funcionários");
        if (hasFetchError("postos", postosUrl)) failedBases.push("Saldo de Postos");

        if (failedBases.length > 0) {
          setGraphsFetchError(
            failedBases.length === 3
              ? "Não foi possível carregar os indicadores econômicos do município no momento."
              : `Algumas bases não puderam ser carregadas (${failedBases.join(", ")}).`
          );
        }

        const cityTarget = normalizeText(cidadeName);

        // Comparação exata após normalização Unicode (evita misturar cidades como "Caldas" e "Poços de Caldas")
        const matchRecordCity = (r: AnalyticsRecord) => {
          const rowMun = normalizeText(r.Município);
          return Boolean(rowMun) && rowMun === cityTarget;
        };

        const estCity = (estData || []).filter(matchRecordCity);
        const funcCity = (funcData || []).filter(matchRecordCity);
        let postosCity = (postosData || []).filter(matchRecordCity);

        // Fallback seguro quando a consulta municipal direta por codigo_ibge traz nome ligeiramente divergente
        if (codigoIBGE && postosCity.length === 0 && postosData.length > 0) {
          const distinctPostosCities = new Set(
            postosData.map((r) => normalizeText(r.Município)).filter(Boolean)
          );
          if (distinctPostosCities.size === 1) {
            postosCity = postosData;
          }
        }

        setRawPostosCity(postosCity);
        const years = Array.from(
          new Set(
            postosCity
              .map((p) => String(p.Ano ?? "").trim())
              .filter((y) => /^\d{4}$/.test(y))
          )
        ).sort((a, b) => Number(b) - Number(a));
        setAvailableYears(years);

        const defaultYear = years.length > 0 ? years[0] : "";
        setSelectedYear(defaultYear);

        const mapCombined = new Map<string, CombinedCityItem>();
        estCity.forEach((e) => {
          const shortClass = normalizarClassificacaoCurta(e.Classificação);
          const current = mapCombined.get(shortClass) || {
            Classificação: shortClass,
            ClassificacaoOriginal: e.Classificação,
            Estabelecimentos: 0,
            Funcionarios: 0
          };
          current.Estabelecimentos += parseNumericValue(e.Estabelecimentos);
          mapCombined.set(shortClass, current);
        });

        funcCity.forEach((f) => {
          const shortClass = normalizarClassificacaoCurta(f.Classificação);
          const current = mapCombined.get(shortClass) || {
            Classificação: shortClass,
            ClassificacaoOriginal: f.Classificação,
            Estabelecimentos: 0,
            Funcionarios: 0
          };
          current.Funcionarios += parseNumericValue(f.Funcionarios);
          mapCombined.set(shortClass, current);
        });

        const combined = Array.from(mapCombined.values()).sort(
          (a, b) => b.Estabelecimentos - a.Estabelecimentos
        );
        setCombinedData(combined);

        // Auditoria de completude setorial e metadados mensais por ano (reativa ao ano selecionado)
        const allEstSectors = new Set(
          estData.map((r) => normalizarClassificacaoCurta(r.Classificação)).filter(Boolean)
        );
        const allFuncSectors = new Set(
          funcData.map((r) => normalizarClassificacaoCurta(r.Classificação)).filter(Boolean)
        );
        const cityEstSectors = new Set(
          estCity.map((r) => normalizarClassificacaoCurta(r.Classificação)).filter(Boolean)
        );
        const cityFuncSectors = new Set(
          funcCity.map((r) => normalizarClassificacaoCurta(r.Classificação)).filter(Boolean)
        );

        const missingEstSectors = Array.from(allEstSectors).filter((s) => !cityEstSectors.has(s));
        const missingFuncSectors = Array.from(allFuncSectors).filter((s) => !cityFuncSectors.has(s));

        const distinctPostosCities = new Set(
          postosData.map((r) => normalizeText(r.Município)).filter(Boolean)
        );
        const isRegionalPostos = distinctPostosCities.size > 1;
        const regionalMonthsByYear: Record<string, string[]> = {};

        if (isRegionalPostos) {
          const monthSetsByYear = new Map<string, Set<string>>();
          postosData.forEach((r) => {
            const y = String(r.Ano ?? "").trim();
            const mTrim = String(r.Mês ?? "").trim();
            if (!/^\d{4}$/.test(y) || !/^\d{1,2}$/.test(mTrim)) return;
            const mNum = Number.parseInt(mTrim, 10);
            if (mNum < 1 || mNum > 12) return;
            const mPad = String(mNum).padStart(2, "0");
            if (!monthSetsByYear.has(y)) monthSetsByYear.set(y, new Set());
            monthSetsByYear.get(y)!.add(mPad);
          });
          monthSetsByYear.forEach((set, y) => {
            regionalMonthsByYear[y] = Array.from(set).sort();
          });
        }

        setSectorAudit({
          hasEst: estCity.length > 0,
          hasFunc: funcCity.length > 0,
          missingEstSectors,
          missingFuncSectors,
          failedBases,
          regionalMonthsByYear,
          isRegionalPostos,
          unexpectedError: false
        });
      } catch (err) {
        console.warn("API de gráficos indisponível:", err);
        if (!active) return;
        setCombinedData([]);
        setRawPostosCity([]);
        setAvailableYears([]);
        setSelectedYear("");
        setSectorAudit({
          hasEst: false,
          hasFunc: false,
          missingEstSectors: [],
          missingFuncSectors: [],
          failedBases: ["Estabelecimentos", "Funcionários", "Saldo de Postos"],
          regionalMonthsByYear: {},
          isRegionalPostos: false,
          unexpectedError: true
        });
        setGraphsFetchError("Não foi possível carregar os indicadores econômicos do município no momento.");
      } finally {
        if (active) {
          setProgressRealData(100);
          setLoadingRealData(false);
        }
      }
    };

    loadGraphs();
    return () => {
      active = false;
    };
  }, [cidadeId, cidadeName, cidadeIbgeCode, graphsReloadKey]);

  // 2. Buscar Pontos Turísticos e Eventos específicos da Cidade
  useEffect(() => {
    if (cidade) {
      const loadExtras = async () => {
        setLoadingExtras(true);
        try {
          const apiBaseUrl = getWebsiteApiBaseUrl();

          const [pontosRes, eventosRes] = await Promise.all([
            axios.get<ApiPagination<ApiPontoTuristico>>(`${apiBaseUrl}/pontos-turisticos/`).catch(() => ({ data: { results: [] } })),
            axios.get<ApiPagination<ApiEventos>>(`${apiBaseUrl}/eventos/`).catch(() => ({ data: { results: [] } }))
          ]);

          const matchCidade = (itemCidade: number | string | ApiCidade | undefined, itemCidadeName?: string) => {
            if (itemCidade !== undefined && itemCidade !== null) {
              if (typeof itemCidade === 'object') {
                if (itemCidade.id && String(itemCidade.id) === String(cidade.id)) return true;
                if (itemCidade.slug && itemCidade.slug === cidade.slug) return true;
              } else if (String(itemCidade) === String(cidade.id)) {
                return true;
              }
            }
            if (itemCidadeName && cidade.name && itemCidadeName.trim().toLowerCase() === cidade.name.trim().toLowerCase()) {
              return true;
            }
            return false;
          };

          const pontosDaCidade = ((pontosRes.data?.results || []) as ApiPontoTuristico[]).filter(p => matchCidade(p.cidade, p.cidade_name));
          const eventosDaCidade = ((eventosRes.data?.results || []) as ApiEventos[]).filter(e => matchCidade(e.cidade, e.cidade_name));

          setPontosTuristicos(pontosDaCidade);
          setEventos(eventosDaCidade);
        } catch (err) {
          console.warn("Erro ao carregar extras da cidade:", err);
        } finally {
          setLoadingExtras(false);
        }
      };
      loadExtras();
    }
  }, [cidade]);

  // Derivação memoizada da série mensal de postos, do radar e do status de integridade (reativo ao ano selecionado)
  const realPostos = useMemo<MonthlySaldoItem[]>(
    () => (selectedYear && rawPostosCity.length > 0 ? agregarPostosPorMes(rawPostosCity, selectedYear) : []),
    [rawPostosCity, selectedYear]
  );

  const radarData = useMemo(
    () => combinedData.filter((d) => d.Estabelecimentos > 0).slice(0, 6),
    [combinedData]
  );

  const totalEstabelecimentosCity = useMemo(
    () => radarData.reduce((sum, item) => sum + item.Estabelecimentos, 0),
    [radarData]
  );

  const { dataStatus, dataStatusDetail } = useMemo<{
    dataStatus: "complete" | "partial" | "unavailable";
    dataStatusDetail: string;
  }>(() => {
    if (sectorAudit.unexpectedError) {
      return {
        dataStatus: "unavailable",
        dataStatusDetail: "Falha inesperada ao consultar os indicadores econômicos."
      };
    }

    const {
      hasEst,
      hasFunc,
      missingEstSectors,
      missingFuncSectors,
      failedBases,
      regionalMonthsByYear,
      isRegionalPostos
    } = sectorAudit;
    const hasPostos = rawPostosCity.length > 0;
    const hasAnyFetchError = failedBases.length > 0;
    const activeYear = selectedYear || availableYears[0] || "";

    let missingPostosMonths: string[] = [];
    if (activeYear && hasPostos) {
      const cityMonthsInYear = new Set<string>();
      rawPostosCity.forEach((r) => {
        if (String(r.Ano ?? "").trim() !== activeYear) return;
        const trimmed = String(r.Mês ?? "").trim();
        if (!/^\d{1,2}$/.test(trimmed)) return;
        const num = Number.parseInt(trimmed, 10);
        if (num >= 1 && num <= 12) {
          cityMonthsInYear.add(String(num).padStart(2, "0"));
        }
      });

      let expectedMonths: string[] = [];
      if (isRegionalPostos && regionalMonthsByYear[activeYear]?.length) {
        expectedMonths = regionalMonthsByYear[activeYear];
      } else {
        const monthNums = Array.from(cityMonthsInYear).map((m) => Number.parseInt(m, 10));
        const maxMonth = monthNums.length > 0 ? Math.max(...monthNums) : 0;
        for (let m = 1; m <= maxMonth; m++) {
          expectedMonths.push(String(m).padStart(2, "0"));
        }
      }
      missingPostosMonths = expectedMonths.filter((m) => !cityMonthsInYear.has(m));
    }

    const hasCoverageGaps =
      missingEstSectors.length > 0 || missingFuncSectors.length > 0 || missingPostosMonths.length > 0;

    if (!hasEst && !hasFunc && !hasPostos) {
      return {
        dataStatus: "unavailable",
        dataStatusDetail: hasAnyFetchError
          ? `Falha ao consultar as bases: ${failedBases.join(", ")}.`
          : "Nenhum indicador econômico registrado para este município."
      };
    }

    if (!hasEst || !hasFunc || !hasPostos || hasCoverageGaps || hasAnyFetchError) {
      const gaps: string[] = [];
      if (!hasEst) gaps.push("sem estabelecimentos");
      else if (missingEstSectors.length > 0) {
        gaps.push(`estabelecimentos sem ${missingEstSectors.slice(0, 2).join(", ")}`);
      }
      if (!hasFunc) gaps.push("sem funcionários");
      else if (missingFuncSectors.length > 0) {
        gaps.push(`funcionários sem ${missingFuncSectors.slice(0, 2).join(", ")}`);
      }
      if (!hasPostos) gaps.push("sem saldo de postos");
      else if (missingPostosMonths.length > 0) {
        gaps.push(`faltam meses em ${activeYear} (${missingPostosMonths.slice(0, 3).join(", ")})`);
      }
      if (hasAnyFetchError) gaps.push(`erro em ${failedBases.join(", ")}`);
      return {
        dataStatus: "partial",
        dataStatusDetail: `Dados parciais: ${gaps.join("; ")}.`
      };
    }

    return {
      dataStatus: "complete",
      dataStatusDetail: `Todas as bases setoriais e a série mensal (${activeYear}) estão completas para este município.`
    };
  }, [sectorAudit, rawPostosCity, selectedYear, availableYears]);

  const isStatusTooltipVisible = statusPinned || (!statusDismissed && (statusHovered || statusFocused));

  useEffect(() => {
    if (!isStatusTooltipVisible) return;
    const handleOutside = (e: MouseEvent) => {
      if (statusBadgeRef.current && !statusBadgeRef.current.contains(e.target as Node)) {
        setStatusPinned(false);
        setStatusHovered(false);
        setStatusFocused(false);
        setStatusDismissed(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isStatusTooltipVisible]);

  // Fechar com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Bloquear o scroll do body quando o modal estiver aberto
  useEffect(() => {
    if (cidade) {
      document.body.style.overflow = "hidden";
      setImageError(false);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [cidade]);

  if (!cidade) return null;

  // Indicadores vêm exclusivamente do registro retornado pela API municipal.
  const information = cidadeDetalhesApi?.information ?? cidade.information;
  const numHospedagens = temIndicador(information?.hospedagens) ? formatarHospedagem(information?.hospedagens) : null;
  const numRestaurantes = temIndicador(information?.restaurantes) ? formatarRestaurantes(information?.restaurantes) : null;
  const popExibida = temIndicador(information?.populacao) ? formatarPopulacao(information?.populacao) : null;
  const pibExibido = temIndicador(information?.pib) ? formatarPIB(information?.pib) : null;
  const idh = information?.idh ?? information?.idhm;
  const idhExibido = formatarIDH(idh);
  const idhInfo = getIDHClass(idh);
  const munic = information?.munic ?? information?.indicador_cultural_munic ?? information?.munic_cultura;
  const municExibido = formatarMUNIC(munic);
  const pnad = information?.pnad ?? information?.estatistica_pnad;
  const pnadExibido = formatarPNAD(pnad);
  const area = information?.area_territorial ?? information?.area;
  const areaExibida = formatarArea(area);
  const densidade = information?.densidade_demografica ?? information?.densidade;
  const densidadeExibida = formatarDensidade(densidade);
  const escolarizacao = information?.escolarizacao ?? information?.taxa_escolarizacao;
  const escolarizacaoExibida = formatarEscolarizacao(escolarizacao);
  const indicadores = [
    ...(pibExibido ? [{ label: "PIB", value: pibExibido, detail: "IBGE", icon: TrendingUp }] : []),
    ...(popExibida ? [{ label: "População", value: popExibida, detail: "IBGE", icon: Users }] : []),
    ...(numHospedagens ? [{ label: "Hospedagem", value: `${numHospedagens} estab.`, detail: "Estabelecimentos", icon: Building2 }] : []),
    ...(numRestaurantes ? [{ label: "Alimentação", value: `${numRestaurantes} unid.`, detail: "Estabelecimentos", icon: UtensilsCrossed }] : []),
    ...(temIndicador(idh) ? [{ label: "IDHM", value: idhExibido, detail: idhInfo.label, icon: Award }] : []),
    ...(temIndicador(munic) ? [{ label: "MUNIC (Pesquisa de Informações Básicas Municipais)", value: municExibido, detail: "Indicador Cultural", icon: Sparkles }] : []),
    ...(temIndicador(pnad) ? [{ label: "PNAD - Módulo Turismo", value: pnadExibido, detail: "Demanda Turística", icon: BarChart2 }] : []),
    ...(temIndicador(area) ? [{ label: "Tamanho do município", value: areaExibida, detail: "Extensão territorial", icon: Maximize2 }] : []),
    ...(temIndicador(densidade) ? [{ label: "Densidade Demográfica", value: densidadeExibida, detail: "Concentração", icon: Layers }] : []),
    ...(temIndicador(escolarizacao) ? [{ label: "Escolarização", value: escolarizacaoExibida, detail: "Taxa de Ensino", icon: GraduationCap }] : []),
  ];

  const imagemCapa = ((cidadeDetalhesApi?.imagens && cidadeDetalhesApi.imagens.length > 0 ? cidadeDetalhesApi.imagens : cidade.imagens) && Array.isArray(cidade.imagens) && (cidadeDetalhesApi?.imagens?.length || cidade.imagens?.length))
    ? (cidade.imagens.find(img => img.is_cover)?.image || cidade.imagens[0]?.image)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[90vw] xl:max-w-7xl bg-slate-50 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col border border-slate-200/80 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão de Fechar FIXO */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black/40 hover:bg-[#C90C0F] text-white rounded-full text-xs font-semibold backdrop-blur-md border border-white/20 shadow-md transition-all duration-150 cursor-pointer"
            title="Fechar detalhes"
          >
            <X className="h-3.5 w-3.5" />
            <span>Fechar</span>
          </button>
        </div>

        {/* CONTAINER COM SCROLL */}
        <div className="w-full h-full overflow-y-auto flex flex-col bg-slate-50 relative">

          {/* =========================================================
              1. HEADER / HERO DA CIDADE SELECIONADA
          ========================================================= */}
          <div className="relative w-full min-h-[280px] sm:min-h-[340px] bg-slate-900 overflow-hidden flex flex-col justify-end p-6 sm:p-8 shrink-0">
            {!imageError && imagemCapa ? (
              <img
                src={imagemCapa}
                alt={cidade.name}
                className="absolute inset-0 w-full h-full object-cover opacity-70"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-[#359830]/40 via-slate-900 to-slate-900 opacity-90" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />

            {/* Nome e Indicadores de Topo */}
            <div className="relative z-10 w-full flex flex-col xl:flex-row xl:items-end justify-between gap-6">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider mb-2 border border-white/30">
                  <MapPin className="h-3.5 w-3.5 text-[#C90C0F]" />
                  {estadoNomeApi || cidade.state_name || "Sul de Minas Gerais"}
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-md">
                  {cidade.name}
                </h1>
              </div>

            </div>
          </div>

          {/* =========================================================
              CONTEÚDO DO PAINEL DA CIDADE SELECIONADA
          ========================================================= */}
          <div className="p-4 sm:p-6 md:p-8 space-y-8">

            {/* SEÇÃO COMPLETA: INDICADORES SOCIOECONÔMICOS E CULTURAIS */}
            {indicadores.length > 0 && <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#5BAF56]/30 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-bold text-[#1D5C1B] uppercase tracking-wider flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#359830]" />
                  Painel de Indicadores Gerais do Município
                </span>
                  <span className="text-xs text-[#287524] font-medium">Indicadores consolidados do município</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {indicadores.map(({ label, value, detail, icon: Icon }) => (
                  <div key={label} className="bg-[#EAF4E9]/40 rounded-xl p-3.5 border border-[#5BAF56]/30 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] font-semibold text-[#1D5C1B] uppercase">{label}</span>
                      <Icon className="h-3.5 w-3.5 text-[#359830]" />
                    </div>
                    <span className="text-base font-bold text-slate-800">{value}</span>
                    <span className="text-[10px] text-slate-500 mt-1">{detail}</span>
                  </div>
                ))}
              </div>
            </div>}

            {/* SEÇÃO 1: SOBRE A CIDADE */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-[#1D5C1B] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-[#359830]" />
                Sobre a Cidade
              </span>
              {(() => {
                const desc = (cidadeDetalhesApi?.description || cidade.description || "").trim();
                return desc && desc !== "string" ? (
                  <div
                    className="prose prose-slate max-w-4xl text-sm leading-relaxed text-justify sm:text-base"
                    dangerouslySetInnerHTML={{ __html: desc }}
                  />
                ) : (
                  <p className="max-w-4xl text-justify text-sm leading-relaxed text-slate-600 sm:text-base">
                    Informações detalhadas sobre o município e seus atrativos turísticos serão atualizadas em breve.
                  </p>
                );
              })()}
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-[#1D5C1B] uppercase tracking-wider">
                  Notícias de {cidade.name}
                </h3>
                {!noticiasError && !noticiasLoading && (
                  <span className="text-xs font-semibold text-slate-500">
                    {noticiasDaCidade.length} {noticiasDaCidade.length === 1 ? "publicação" : "publicações"}
                  </span>
                )}
              </div>
              {noticiasLoading ? (
                <p className="py-4 text-center text-sm text-slate-500">Carregando notícias...</p>
              ) : noticiasError ? (
                <p role="alert" className="text-sm text-amber-800">
                  Não foi possível carregar as notícias desta cidade.
                </p>
              ) : noticiasDaCidade.length === 0 ? (
                <div className="py-4 text-center text-sm text-slate-500">
                  Nenhuma notícia cadastrada para este município.
                </div>
              ) : (
                <div className="space-y-3">
                  {noticiasDaCidade.map((noticia) => (
                    <NoticiaCard
                      key={noticia.id}
                      noticia={noticia}
                      variant="compact"
                      showCityBadge={false}
                      showIgrBadge={false}
                      onClick={onSelectNoticia}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* SEÇÃO 2: PONTOS TURÍSTICOS E EVENTOS */}
            <div className="grid grid-cols-1 gap-6">
              {/* Principais Atrativos / Pontos Turísticos */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-[#1D5C1B] uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#359830]" />
                    Principais Atrativos Turísticos
                  </span>
                  {pontosTuristicos.length > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF4E9] text-[#1D5C1B] border border-[#5BAF56]/30">
                      {pontosTuristicos.length} {pontosTuristicos.length === 1 ? "atrativo" : "atrativos"}
                    </span>
                  )}
                </div>

                <div className="space-y-3.5 flex-1">
                  {loadingExtras ? (
                    <div className="flex items-center justify-center py-10 text-sm text-slate-400">
                      <RefreshCw className="animate-spin text-[#359830] h-5 w-5 mr-2" />
                      Carregando atrativos...
                    </div>
                  ) : pontosTuristicos.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm flex flex-col items-center gap-2">
                      <Compass className="h-8 w-8 text-[#5BAF56] stroke-[1.5]" />
                      <p>Nenhum ponto turístico cadastrado para este município no momento.</p>
                    </div>
                  ) : (
                    pontosTuristicos.map((ponto, index) => {
                      const img = (ponto.imagens && Array.isArray(ponto.imagens) && ponto.imagens.length > 0)
                        ? (ponto.imagens.find(i => i.is_cover)?.image || ponto.imagens[0]?.image)
                        : null;

                      return (
                        <div
                          key={ponto.id || index}
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/80 transition-colors"
                        >
                          {img ? (
                            <img
                              src={img}
                              alt={ponto.name}
                              className="w-full sm:w-16 h-20 sm:h-16 rounded-lg object-cover shrink-0 border border-slate-200"
                            />
                          ) : (
                            <div className="w-full sm:w-16 h-12 sm:h-16 rounded-lg bg-[#EAF4E9] text-[#359830] flex items-center justify-center shrink-0 border border-[#5BAF56]/30">
                              <Compass className="h-6 w-6" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-800 leading-tight">
                              {ponto.name}
                            </h4>
                            {ponto.description && (
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                {ponto.description}
                              </p>
                            )}
                            {ponto.contatos && Array.isArray(ponto.contatos) && ponto.contatos.length > 0 && (ponto.contatos[0]?.address || ponto.contatos[0]?.label || ponto.contatos[0]?.value) && (
                              <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                                <MapPin className="h-3.5 w-3.5 text-[#C90C0F] shrink-0" />
                                <span className="truncate">{ponto.contatos[0].address || ponto.contatos[0].label || ponto.contatos[0].value}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Próximos Eventos */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-[#1D5C1B] uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#C90C0F]" />
                    Eventos e Festividades
                  </span>
                  {eventos.length > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-[#C90C0F] border border-[#C90C0F]/20">
                      {eventos.length} {eventos.length === 1 ? "evento" : "eventos"}
                    </span>
                  )}
                </div>

                <div className="space-y-3.5 flex-1">
                  {loadingExtras ? (
                    <div className="flex items-center justify-center py-10 text-sm text-slate-400">
                      <RefreshCw className="animate-spin text-[#359830] h-5 w-5 mr-2" />
                      Carregando eventos...
                    </div>
                  ) : eventos.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm flex flex-col items-center gap-2">
                      <Calendar className="h-8 w-8 text-[#C90C0F]/50 stroke-[1.5]" />
                      <p>Nenhum evento programado para este município no momento.</p>
                    </div>
                  ) : (
                    eventos.map((evento, index) => {
                      const dataInfo = formatarDataEvento(evento.start_date);
                      const local = (evento.contatos && Array.isArray(evento.contatos) && evento.contatos.length > 0)
                        ? (evento.contatos[0].address || evento.contatos[0].label || evento.contatos[0].value)
                        : cidade.name;

                      return (
                        <div
                          key={evento.id || index}
                          className="flex items-start sm:items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/80 transition-colors gap-3"
                        >
                          <div className="flex items-start sm:items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-[#359830] text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
                              <span className="text-sm font-black leading-none">{dataInfo.dia}</span>
                              <span className="text-[10px] font-bold uppercase leading-none mt-0.5 opacity-90">{dataInfo.mes}</span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-800 leading-tight truncate">
                                {evento.name}
                              </h4>
                              {evento.description && (
                                <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                                  {evento.description}
                                </p>
                              )}
                              <span className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                                <MapPin className="h-3.5 w-3.5 text-[#C90C0F] shrink-0" />
                                <span className="truncate">{local}</span>
                              </span>
                            </div>
                          </div>
                          {evento.start_date && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full border border-[#5BAF56]/30 bg-[#EAF4E9] text-[#1D5C1B] whitespace-nowrap shrink-0 hidden sm:inline-block">
                              Programado
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: CONTATOS E ATENDIMENTO */}
            {((cidadeDetalhesApi?.contatos && Array.isArray(cidadeDetalhesApi.contatos) && cidadeDetalhesApi.contatos.length > 0) || (cidade.contatos && Array.isArray(cidade.contatos) && cidade.contatos.length > 0)) && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                <span className="text-xs font-bold text-[#1D5C1B] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#359830]" />
                  Contatos e Atendimento Turístico
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {((cidadeDetalhesApi?.contatos && Array.isArray(cidadeDetalhesApi.contatos) && cidadeDetalhesApi.contatos.length > 0) ? cidadeDetalhesApi.contatos : (cidade.contatos || [])).map((contato) => (
                    <div
                      key={contato.id}
                      className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/70 flex flex-col justify-between gap-2"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          {contato.type_display || contato.label || contato.type}
                        </span>
                        {contato.value && (
                          <p className="text-sm font-semibold text-[#1D5C1B] mt-1 flex items-center gap-2">
                            {contato.type?.toLowerCase().includes("email") ? (
                              <Mail className="h-4 w-4 text-[#C90C0F]" />
                            ) : contato.type?.toLowerCase().includes("site") || contato.type?.toLowerCase().includes("website") ? (
                              <Globe className="h-4 w-4 text-[#359830]" />
                            ) : (
                              <Phone className="h-4 w-4 text-[#359830]" />
                            )}
                            {contato.value}
                          </p>
                        )}
                      </div>
                      {contato.address && (
                        <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-2">
                          <MapPin className="h-3.5 w-3.5 text-[#C90C0F] shrink-0 mt-0.5" />
                          <span>{contato.address}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEÇÃO 4: GRÁFICOS ANALÍTICOS */}
            <div className="pt-6 mt-6 border-t border-slate-200/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF4E9] flex items-center justify-center text-[#359830] shrink-0">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Dados Econômicos e Setoriais</h2>
                    <p className="text-xs text-slate-500">Indicadores de mercado, empregabilidade e empresas</p>
                  </div>
                </div>

                {/* Indicador de Integridade Acessível */}
                {loadingRealData ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shadow-sm self-start sm:self-auto">
                    <RefreshCw className="w-3.5 h-3.5 text-[#359830] animate-spin" />
                    <span className="text-[11px] font-bold tracking-wide uppercase">Carregando dados...</span>
                  </div>
                ) : (
                  <div
                    ref={statusBadgeRef}
                    className="relative inline-flex self-start sm:self-auto"
                    onMouseEnter={() => {
                      setStatusHovered(true);
                      setStatusDismissed(false);
                    }}
                    onMouseLeave={() => {
                      setStatusHovered(false);
                      setStatusDismissed(false);
                    }}
                    onBlur={(e) => {
                      if (!statusBadgeRef.current?.contains(e.relatedTarget as Node | null)) {
                        setStatusFocused(false);
                        setStatusDismissed(false);
                      }
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (statusPinned) {
                          setStatusPinned(false);
                          setStatusDismissed(true);
                        } else {
                          setStatusDismissed(false);
                          setStatusPinned(true);
                        }
                      }}
                      onFocus={() => {
                        setStatusFocused(true);
                        setStatusDismissed(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape" && isStatusTooltipVisible) {
                          e.stopPropagation();
                          setStatusPinned(false);
                          setStatusDismissed(true);
                        }
                      }}
                      aria-label={dataStatusDetail}
                      aria-expanded={isStatusTooltipVisible}
                      aria-describedby={isStatusTooltipVisible ? statusTooltipId : undefined}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                        dataStatus === "unavailable"
                          ? "bg-red-50 text-[#C90C0F] border-[#C90C0F]/20"
                          : dataStatus === "partial"
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : "bg-[#EAF4E9] text-[#1D5C1B] border-[#5BAF56]/30"
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          dataStatus === "unavailable"
                            ? "bg-[#C90C0F]"
                            : dataStatus === "partial"
                              ? "bg-amber-500 animate-pulse"
                              : "bg-[#359830]"
                        }`}
                      />
                      <span className="text-[11px] font-bold tracking-wide uppercase">
                        {dataStatus === "unavailable"
                          ? "Dados Indisponíveis"
                          : dataStatus === "partial"
                            ? "Dados Parciais"
                            : "Dados Completos"}
                      </span>
                    </button>
                    {isStatusTooltipVisible && dataStatusDetail && (
                      <div
                        id={statusTooltipId}
                        role="tooltip"
                        className="absolute top-full right-0 mt-2 w-64 bg-slate-800 text-white text-xs rounded-lg p-3 shadow-xl z-50 leading-relaxed"
                      >
                        {dataStatusDetail}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Aviso de erro de rede/HTTP com recuperação seletiva na Seção 4 */}
              {!loadingRealData && graphsFetchError && (
                <div
                  role="alert"
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-900">Falha ao consultar indicadores econômicos</p>
                      <p className="text-xs text-red-800 mt-0.5">{graphsFetchError}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const rawUrl = (process.env.NEXT_PUBLIC_GRAPHS_URL ?? "").trim();
                      const baseUrl = (rawUrl || "/api/externo").replace(/\/$/, "");
                      const codigoIBGE = getCodigoIBGEParaGraficos(cidadeIbgeCode);
                      const postosUrl = codigoIBGE
                        ? `${baseUrl}/postos_de_trabalho/?codigo_ibge=${codigoIBGE}`
                        : `${baseUrl}/postos_de_trabalho/`;
                      if (hasFetchError("estabelecimentos")) {
                        clearAnalyticsCache("estabelecimentos");
                      }
                      if (hasFetchError("funcionarios")) {
                        clearAnalyticsCache("funcionarios");
                      }
                      if (hasFetchError("postos", postosUrl)) {
                        clearAnalyticsCache("postos", postosUrl);
                      }
                      if (hasFetchError("postos")) {
                        clearAnalyticsCache("postos");
                      }
                      setGraphsReloadKey((k) => k + 1);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Tentar novamente
                  </button>
                </div>
              )}

              {/* Bloco de Progresso e Aviso quando os dados estiverem carregando */}
              {loadingRealData && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-6">
                  <div className="max-w-md mx-auto">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-[#359830] animate-spin" />
                        {progressMessage}
                      </span>
                      <span className="text-xs font-bold text-[#1D5C1B] bg-[#EAF4E9] px-2.5 py-1 rounded-full border border-[#5BAF56]/30">
                        {progressRealData}%
                      </span>
                    </div>

                    {/* Barra de Progresso */}
                    <div
                      role="progressbar"
                      aria-valuenow={progressRealData}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Progresso de carregamento dos gráficos municipais"
                      className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden border border-slate-200/60"
                    >
                      <div
                        className="bg-[#359830] h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressRealData}%` }}
                      />
                    </div>

                    {/* Aviso de Primeiro Carregamento */}
                    <div className="p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl flex items-start gap-3 text-left">
                      <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-900 leading-relaxed">
                        <span className="font-semibold block text-amber-950 mb-0.5">Primeiro carregamento:</span>
                        Na primeira vez, a consulta pode demorar alguns segundos enquanto os dados econômicos e estatísticos são sincronizados com o servidor.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Radar */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col relative">
                  <div className="mb-4">
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide">Vocação Turística</h3>
                    <p className="text-xs text-slate-500">Distribuição de estabelecimentos por categoria</p>
                  </div>
                  <div className="h-64 w-full pt-2 relative flex items-center justify-center">
                    {loadingRealData ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10"><RefreshCw className="animate-spin text-[#359830] h-6 w-6" /></div>
                    ) : radarData.length === 0 ? (
                      <div className="text-slate-600 text-sm text-center">Sem dados de estabelecimentos disponíveis</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="58%" data={radarData}>
                          <PolarGrid stroke="#d1e7d0" />
                          <PolarAngleAxis dataKey="Classificação" tick={{ fill: '#1D5C1B', fontSize: 10, fontWeight: 500 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={formatarNumeroGrafico} />
                          <Radar name="Estabelecimentos" dataKey="Estabelecimentos" stroke="#2E7D32" fill="#2E7D32" fillOpacity={0.35} dot={{ r: 3, fill: "#2E7D32" }} />
                          <Tooltip
                            formatter={(val: number | string) => {
                              const num = parseNumericValue(val);
                              const pct =
                                totalEstabelecimentosCity > 0
                                  ? ((num / totalEstabelecimentosCity) * 100).toFixed(1).replace(".", ",")
                                  : "0,0";
                              return [`${formatarNumeroGrafico(num)} (${pct}%)`, "Estabelecimentos"];
                            }}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Gráfico Comparativo: Estabelecimentos vs. Funcionários (Barras Agrupadas com dois eixos Y) */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col relative xl:col-span-2">
                  <div className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide">Estabelecimentos vs. Funcionários</h3>
                      <p className="text-xs text-slate-500">Comparação setorial entre estabelecimentos ativos e força de trabalho</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                      <div className="flex items-center gap-1.5" title="Eixo Y esquerdo: Estabelecimentos"><div className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" /> Estabelecimentos</div>
                      <div className="flex items-center gap-1.5" title="Eixo Y direito: Funcionários"><div className="w-2.5 h-2.5 rounded-full bg-[#1976D2]" /> Funcionários</div>
                    </div>
                  </div>
                  <div className="h-64 w-full pt-2 relative">
                    {loadingRealData ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10"><RefreshCw className="animate-spin text-[#359830] h-6 w-6" /></div>
                    ) : combinedData.length === 0 ? (
                      <div className="text-slate-600 text-sm h-full flex items-center justify-center">Sem dados disponíveis</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={combinedData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF4E9" />
                          <XAxis
                            dataKey="Classificação"
                            interval={0}
                            tick={{ fontSize: 10, fill: '#1D5C1B' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 10, fill: '#2E7D32' }}
                            axisLine={false}
                            tickLine={false}
                            orientation="left"
                            tickFormatter={formatarNumeroGrafico}
                            allowDecimals={false}
                            width={45}
                          />
                          <YAxis
                            yAxisId="right"
                            tick={{ fontSize: 10, fill: '#1976D2' }}
                            axisLine={false}
                            tickLine={false}
                            orientation="right"
                            tickFormatter={formatarNumeroGrafico}
                            allowDecimals={false}
                            width={50}
                          />
                          <Tooltip
                            formatter={(val: number | string, name: string) => [
                              formatarNumeroGrafico(val),
                              name === "Estabelecimentos"
                                ? "Estabelecimentos (eixo esq.)"
                                : "Funcionários (eixo dir.)"
                            ]}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                            cursor={{ fill: '#f1f5f9' }}
                          />
                          <Bar yAxisId="left" dataKey="Estabelecimentos" fill="#2E7D32" radius={[4, 4, 0, 0]} maxBarSize={24} name="Estabelecimentos" />
                          <Bar yAxisId="right" dataKey="Funcionarios" fill="#1976D2" radius={[4, 4, 0, 0]} maxBarSize={24} name="Funcionários" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Gráfico 3: Saldo de Empregos */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col relative lg:col-span-2 xl:col-span-3">
                  <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide">
                        Termômetro de Empregos
                      </h3>
                      <p className="text-xs text-slate-500">
                        Saldo mensal de contratações (Admissões menos Desligamentos)
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Seletor de Ano */}
                      {!loadingRealData && availableYears.length > 0 && (
                        <select
                          aria-label="Selecionar ano do Termômetro de Empregos"
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                          className="bg-slate-50 border border-[#5BAF56]/40 text-[#1D5C1B] text-sm font-semibold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#359830]/20 cursor-pointer"
                        >
                          {availableYears.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="h-60 w-full pt-2 relative">
                    {loadingRealData ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                        <RefreshCw className="animate-spin text-[#359830] h-6 w-6" />
                      </div>
                    ) : realPostos.length === 0 ? (
                      <div className="text-slate-600 text-sm h-full flex items-center justify-center">Sem dados de postos para este ano</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={realPostos} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF4E9" />
                          <XAxis
                            dataKey="MesLabel"
                            tick={{ fontSize: 11, fill: '#1D5C1B' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#1D5C1B' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatarNumeroGrafico}
                            allowDecimals={false}
                            domain={[(dataMin: number) => Math.min(0, dataMin), (dataMax: number) => Math.max(0, dataMax)]}
                            width={45}
                          />
                          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" ifOverflow="extendDomain" />
                          <Tooltip
                            formatter={(val: number | string) => {
                              const num = parseNumericValue(val);
                              const sinal = num > 0 ? "+" : "";
                              const status =
                                num > 0
                                  ? "Admissões Líquidas (Crescimento)"
                                  : num < 0
                                    ? "Desligamentos Líquidos (Retração)"
                                    : "Saldo Neutro (Estabilidade)";
                              return [`${sinal}${formatarNumeroGrafico(num)} vagas (${status})`, "Saldo Mensal"];
                            }}
                            labelFormatter={(_, payload) => {
                              const item = payload?.[0]?.payload as MonthlySaldoItem | undefined;
                              return item?.MesCompleto || "";
                            }}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                            cursor={{ fill: '#f1f5f9' }}
                          />
                          <Bar
                            dataKey="Saldo"
                            radius={[4, 4, 4, 4]}
                            maxBarSize={36}
                          >
                            {realPostos.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.Saldo > 0 ? '#2E7D32' : entry.Saldo < 0 ? '#D32F2F' : '#64748b'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
