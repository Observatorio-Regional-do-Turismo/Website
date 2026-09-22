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
  Compass
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

function formatarPopulacao(pop: number | string | null | undefined): string {
  if (pop === null || pop === undefined || pop === "") return "—";
  const num = Number(String(pop).replace(/[^\d]/g, ""));
  if (isNaN(num) || num === 0) return String(pop);
  return `${num.toLocaleString("pt-BR")} hab.`;
}

function formatarPIB(pib: number | string | null | undefined): string {
  if (pib === null || pib === undefined || pib === "") return "—";
  const num = Number(String(pib).replace(/[^\d.-]/g, ""));
  if (isNaN(num) || num === 0) return "—";
  const valorTotal = num > 10_000_000 ? num : num * 1000;
  if (valorTotal >= 1_000_000_000) {
    return `R$ ${(valorTotal / 1_000_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bi`;
  }
  if (valorTotal >= 1_000_000) {
    return `R$ ${(valorTotal / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mi`;
  }
  return `R$ ${valorTotal.toLocaleString("pt-BR")}`;
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

          const estCity = estData.filter((r) => r['Município'] === cidade.name);
          const funcCity = funcData.filter((r) => r['Município'] === cidade.name);
          const postosCity = postosData.filter((r) => r['Município'] === cidade.name);

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

          // Mapeamento Combinado para os gráficos
          const combined: CombinedCityItem[] = estCity.map((e) => {
            const f = funcCity.find((func) => func['Classificação'] === e['Classificação']);

            let shortName = String(e['Classificação'] || "");
            if (shortName.includes("arte, cultura")) shortName = "Cultura e Lazer";
            else if (shortName.includes("Transporte") || shortName.includes("transporte")) shortName = "Transporte";
            else if (shortName.includes("Alojamento")) shortName = "Alojamento";
            else if (shortName.includes("Alimentação")) shortName = "Alimentação";
            else if (shortName.includes("Agências de viagens")) shortName = "Agências";
            else if (shortName.includes("Aluguel de")) shortName = "Aluguel";

            return {
              Classificação: shortName,
              ClassificacaoOriginal: String(e['Classificação'] || ""),
              Estabelecimentos: Number(e['Estabelecimentos'] || 0),
              Funcionarios: f ? Number(f['Funcionarios'] || 0) : 0
            };
          });
          setCombinedData(combined);
        } catch (e) {
          console.error("Erro ao carregar dados analíticos da cidade:", e);
        } finally {
          setLoadingRealData(false);
        }
      };
      loadGraphs();
    }
  }, [cidade]);

  // 2. Buscar Pontos Turísticos e Eventos da API NEXT_PUBLIC_API_URL
  useEffect(() => {
    if (cidade) {
      const loadExtras = async () => {
        setLoadingExtras(true);
        try {
          const rawUrl = process.env.NEXT_PUBLIC_API_URL || "";
          if (!rawUrl) return;

          const cleanUrl = rawUrl.trim().replace(/\/$/, "");
          const baseUrl = cleanUrl.endsWith("/cidades") ? cleanUrl.replace(/\/cidades$/, "") : cleanUrl;

          const [pontosRes, eventosRes] = await Promise.all([
            axios.get<ApiPagination<ApiPontoTuristico>>(`${baseUrl}/pontos-turisticos/`).catch(() => ({ data: { results: [] } })),
            axios.get<ApiPagination<ApiEventos>>(`${baseUrl}/eventos/`).catch(() => ({ data: { results: [] } }))
          ]);

          const matchCidade = (itemCidade: number | ApiCidade | undefined, itemCidadeName?: string) => {
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

          const pontosDaCidade = (pontosRes.data?.results || []).filter(p => matchCidade(p.cidade, p.cidade_name));
          const eventosDaCidade = (eventosRes.data?.results || []).filter(e => matchCidade(e.cidade, e.cidade_name));

          setPontosTuristicos(pontosDaCidade);
          setEventos(eventosDaCidade);
        } catch (err) {
          console.error("Erro ao carregar pontos turísticos e eventos da cidade:", err);
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

  // Extrair contagem real de Hospedagens e Restaurantes da API da Cidade ou dos Estabelecimentos
  const hospItem = realEstabelecimentos.find((e) =>
    String(e['Classificação'] || "").toLowerCase().includes('hospedagem') ||
    String(e['Classificação'] || "").toLowerCase().includes('alojamento')
  );
  const restItem = realEstabelecimentos.find((e) =>
    String(e['Classificação'] || "").toLowerCase().includes('alimentação') ||
    String(e['Classificação'] || "").toLowerCase().includes('restaurante')
  );

  const numHospedagens = (cidade.hospedagens !== null && cidade.hospedagens !== undefined)
    ? Number(cidade.hospedagens).toLocaleString('pt-BR')
    : (hospItem ? Number(hospItem['Estabelecimentos']).toLocaleString('pt-BR') : "—");

  const numRestaurantes = (cidade.restaurantes !== null && cidade.restaurantes !== undefined)
    ? Number(cidade.restaurantes).toLocaleString('pt-BR')
    : (restItem ? Number(restItem['Estabelecimentos']).toLocaleString('pt-BR') : "—");

  const popExibida = formatarPopulacao(cidade.populacao);
  const pibExibido = formatarPIB(cidade.pib);

  const imagemCapa = cidade.imagens && cidade.imagens.length > 0
    ? (cidade.imagens.find(img => img.is_cover)?.image || cidade.imagens[0].image)
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
        {/* Botões de Ação FIXOS no modal */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black/40 hover:bg-black/70 text-white rounded-full text-xs font-semibold backdrop-blur-md border border-white/20 shadow-md transition-all duration-150 cursor-pointer"
            title="Fechar detalhes"
          >
            <X className="h-3.5 w-3.5" />
            <span>Fechar</span>
          </button>
        </div>

        {/* CONTAINER COM SCROLL */}
        <div className="w-full h-full overflow-y-auto flex flex-col bg-slate-50 relative">

          {/* =========================================================
              1. HEADER / HERO DA CIDADE
          ========================================================= */}
          <div className="relative w-full min-h-[300px] sm:min-h-[350px] bg-slate-900 overflow-hidden flex flex-col justify-end p-6 sm:p-8 shrink-0">
            {
              !imageError && imagemCapa ?
                <img
                  src={imagemCapa}
                  alt={cidade.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-70"
                  onError={() => setImageError(true)}
                />
                :
                <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-slate-900 to-slate-900 opacity-90" />
            }

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />

            {/* Nome e Indicadores */}
            <div className="relative z-10 w-full flex flex-col xl:flex-row xl:items-end justify-between gap-6">
              <div className="max-w-3xl">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-md mt-1 mb-2">
                  {cidade.name}
                </h1>
              </div>

              {/* 4 Cards Informativos (PIB, População, Hospedagem, Restaurantes) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 xl:w-auto">

                {/* Card 1: PIB */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 shadow-lg flex flex-col justify-center gap-1 min-w-[130px]">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-[#5BAF56] shrink-0" />
                    <span className="text-[10px] sm:text-xs font-medium text-white/80 uppercase tracking-wider">
                      PIB
                    </span>
                  </div>
                  <span className="text-lg sm:text-xl font-extrabold text-white">
                    {pibExibido}
                  </span>
                </div>

                {/* Card 2: População */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 shadow-lg flex flex-col justify-center gap-1 min-w-[130px]">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-[10px] sm:text-xs font-medium text-white/80 uppercase tracking-wider">
                      População
                    </span>
                  </div>
                  <span className="text-lg sm:text-xl font-extrabold text-white">
                    {popExibida}
                  </span>
                </div>

                {/* Card 3: Hospedagem */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 shadow-lg flex flex-col justify-center gap-1 min-w-[130px]">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-[#5BAF56] shrink-0" />
                    <span className="text-[10px] sm:text-xs font-medium text-white/80 uppercase tracking-wider">
                      Hospedagem
                    </span>
                  </div>
                  <span className="text-lg sm:text-xl font-extrabold text-white">
                    {numHospedagens}
                  </span>
                </div>

                {/* Card 4: Restaurantes */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 shadow-lg flex flex-col justify-center gap-1 min-w-[130px]">
                  <div className="flex items-center gap-1.5">
                    <UtensilsCrossed className="h-4 w-4 text-accent shrink-0" />
                    <span className="text-[10px] sm:text-xs font-medium text-white/80 uppercase tracking-wider">
                      Restaurantes
                    </span>
                  </div>
                  <span className="text-lg sm:text-xl font-extrabold text-white">
                    {numRestaurantes}
                  </span>
                </div>

              </div>
            </div>
          </div>

          {/* =========================================================
              CONTEÚDO DO PAINEL DA CIDADE
          ========================================================= */}
          <div className="p-4 sm:p-6 md:p-8 space-y-8">

            {/* SEÇÃO 1: SOBRE A CIDADE */}
            <div className="bg-site-surface rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
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
              <div className="bg-site-surface rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Principais Atrativos Turísticos
                  </span>
                  {pontosTuristicos.length > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {pontosTuristicos.length} {pontosTuristicos.length === 1 ? "atrativo" : "atrativos"}
                    </span>
                  )}
                </div>

                <div className="space-y-3.5 flex-1">
                  {loadingExtras ? (
                    <div className="flex items-center justify-center py-10 text-sm text-slate-400">
                      <RefreshCw className="animate-spin text-primary h-5 w-5 mr-2" />
                      Carregando atrativos...
                    </div>
                  ) : pontosTuristicos.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm flex flex-col items-center gap-2">
                      <Compass className="h-8 w-8 text-slate-300 stroke-[1.5]" />
                      <p>Nenhum ponto turístico cadastrado para este município no momento.</p>
                    </div>
                  ) : (
                    pontosTuristicos.map((ponto, index) => {
                      const img = ponto.imagens && ponto.imagens.length > 0
                        ? (ponto.imagens.find(i => i.is_cover)?.image || ponto.imagens[0].image)
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
                            <div className="w-full sm:w-16 h-12 sm:h-16 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
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
                            {ponto.contatos && ponto.contatos.length > 0 && ponto.contatos[0]?.address && (
                              <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3 text-accent shrink-0" />
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
              <div className="bg-site-surface rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Eventos e Festividades
                  </span>
                  {eventos.length > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                      {eventos.length} {eventos.length === 1 ? "evento" : "eventos"}
                    </span>
                  )}
                </div>

                <div className="space-y-3.5 flex-1">
                  {loadingExtras ? (
                    <div className="flex items-center justify-center py-10 text-sm text-slate-400">
                      <RefreshCw className="animate-spin text-primary h-5 w-5 mr-2" />
                      Carregando eventos...
                    </div>
                  ) : eventos.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm flex flex-col items-center gap-2">
                      <Calendar className="h-8 w-8 text-slate-300 stroke-[1.5]" />
                      <p>Nenhum evento programado para este município no momento.</p>
                    </div>
                  ) : (
                    eventos.map((evento, index) => {
                      const dataInfo = formatarDataEvento(evento.start_date);
                      const local = evento.contatos && evento.contatos.length > 0
                        ? (evento.contatos[0].address || evento.contatos[0].label || evento.contatos[0].value)
                        : cidade.name;

                      return (
                        <div
                          key={evento.id || index}
                          className="flex items-start sm:items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/80 transition-colors gap-3"
                        >
                          <div className="flex items-start sm:items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-primary text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
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
                                <MapPin className="h-3 w-3 text-accent shrink-0" />
                                <span className="truncate">{local}</span>
                              </span>
                            </div>
                          </div>
                          {evento.start_date && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary whitespace-nowrap shrink-0 hidden sm:inline-block">
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
            {cidade.contatos && cidade.contatos.length > 0 && (
              <div className="bg-site-surface rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                <span className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
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
                          <p className="text-sm font-semibold text-primary mt-1 flex items-center gap-2">
                            {contato.type?.toLowerCase().includes("email") ? (
                              <Mail className="h-4 w-4" />
                            ) : contato.type?.toLowerCase().includes("site") || contato.type?.toLowerCase().includes("website") ? (
                              <Globe className="h-4 w-4" />
                            ) : (
                              <Phone className="h-4 w-4" />
                            )}
                            {contato.value}
                          </p>
                        )}
                      </div>
                      {contato.address && (
                        <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-2">
                          <MapPin className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
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
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Dados Importantes e Analíticos</h2>
                    <p className="text-xs text-slate-500">Indicadores econômicos e turísticos da cidade</p>
                  </div>
                </div>

                {/* Indicador de Integridade */}
                {dataIsPartial ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200/50 shadow-sm self-start sm:self-auto">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[11px] font-bold tracking-wide uppercase">Dados Parciais</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/50 shadow-sm self-start sm:self-auto">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-bold tracking-wide uppercase">Dados Completos</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

                {/* Radar */}
                <div className="bg-site-surface rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col relative">
                  <div className="mb-4">
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide">Vocação Turística</h3>
                    <p className="text-xs text-slate-500">Distribuição de estabelecimentos por categoria</p>
                  </div>
                  <div className="h-64 w-full pt-2 relative flex items-center justify-center">
                    {loadingRealData ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10"><RefreshCw className="animate-spin text-primary h-6 w-6" /></div>
                    ) : combinedData.length === 0 ? (
                      <div className="text-slate-400 text-sm">Sem dados disponíveis</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={combinedData}>
                          <PolarGrid stroke="#EAF4E9" />
                          <PolarAngleAxis dataKey="Classificação" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                          <Radar name="Estabelecimentos" dataKey="Estabelecimentos" stroke="#359830" fill="#359830" fillOpacity={0.4} />
                          <Tooltip formatter={(val: number | string) => [`${val}`, "Quantidade"]} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Composed Chart */}
                <div className="bg-site-surface rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col relative xl:col-span-2">
                  <div className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide">Empresas vs. Empregos</h3>
                      <p className="text-xs text-slate-500">Proporção entre CNPJs e força de trabalho</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-[#359830]" /> Empresas</div>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> Vínculos</div>
                    </div>
                  </div>
                  <div className="h-64 w-full pt-2 relative">
                    {loadingRealData ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10"><RefreshCw className="animate-spin text-primary h-6 w-6" /></div>
                    ) : combinedData.length === 0 ? (
                      <div className="text-slate-400 text-sm h-full flex items-center justify-center">Sem dados disponíveis</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={combinedData} margin={{ top: 10, right: -15, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF4E9" />
                          <XAxis dataKey="Classificação" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#359830' }} axisLine={false} tickLine={false} orientation="left" />
                          <YAxis yAxisId="right" tick={{ fontSize: 10, fill: '#f59e0b' }} axisLine={false} tickLine={false} orientation="right" />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                          <Bar yAxisId="left" dataKey="Estabelecimentos" fill="#359830" radius={[4, 4, 0, 0]} barSize={20} name="Estabelecimentos" />
                          <Line yAxisId="right" type="monotone" dataKey="Funcionarios" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} name="Funcionários" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Gráfico 3: Saldo de Empregos */}
                <div className="bg-site-surface rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col relative xl:col-span-3">
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
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
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
                        <RefreshCw className="animate-spin text-primary h-6 w-6" />
                      </div>
                    ) : realPostos.length === 0 ? (
                      <div className="text-slate-400 text-sm h-full flex items-center justify-center">Sem dados para este ano</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={realPostos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF4E9" />
                          <XAxis
                            dataKey="Mês"
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#64748b' }}
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
                                <Cell key={`cell-${index}`} fill={Number(entry.Saldo) >= 0 ? '#359830' : '#ef4444'} />
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
