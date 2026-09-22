"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  UtensilsCrossed,
  Users,
  TrendingUp,
  X,
  Info,
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
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from "recharts";
import { fetchJSONAndFlatten } from "@/lib/api";
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

interface CityRecord {
  Município?: string;
  Classificação?: string;
  Estabelecimentos?: string | number;
  Funcionarios?: string | number;
  Ano?: string | number;
  Mês?: string;
  Saldo?: string | number;
  [key: string]: unknown;
}

interface CombinedCityItem {
  Classificação: string;
  ClassificacaoOriginal: string;
  Estabelecimentos: number;
  Funcionarios: number;
}

interface CidadeDetalhesModalProps {
  cidade: ApiCidade;
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

export function CidadeDetalhesModal({ cidade, onClose }: CidadeDetalhesModalProps) {
  const [imageError, setImageError] = useState(false);
  const [realEstabelecimentos, setRealEstabelecimentos] = useState<CityRecord[]>([]);
  const [realPostos, setRealPostos] = useState<CityRecord[]>([]);
  const [rawPostosCity, setRawPostosCity] = useState<CityRecord[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [combinedData, setCombinedData] = useState<CombinedCityItem[]>([]);
  const [loadingRealData, setLoadingRealData] = useState(false);
  const [dataIsPartial, setDataIsPartial] = useState(false);

  // Pontos Turísticos e Eventos reais da API
  const [pontosTuristicos, setPontosTuristicos] = useState<ApiPontoTuristico[]>([]);
  const [eventos, setEventos] = useState<ApiEventos[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);

  // 1. Buscar dados analíticos da API de gráficos
  useEffect(() => {
    if (cidade) {
      const loadGraphs = async () => {
        setLoadingRealData(true);
        try {
          const rawUrl = process.env.NEXT_PUBLIC_GRAPHS_URL || "/api/externo";
          const baseUrl = rawUrl.replace(/\/$/, "");
          const [estData, funcData, postosData] = await Promise.all([
            fetchJSONAndFlatten(`${baseUrl}/estabelecimentos/`, 'estabelecimentos') as Promise<CityRecord[]>,
            fetchJSONAndFlatten(`${baseUrl}/funcionarios/`, 'funcionarios') as Promise<CityRecord[]>,
            fetchJSONAndFlatten(`${baseUrl}/postos_de_trabalho/`, 'postos') as Promise<CityRecord[]>,
          ]);

          const estCity = (estData || []).filter((r) => r['Município'] === cidade.name);
          const funcCity = (funcData || []).filter((r) => r['Município'] === cidade.name);
          const postosCity = (postosData || []).filter((r) => r['Município'] === cidade.name);

          setRealEstabelecimentos(estCity);
          setRawPostosCity(postosCity);

          // Extrair anos disponíveis
          const years = Array.from(new Set(postosCity.map((p) => String(p['Ano']))))
            .filter(y => y && y !== 'undefined' && y !== 'null')
            .sort((a, b) => Number(b) - Number(a)) as string[];
          setAvailableYears(years);

          const defaultYear = years.length > 0 ? years[0] : new Date().getFullYear().toString();
          setSelectedYear(defaultYear);
          setRealPostos(postosCity.filter((r) => String(r['Ano']) === defaultYear));

          // Verificação de Integridade
          if (estCity.length === 0 || funcCity.length === 0 || postosCity.length === 0) {
            setDataIsPartial(true);
          } else {
            setDataIsPartial(false);
          }

          // Montar dados combinados para Radar e Gráficos
          const mapFunc = new Map<string, number>();
          funcCity.forEach((f) => {
            if (f['Classificação']) {
              mapFunc.set(String(f['Classificação']), Number(f['Funcionarios']) || 0);
            }
          });

          const mapShortName: Record<string, string> = {
            "Alojamento": "Hospedagem",
            "Alimentação": "Restaurantes",
            "Transporte": "Transporte",
            "Agências de viagens": "Agências",
            "Cultura e lazer": "Cultura",
            "Outros serviços turísticos": "Outros"
          };

          const combined: CombinedCityItem[] = estCity.map((e) => {
            const rawClass = String(e['Classificação'] || "Outros");
            let shortClass = rawClass;
            for (const [key, val] of Object.entries(mapShortName)) {
              if (rawClass.toLowerCase().includes(key.toLowerCase())) {
                shortClass = val;
                break;
              }
            }
            return {
              Classificação: shortClass,
              ClassificacaoOriginal: rawClass,
              Estabelecimentos: Number(e['Estabelecimentos']) || 0,
              Funcionarios: mapFunc.get(rawClass) || 0
            };
          });

          setCombinedData(combined);
        } catch (err) {
          console.warn("API de gráficos não disponível para esta cidade:", err);
          setDataIsPartial(true);
        } finally {
          setLoadingRealData(false);
        }
      };

      loadGraphs();
    }
  }, [cidade]);

  // 2. Buscar Pontos Turísticos e Eventos específicos da Cidade
  useEffect(() => {
    if (cidade) {
      const loadExtras = async () => {
        setLoadingExtras(true);
        try {
          const rawUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_CIDADES_API_BASE_URL;
          if (!rawUrl) return;
          const cleanUrl = rawUrl.trim().replace(/\/$/, "");

          const [pontosRes, eventosRes] = await Promise.all([
            axios.get<ApiPagination<ApiPontoTuristico>>(`${cleanUrl}/pontos-turisticos/`).catch(() => ({ data: { results: [] } })),
            axios.get<ApiPagination<ApiEventos>>(`${cleanUrl}/eventos/`).catch(() => ({ data: { results: [] } }))
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

  // Atualizar dados de postos ao selecionar outro ano
  useEffect(() => {
    if (selectedYear && rawPostosCity.length > 0) {
      setRealPostos(rawPostosCity.filter((r) => String(r['Ano']) === selectedYear));
    }
  }, [selectedYear, rawPostosCity]);

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

  // Extrair contagem real de Hospedagens e Restaurantes
  const hospItem = realEstabelecimentos.find((e) =>
    String(e['Classificação'] || "").toLowerCase().includes('hospedagem') ||
    String(e['Classificação'] || "").toLowerCase().includes('alojamento')
  );
  const restItem = realEstabelecimentos.find((e) =>
    String(e['Classificação'] || "").toLowerCase().includes('alimentação') ||
    String(e['Classificação'] || "").toLowerCase().includes('restaurante')
  );

  const numHospedagens = (cidade.hospedagens !== null && cidade.hospedagens !== undefined)
    ? formatarHospedagem(cidade.hospedagens)
    : (hospItem ? Number(hospItem['Estabelecimentos']).toLocaleString('pt-BR') : "—");

  const numRestaurantes = (cidade.restaurantes !== null && cidade.restaurantes !== undefined)
    ? formatarRestaurantes(cidade.restaurantes)
    : (restItem ? Number(restItem['Estabelecimentos']).toLocaleString('pt-BR') : "—");

  const popExibida = formatarPopulacao(cidade.populacao);
  const pibExibido = formatarPIB(cidade.pib);
  const idhExibido = formatarIDH(cidade.idh ?? cidade.idhm);
  const idhInfo = getIDHClass(cidade.idh ?? cidade.idhm);
  const municExibido = formatarMUNIC(cidade.munic ?? cidade.indicador_cultural_munic ?? cidade.munic_cultura);
  const pnadExibido = formatarPNAD(cidade.pnad ?? cidade.estatistica_pnad);
  const areaExibida = formatarArea(cidade.area_territorial ?? cidade.area);
  const densidadeExibida = formatarDensidade(cidade.densidade_demografica ?? cidade.densidade);
  const escolarizacaoExibida = formatarEscolarizacao(cidade.escolarizacao ?? cidade.taxa_escolarizacao);

  const imagemCapa = (cidade.imagens && Array.isArray(cidade.imagens) && cidade.imagens.length > 0)
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
                  {cidade.state_name || "Sul de Minas Gerais"}
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-md">
                  {cidade.name}
                </h1>
              </div>

              {/* 4 Cards Informativos Principais */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 xl:w-auto">
                {/* PIB */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 shadow-lg flex flex-col justify-center gap-1 min-w-[125px]">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-[#5BAF56] shrink-0" />
                    <span className="text-[10px] sm:text-xs font-medium text-white/80 uppercase tracking-wider">
                      PIB
                    </span>
                  </div>
                  <span className="text-base sm:text-lg font-extrabold text-white">
                    {pibExibido}
                  </span>
                </div>

                {/* População */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 shadow-lg flex flex-col justify-center gap-1 min-w-[125px]">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-[#C90C0F] shrink-0" />
                    <span className="text-[10px] sm:text-xs font-medium text-white/80 uppercase tracking-wider">
                      População
                    </span>
                  </div>
                  <span className="text-base sm:text-lg font-extrabold text-white">
                    {popExibida}
                  </span>
                </div>

                {/* Hospedagem */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 shadow-lg flex flex-col justify-center gap-1 min-w-[125px]">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-[#5BAF56] shrink-0" />
                    <span className="text-[10px] sm:text-xs font-medium text-white/80 uppercase tracking-wider">
                      Hospedagem
                    </span>
                  </div>
                  <span className="text-base sm:text-lg font-extrabold text-white">
                    {numHospedagens} {numHospedagens !== "—" ? "estab." : ""}
                  </span>
                </div>

                {/* Restaurantes */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 shadow-lg flex flex-col justify-center gap-1 min-w-[125px]">
                  <div className="flex items-center gap-1.5">
                    <UtensilsCrossed className="h-4 w-4 text-[#C90C0F] shrink-0" />
                    <span className="text-[10px] sm:text-xs font-medium text-white/80 uppercase tracking-wider">
                      Alimentação
                    </span>
                  </div>
                  <span className="text-base sm:text-lg font-extrabold text-white">
                    {numRestaurantes} {numRestaurantes !== "—" ? "unid." : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================
              CONTEÚDO DO PAINEL DA CIDADE SELECIONADA
          ========================================================= */}
          <div className="p-4 sm:p-6 md:p-8 space-y-8">

            {/* SEÇÃO COMPLETA: INDICADORES SOCIOECONÔMICOS E CULTURAIS */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#5BAF56]/30 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-bold text-[#1D5C1B] uppercase tracking-wider flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#359830]" />
                  Painel de Indicadores Gerais do Município
                </span>
                <span className="text-xs text-[#287524] font-medium">Dados Oficiais IBGE / PNAD / MUNIC</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {/* IDHM */}
                <div className="bg-[#EAF4E9]/40 rounded-xl p-3.5 border border-[#5BAF56]/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-semibold text-[#1D5C1B] uppercase">IDHM</span>
                    <Award className="h-3.5 w-3.5 text-[#359830]" />
                  </div>
                  <span className="text-lg font-bold text-slate-800">{idhExibido}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md self-start mt-1 border ${idhInfo.color}`}>
                    {idhInfo.label}
                  </span>
                </div>

                {/* MUNIC Cultura */}
                <div className="bg-[#EAF4E9]/40 rounded-xl p-3.5 border border-[#5BAF56]/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-semibold text-[#1D5C1B] uppercase">MUNIC Cultura</span>
                    <Sparkles className="h-3.5 w-3.5 text-[#C90C0F]" />
                  </div>
                  <span className="text-sm font-bold text-slate-800 leading-snug">{municExibido}</span>
                  <span className="text-[10px] text-slate-500 mt-1">Gestão Cultural</span>
                </div>

                {/* PNAD */}
                <div className="bg-[#EAF4E9]/40 rounded-xl p-3.5 border border-[#5BAF56]/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-semibold text-[#1D5C1B] uppercase">PNAD</span>
                    <BarChart2 className="h-3.5 w-3.5 text-[#359830]" />
                  </div>
                  <span className="text-base font-bold text-slate-800">{pnadExibido}</span>
                  <span className="text-[10px] text-slate-500 mt-1">Ocupação / Renda</span>
                </div>

                {/* Área Territorial */}
                <div className="bg-[#EAF4E9]/40 rounded-xl p-3.5 border border-[#5BAF56]/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-semibold text-[#1D5C1B] uppercase">Área</span>
                    <Maximize2 className="h-3.5 w-3.5 text-[#C90C0F]" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">{areaExibida}</span>
                  <span className="text-[10px] text-slate-500 mt-1">Extensão territorial</span>
                </div>

                {/* Densidade Demográfica */}
                <div className="bg-[#EAF4E9]/40 rounded-xl p-3.5 border border-[#5BAF56]/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-semibold text-[#1D5C1B] uppercase">Densidade</span>
                    <Layers className="h-3.5 w-3.5 text-[#359830]" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">{densidadeExibida}</span>
                  <span className="text-[10px] text-slate-500 mt-1">Concentração</span>
                </div>

                {/* Escolarização */}
                <div className="bg-[#EAF4E9]/40 rounded-xl p-3.5 border border-[#5BAF56]/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-semibold text-[#1D5C1B] uppercase">Escolarização</span>
                    <GraduationCap className="h-3.5 w-3.5 text-[#C90C0F]" />
                  </div>
                  <span className="text-base font-bold text-slate-800">{escolarizacaoExibida}</span>
                  <span className="text-[10px] text-slate-500 mt-1">Taxa de Ensino</span>
                </div>
              </div>
            </div>

            {/* SEÇÃO 1: SOBRE A CIDADE */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-[#1D5C1B] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-[#359830]" />
                Sobre a Cidade
              </span>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed text-justify max-w-4xl">
                {cidade.description?.trim()
                  ? cidade.description
                  : "Informações detalhadas sobre o município e seus atrativos turísticos serão atualizadas em breve."}
              </p>
            </div>

            {/* SEÇÃO 2: PONTOS TURÍSTICOS E EVENTOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                            {ponto.contatos && Array.isArray(ponto.contatos) && ponto.contatos.length > 0 && ponto.contatos[0]?.address && (
                              <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                                <MapPin className="h-3.5 w-3.5 text-[#C90C0F] shrink-0" />
                                <span className="truncate">{ponto.contatos[0].address}</span>
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
            {cidade.contatos && Array.isArray(cidade.contatos) && cidade.contatos.length > 0 && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                <span className="text-xs font-bold text-[#1D5C1B] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#359830]" />
                  Contatos e Atendimento Turístico
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cidade.contatos.map((contato) => (
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

                {/* Indicador de Integridade */}
                {dataIsPartial ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-[#C90C0F] border border-[#C90C0F]/20 shadow-sm self-start sm:self-auto">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C90C0F] animate-pulse" />
                    <span className="text-[11px] font-bold tracking-wide uppercase">Dados Parciais</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF4E9] text-[#1D5C1B] border border-[#5BAF56]/30 shadow-sm self-start sm:self-auto">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#359830]" />
                    <span className="text-[11px] font-bold tracking-wide uppercase">Dados Completos</span>
                  </div>
                )}
              </div>

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
                    ) : combinedData.length === 0 ? (
                      <div className="text-slate-400 text-sm">Sem dados de empresas disponíveis</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={combinedData}>
                          <PolarGrid stroke="#EAF4E9" />
                          <PolarAngleAxis dataKey="Classificação" tick={{ fill: '#1D5C1B', fontSize: 10, fontWeight: 500 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                          <Radar name="Estabelecimentos" dataKey="Estabelecimentos" stroke="#359830" fill="#359830" fillOpacity={0.4} />
                          <Tooltip formatter={(val: number | string) => [`${val}`, "Quantidade"]} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Composed Chart */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col relative xl:col-span-2">
                  <div className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide">Empresas vs. Empregos</h3>
                      <p className="text-xs text-slate-500">Proporção entre CNPJs e força de trabalho</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-[#359830]" /> Empresas</div>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#C90C0F]" /> Vínculos</div>
                    </div>
                  </div>
                  <div className="h-64 w-full pt-2 relative">
                    {loadingRealData ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10"><RefreshCw className="animate-spin text-[#359830] h-6 w-6" /></div>
                    ) : combinedData.length === 0 ? (
                      <div className="text-slate-400 text-sm h-full flex items-center justify-center">Sem dados disponíveis</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={combinedData} margin={{ top: 10, right: -15, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF4E9" />
                          <XAxis dataKey="Classificação" tick={{ fontSize: 10, fill: '#1D5C1B' }} axisLine={false} tickLine={false} />
                          <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#359830' }} axisLine={false} tickLine={false} orientation="left" />
                          <YAxis yAxisId="right" tick={{ fontSize: 10, fill: '#C90C0F' }} axisLine={false} tickLine={false} orientation="right" />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                          <Bar yAxisId="left" dataKey="Estabelecimentos" fill="#359830" radius={[4, 4, 0, 0]} barSize={20} name="Estabelecimentos" />
                          <Line yAxisId="right" type="monotone" dataKey="Funcionarios" stroke="#C90C0F" strokeWidth={3} dot={{ r: 4, fill: "#C90C0F", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} name="Funcionários" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Gráfico 3: Saldo de Empregos */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col relative xl:col-span-3">
                  <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide">
                        Termômetro de Empregos
                      </h3>
                      <p className="text-xs text-slate-500">
                        Saldo mensal de contratações (Admissões menos Desligamentos)
                      </p>
                    </div>
                    {/* Seletor de Ano */}
                    {availableYears.length > 0 && (
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-slate-50 border border-[#5BAF56]/40 text-[#1D5C1B] text-sm font-semibold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#359830]/20 cursor-pointer"
                      >
                        {availableYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="h-60 w-full pt-2 relative">
                    {loadingRealData ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                        <RefreshCw className="animate-spin text-[#359830] h-6 w-6" />
                      </div>
                    ) : realPostos.length === 0 ? (
                      <div className="text-slate-400 text-sm h-full flex items-center justify-center">Sem dados de postos para este ano</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={realPostos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF4E9" />
                          <XAxis
                            dataKey="Mês"
                            tick={{ fontSize: 11, fill: '#1D5C1B' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#1D5C1B' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            formatter={(val: number | string) => [`${val}`, "Saldo"]}
                            labelFormatter={(label) => `Mês: ${label}`}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                            cursor={{ fill: '#f1f5f9' }}
                          />
                          <Bar
                            dataKey="Saldo"
                            radius={[4, 4, 4, 4]}
                          >
                            {
                              realPostos.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={Number(entry.Saldo) >= 0 ? '#359830' : '#C90C0F'} />
                              ))
                            }
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
