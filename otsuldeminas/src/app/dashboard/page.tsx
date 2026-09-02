/* eslint-disable */
"use client";

import { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, PieChart as PieChartIcon, LineChart as LineChartIcon, X, CheckCircle2, AlertTriangle, AlertCircle, Info, ChevronRight, Search, Download, FileText, Image as ImageIcon, ChevronDown, Trash2 } from "lucide-react";

const formatNumber = (value: number | string) => {
  if (typeof value === 'string') value = parseFloat(value);
  return new Intl.NumberFormat('pt-BR').format(value);
};

const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) return;
  const keys = Object.keys(data[0]);
  const csvContent = [
    keys.join(";"),
    ...data.map(row => keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(";"))
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};

import * as htmlToImage from 'html-to-image';

const exportChartAsPNG = async (elementId: string, filename: string) => {
  const chartWrapper = document.getElementById(elementId);
  if (!chartWrapper) return;
  
  try {
    const pngFile = await htmlToImage.toPng(chartWrapper, {
      pixelRatio: 2, // Melhor qualidade
      backgroundColor: "#ffffff",
    });
    
    const downloadLink = document.createElement("a");
    downloadLink.download = `${filename}.png`;
    downloadLink.href = pngFile;
    downloadLink.click();
  } catch (error) {
    console.error("Erro ao exportar imagem:", error);
  }
};

const ExportMenu = ({ onExportCSV, onExportPNG }: { onExportCSV: () => void, onExportPNG: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="text-xs font-medium flex items-center gap-1.5 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-primary transition-all px-3 py-1.5 rounded-md shadow-sm"
      >
        <Download className="h-3.5 w-3.5" /> 
        Exportar
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg border border-slate-200 z-50 overflow-hidden flex flex-col">
          <button 
            onMouseDown={() => { onExportCSV(); setIsOpen(false); }}
            className="text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100"
          >
            <FileText className="h-3.5 w-3.5 text-emerald-600" /> Planilha (CSV)
          </button>
          <button 
            onMouseDown={() => { onExportPNG(); setIsOpen(false); }}
            className="text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <ImageIcon className="h-3.5 w-3.5 text-blue-600" /> Imagem (PNG)
          </button>
        </div>
      )}
    </div>
  );
};

// Cores para as diferentes cidades no gráfico
const CITY_COLORS = [
  "#359830", "#287524", "#1D5C1B", "#5BAF56", "#C90C0F",
  "#359830", "#287524", "#1D5C1B", "#5BAF56", "#C90C0F"
];

const COLORS = ["#359830", "#287524", "#1D5C1B", "#5BAF56", "#EAF4E9", "#C90C0F"];

export default function Dashboard() {
  const [estabelecimentos, setEstabelecimentos] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [estoque, setEstoque] = useState<any[]>([]);
  const [postos, setPostos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const parseCSV = async (url: string) => {
        const response = await fetch(url);
        const csvString = await response.text();
        return new Promise<any[]>((resolve) => {
          Papa.parse(csvString, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => h.trim(),
            complete: (res) => resolve(res.data),
          });
        });
      };

      try {
        const [estData, funcData, estoqueData, postosData] = await Promise.all([
          parseCSV("/data/estabelecimentos.csv"),
          parseCSV("/data/funcionarios.csv"),
          parseCSV("/data/estoque_acumulado.csv"),
          parseCSV("/data/postos.csv"),
        ]);
        
        // --- INJEÇÃO DE DADOS PARA DEMONSTRAÇÃO NA REUNIÃO ---
        // Cidade Alfa: Totalmente ausente em Estabelecimentos e Funcionários (acionará ALERTA VERMELHO no gráfico de barras e pizza)
        // Só injetamos em Estoque para a cidade existir na caixa de buscas.
        estoqueData.push({ 'Município': 'Alfa (Sem Histórico)', 'Ano': '2023', 'Mês': '01', 'Estoque': '150' });
        
        // Cidade Beta: Apenas 1 setor preenchido. Acionará ALERTA AMARELO (dados parciais) nos gráficos de Barras e Pizza
        estData.push({ 'Município': 'Beta (Dados Parciais)', 'Classificação': 'Hospedagem', 'Estabelecimentos': '12' });
        funcData.push({ 'Município': 'Beta (Dados Parciais)', 'Classificação': 'Hospedagem', 'Funcionarios': '320' });
        estoqueData.push({ 'Município': 'Beta (Dados Parciais)', 'Ano': '2023', 'Mês': '01', 'Estoque': '150' });
        estoqueData.push({ 'Município': 'Beta (Dados Parciais)', 'Ano': '2023', 'Mês': '02', 'Estoque': '155' });
        // -----------------------------------------------------

        setEstabelecimentos(estData);
        setFuncionarios(funcData);
        setEstoque(estoqueData);
        setPostos(postosData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Extrair lista única de municípios
  const allCities = useMemo(() => {
    const cities = new Set<string>();
    const extract = (data: any[]) => {
      data.forEach(row => {
        const munKey = Object.keys(row).find(k => k.toLowerCase().includes("munic")) || "Município";
        if (row[munKey]) cities.add(row[munKey]);
      });
    };
    extract(estabelecimentos);
    extract(funcionarios);
    extract(estoque);
    return Array.from(cities).sort();
  }, [estabelecimentos, funcionarios, estoque]);

  const filteredCities = useMemo(() => {
    if (!searchTerm) return allCities;
    
    // Função para remover acentos e caracteres especiais
    const normalizeText = (text: string) => {
      return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };
    
    const lowerSearch = normalizeText(searchTerm);
    return allCities.filter(city => normalizeText(city).includes(lowerSearch));
  }, [searchTerm, allCities]);

  const toggleCity = (city: string) => {
    setSelectedCities(prev => {
      const isAdding = !prev.includes(city);
      if (isAdding && prev.length >= 1) setShowPieChart(false);
      return isAdding ? [...prev, city] : prev.filter(c => c !== city);
    });
  };

  const isComparing = selectedCities.length > 0;
  const dataKeys = selectedCities;

  // FUNÇÕES DE ALERTA DE DADOS FALTANTES
  // Verde: Todos os dados ok, Amarelo: Faltam alguns (parcial), Vermelho: Não há dados
  const getDataStatus = (data: any[], type: 'total' | 'time') => {
    if (!isComparing) return { status: "green", message: "Selecione uma cidade para visualizar a integridade dos dados." };
    
    let hasCompleteMiss = false;
    let hasPartialMiss = false;
    let messages: string[] = [];

    // Obter todos os setores ou datas possíveis
    let allCategories: string[] = [];
    if (data && data.length > 0) {
      if (type === 'total') {
        const classKey = Object.keys(data[0]).find(k => k.toLowerCase().includes("classifica")) || "Classificação";
        allCategories = Array.from(new Set(data.map(r => r[classKey]).filter(Boolean)));
      } else {
        const anoKey = Object.keys(data[0]).find(k => k.toLowerCase().includes("ano")) || "Ano";
        const mesKey = Object.keys(data[0]).find(k => k.toLowerCase().includes("mês") || k.toLowerCase().includes("mes")) || "Mês";
        allCategories = Array.from(new Set(data.map(r => `${r[anoKey]}-${r[mesKey]}`).filter(Boolean)));
      }
    }

    selectedCities.forEach(city => {
      const rows = data.filter(r => {
        const munKey = Object.keys(r).find(k => k.toLowerCase().includes("munic")) || "Município";
        return r[munKey] === city;
      });
      
      if (rows.length === 0) {
        hasCompleteMiss = true;
        messages.push(`${city}: Sem dados registrados nesta categoria.`);
      } else {
        // Verificar categorias faltantes
        let missing = [];
        if (type === 'total') {
          const classKey = Object.keys(rows[0] || data[0]).find(k => k.toLowerCase().includes("classifica")) || "Classificação";
          const cityCats = rows.map(r => r[classKey]);
          missing = allCategories.filter(c => !cityCats.includes(c));
        } else {
          const anoKey = Object.keys(rows[0] || data[0]).find(k => k.toLowerCase().includes("ano")) || "Ano";
          const mesKey = Object.keys(rows[0] || data[0]).find(k => k.toLowerCase().includes("mês") || k.toLowerCase().includes("mes")) || "Mês";
          const cityCats = rows.map(r => `${r[anoKey]}-${r[mesKey]}`);
          missing = allCategories.filter(c => !cityCats.includes(c));
        }

        if (missing.length > 0) {
          // No gráfico temporal, só reclamar se tiver muito pouco dado
          if (type === 'time' && rows.length >= 24) return;
          
          hasPartialMiss = true;
          const displayMissing = missing.slice(0, 3).join(", ");
          const andMore = missing.length > 3 ? ` e +${missing.length - 3}` : '';
          
          if (type === 'total') {
            messages.push(`${city}: Faltam setores (${displayMissing}${andMore}).`);
          } else {
            messages.push(`${city}: Faltam datas (${displayMissing}${andMore}).`);
          }
        }
      }
    });

    if (hasCompleteMiss) return { status: "red", message: "Cidades com dados ausentes:\n" + messages.join("\n") };
    if (hasPartialMiss) return { status: "yellow", message: "Cidades com dados parciais:\n" + messages.join("\n") };
    return { status: "green", message: "Todos os dados estão íntegros para as cidades selecionadas." };
  };

  const renderStatusIcon = (statusInfo: { status: string, message: string }) => {
    const Icon = statusInfo.status === "green" ? CheckCircle2 : statusInfo.status === "yellow" ? AlertTriangle : AlertCircle;
    const colorClass = statusInfo.status === "green" ? "text-green-500" : statusInfo.status === "yellow" ? "text-yellow-500" : "text-red-500";
    
    return (
      <div className="relative group flex items-center justify-center">
        <Icon className={`h-5 w-5 ${colorClass} cursor-help`} />
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 bg-slate-800 text-white text-xs rounded-lg p-3 shadow-xl z-50 whitespace-pre-wrap pointer-events-none">
          {statusInfo.message}
          <div className="absolute -bottom-1 right-2 w-2 h-2 bg-slate-800 transform rotate-45"></div>
        </div>
      </div>
    );
  };

  // Processamento de Dados (Estabelecimentos e Funcionários)
  const processData = (data: any[], valKeyTerm: string) => {
    if (!isComparing) return {};
    return data.reduce((acc: any, curr: any) => {
      const classKey = Object.keys(curr).find(k => k.toLowerCase().includes("classifica")) || "Classificação";
      const valKey = Object.keys(curr).find(k => k.toLowerCase().includes(valKeyTerm)) || valKeyTerm;
      const munKey = Object.keys(curr).find(k => k.toLowerCase().includes("munic")) || "Município";
      
      const classificacao = curr[classKey];
      const cidade = curr[munKey];
      const qtde = parseInt(curr[valKey]) || 0;

      if (!classificacao) return acc;
      if (!selectedCities.includes(cidade)) return acc;

      if (!acc[classificacao]) acc[classificacao] = { name: classificacao };
      
      acc[classificacao][cidade] = (acc[classificacao][cidade] || 0) + qtde;
      
      return acc;
    }, {});
  };

  const chartDataEstabelecimentos = Object.values(processData(estabelecimentos, "estabelecimentos"))
    .sort((a: any, b: any) => {
       const sumA = dataKeys.reduce((s, k) => s + (a[k] || 0), 0);
       const sumB = dataKeys.reduce((s, k) => s + (b[k] || 0), 0);
       return sumB - sumA;
    });

  const rawFuncData = processData(funcionarios, "funcionario");
  const chartDataFuncionarios = Object.values(rawFuncData)
    .sort((a: any, b: any) => {
       const sumA = dataKeys.reduce((s, k) => s + (a[k] || 0), 0);
       const sumB = dataKeys.reduce((s, k) => s + (b[k] || 0), 0);
       return sumB - sumA;
    });

  const activePieCity = isComparing 
    ? (pieChartCity === "Total" || selectedCities.includes(pieChartCity) ? pieChartCity : selectedCities[0]) 
    : "Total";

  const pieChartData = chartDataFuncionarios.map((d: any) => {
    if (activePieCity === "Total" && isComparing) {
      const total = selectedCities.reduce((s, k) => s + (d[k] || 0), 0);
      return { name: d.name, value: total };
    } else {
      return { name: d.name, value: d[activePieCity] || 0 };
    }
  }).filter((d: any) => d.value > 0);

  const getPieCellColor = (index: number) => {
    if (activePieCity === "Total" || !isComparing) {
      return COLORS[index % COLORS.length];
    }
    
    const cityIndex = selectedCities.indexOf(activePieCity);
    if (cityIndex === -1) return COLORS[index % COLORS.length];
    
    const baseColor = CITY_COLORS[cityIndex % CITY_COLORS.length];
    // Opacidades Hex: 100%, 85%, 70%, 55%, 40%, 25% para criar tons diferentes
    const opacities = ["FF", "D9", "B3", "8C", "66", "40"]; 
    return baseColor + opacities[index % opacities.length];
  };

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, name } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.15; // Mantém o texto pertinho da pizza para não fugir da tela
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text 
        x={x} 
        y={y} 
        fill="#292929" // Força o texto a ser escuro e legível, ignorando a cor da fatia
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central" 
        fontSize={11}
        fontWeight={500}
      >
        {`${name || ''} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  // Processamento de Dados (Estoque)
  const estoquePorData = !isComparing ? {} : estoque.reduce((acc: any, curr: any) => {
    const anoKey = Object.keys(curr).find(k => k.toLowerCase().includes("ano")) || "Ano";
    const mesKey = Object.keys(curr).find(k => k.toLowerCase().includes("mês") || k.toLowerCase().includes("mes")) || "Mês";
    const estoqueKey = Object.keys(curr).find(k => k.toLowerCase().includes("estoque")) || "Estoque";
    const munKey = Object.keys(curr).find(k => k.toLowerCase().includes("munic")) || "Município";
    
    const ano = curr[anoKey];
    const mes = curr[mesKey];
    const cidade = curr[munKey];
    const valor = parseInt(curr[estoqueKey]) || 0;
    
    if (ano && mes) {
      if (!selectedCities.includes(cidade)) return acc;

      const dataStr = `${ano}-${mes.toString().padStart(2, '0')}`;
      if (!acc[dataStr]) acc[dataStr] = { data: dataStr };
      
      acc[dataStr][cidade] = (acc[dataStr][cidade] || 0) + valor;
    }
    return acc;
  }, {});

  const chartDataEstoque = Object.values(estoquePorData)
    .sort((a: any, b: any) => a.data.localeCompare(b.data))
    .filter((d: any) => {
      if (timeFilter === "custom" && startYear && startMonth && endYear && endMonth) {
        const sDate = `${startYear}-${startMonth}`;
        const eDate = `${endYear}-${endMonth}`;
        return d.data >= sDate && d.data <= eDate;
      }
      return true;
    })
    .slice(timeFilter === "6m" ? -6 : timeFilter === "12m" ? -12 : undefined);

  // Novos Gráficos (Radar, Área, Ranking)
  // 1. Radar (Distribuição de Estabelecimentos - só funciona bem se houver poucas cidades, ideal para comparar 1 a 3 cidades)
  const radarData = chartDataEstabelecimentos.slice(0, 6); // Top 6 setores para não poluir

  // 2. Área (Saldo de Postos de Trabalho)
  const postosPorData = !isComparing ? {} : postos.reduce((acc: any, curr: any) => {
    const anoKey = Object.keys(curr).find(k => k.toLowerCase().includes("ano")) || "Ano";
    const mesKey = Object.keys(curr).find(k => k.toLowerCase().includes("mês") || k.toLowerCase().includes("mes")) || "Mês";
    const saldoKey = Object.keys(curr).find(k => k.toLowerCase().includes("saldo")) || "Saldo";
    const munKey = Object.keys(curr).find(k => k.toLowerCase().includes("munic")) || "Município";
    
    const ano = curr[anoKey];
    const mes = curr[mesKey];
    const cidade = curr[munKey];
    const valor = parseInt(curr[saldoKey]) || 0;
    
    if (ano && mes) {
      if (!selectedCities.includes(cidade)) return acc;

      const dataStr = `${ano}-${mes.toString().padStart(2, '0')}`;
      if (!acc[dataStr]) acc[dataStr] = { data: dataStr };
      
      acc[dataStr][cidade] = (acc[dataStr][cidade] || 0) + valor;
    }
    return acc;
  }, {});

  const chartDataPostos = Object.values(postosPorData)
    .sort((a: any, b: any) => a.data.localeCompare(b.data))
    .filter((d: any) => {
      if (timeFilter === "custom" && startYear && startMonth && endYear && endMonth) {
        const sDate = `${startYear}-${startMonth}`;
        const eDate = `${endYear}-${endMonth}`;
        return d.data >= sDate && d.data <= eDate;
      }
      return true;
    })
    .slice(timeFilter === "6m" ? -6 : timeFilter === "12m" ? -12 : undefined);

  // 3. Ranking Horizontal de Cidades (Funcionários totais)
  const funcPorCidade = funcionarios.reduce((acc: any, curr: any) => {
    const munKey = Object.keys(curr).find(k => k.toLowerCase().includes("munic")) || "Município";
    const funcKey = Object.keys(curr).find(k => k.toLowerCase().includes("funcionario")) || "Funcionarios";
    
    const cidade = curr[munKey];
    const qtde = parseInt(curr[funcKey]) || 0;
    
    if (cidade) {
      if (!acc[cidade]) acc[cidade] = 0;
      acc[cidade] += qtde;
    }
    return acc;
  }, {});

  const chartDataRanking = Object.keys(funcPorCidade).map(key => ({
    cidade: key,
    funcionarios: funcPorCidade[key]
  })).sort((a, b) => b.funcionarios - a.funcionarios).slice(0, 10); // Top 10 cidades

  // Extrair todas as datas disponíveis do Estoque (para o filtro customizado)
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    estoque.forEach(curr => {
      const anoKey = Object.keys(curr).find(k => k.toLowerCase().includes("ano")) || "Ano";
      const mesKey = Object.keys(curr).find(k => k.toLowerCase().includes("mês") || k.toLowerCase().includes("mes")) || "Mês";
      const ano = curr[anoKey];
      const mes = curr[mesKey];
      if (ano && mes) {
        dates.add(`${ano}-${mes.toString().padStart(2, '0')}`);
      }
    });
    return Array.from(dates).sort();
  }, [estoque]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    availableDates.forEach(d => years.add(d.split("-")[0]));
    return Array.from(years).sort().reverse();
  }, [availableDates]);

  const monthsList = [
    { value: "01", label: "Jan" }, { value: "02", label: "Fev" }, { value: "03", label: "Mar" },
    { value: "04", label: "Abr" }, { value: "05", label: "Mai" }, { value: "06", label: "Jun" },
    { value: "07", label: "Jul" }, { value: "08", label: "Ago" }, { value: "09", label: "Set" },
    { value: "10", label: "Out" }, { value: "11", label: "Nov" }, { value: "12", label: "Dez" }
  ];

  const formatMonthYear = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month] = dateStr.split("-");
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[parseInt(month) - 1]}/${year}`;
  };

  const formatXAxisDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month] = dateStr.split("-");
    return `${month}/${year.slice(-2)}`;
  };

  const formatTooltipDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month] = dateStr.split("-");
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return `${months[parseInt(month) - 1]} de ${year}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Skeleton Header */}
        <div className="h-64 bg-slate-900 animate-pulse w-full"></div>
        {/* Skeleton Filter Bar */}
        <div className="h-20 bg-white border-b border-slate-200 shadow-sm animate-pulse w-full"></div>
        {/* Skeleton Content */}
        <div className="max-w-7xl mx-auto w-full px-4 py-8 flex-1">
          {/* Skeleton Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
          {/* Skeleton Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {[1, 2].map(i => (
              <div key={i} className="h-96 bg-slate-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main id="dashboard-main" className="min-h-screen bg-slate-50 pb-20">
      {/* Header com Background */}
      <header className="relative bg-slate-900 shadow-xl print:bg-white print:shadow-none print:border-b print:border-slate-200">
        <div className="absolute inset-0 overflow-hidden print:hidden">
          <img src="/images/hero-bg.png" alt="Pontos turísticos do Sul de Minas Gerais" className="w-full h-full object-cover object-[center_25%] opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative px-4 py-20 md:py-28 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex flex-col gap-1">
                  <div className="h-5 w-2 md:h-7 md:w-3 bg-primary rounded-t-full shadow-lg shadow-primary/20"></div>
                  <div className="h-5 w-2 md:h-7 md:w-3 bg-accent rounded-b-full shadow-lg shadow-accent/20"></div>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white uppercase drop-shadow-lg print:text-slate-900 print:drop-shadow-none">
                  Observatório de <span className="text-accent">Turismo</span>
                </h1>
              </div>
              <p className="text-slate-300 text-lg md:text-2xl font-medium ml-5 drop-shadow-sm tracking-wide print:text-slate-600 print:drop-shadow-none">
                do Sul de Minas Gerais • Instituto Federal
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* NOVA Seção de Filtro: Busca Inteligente & Chips */}
      <div className="no-export print:hidden bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1 w-full max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Busque uma cidade para analisar..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
              />
            </div>
            
            {/* Dropdown de sugestões */}
            {isDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border border-slate-200 max-h-60 overflow-y-auto">
                <div className="p-2">
                  <div className="flex justify-between items-center px-2 py-1 mb-1 border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cidades disponíveis</span>
                    <button onClick={() => setIsDropdownOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-1">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  {filteredCities.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-slate-500 text-center">Nenhuma cidade encontrada.</div>
                  ) : (
                    <div className="flex flex-col gap-1 mt-2">
                      {filteredCities.map((city) => {
                        const isSelected = selectedCities.includes(city);
                        if (isSelected) return null; // Esconde se já estiver selecionada
                        return (
                          <button
                            key={city}
                            onClick={() => {
                              setSelectedCities(prev => {
                                if (prev.length >= 1) setShowPieChart(false);
                                return [...prev, city];
                              });
                              setSearchTerm("");
                              setIsDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-primary/10 hover:text-primary rounded-md transition-colors flex items-center justify-between"
                          >
                            {city}
                            <span className="text-xs text-primary/70 opacity-0 group-hover:opacity-100">Adicionar +</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Cidades Selecionadas (Chips) */}
          <div className="flex-1 flex flex-wrap gap-2 items-center min-h-[38px]">
            {selectedCities.length === 0 ? (
              <span className="text-sm text-slate-500 italic bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                Nenhuma cidade selecionada. Pesquise e adicione cidades para iniciar a análise.
              </span>
            ) : (
              <>
                <span className="text-sm font-semibold text-slate-600 mr-1 uppercase tracking-wide text-xs">Comparando:</span>
                {selectedCities.map(city => (
                  <span 
                    key={city} 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-primary text-primary-foreground shadow-sm animate-in fade-in zoom-in duration-200"
                  >
                    {city}
                    <button
                      onClick={() => toggleCity(city)}
                      className="hover:bg-primary-foreground/20 p-0.5 rounded-full transition-colors flex-shrink-0"
                      title="Remover"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => setSelectedCities([])}
                  className="text-xs font-semibold text-slate-500 hover:text-destructive transition-colors ml-2 hover:underline bg-slate-100 px-2 py-1 rounded"
                >
                  Limpar tudo
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        
        {/* Resumo Dinâmico */}
        <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-slate-100 flex items-start gap-4 print:shadow-none print:border-slate-200 print:break-inside-avoid">
          <div className="p-3 bg-primary/10 rounded-full text-primary mt-1">
            <Info className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">
              {isComparing 
                ? `Analisando ${selectedCities.length} cidade(s)` 
                : "Aguardando seleção de cidades"}
            </h3>
            <p className="text-slate-600 text-base leading-relaxed">
              {isComparing 
                ? `Você está visualizando indicadores turísticos restritos aos municípios de ${selectedCities.join(", ")}. Verifique os ícones de integridade de dados nos cantos dos gráficos: gráficos com exclamações amarelas ou vermelhas indicam que um ou mais municípios selecionados não enviaram dados completos para aquele indicador.`
                : "Utilize a barra de busca acima para selecionar uma ou mais cidades. Os gráficos serão preenchidos automaticamente com os dados da região escolhida."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 print:flex print:flex-col print:gap-12">
          {/* Gráfico de Estabelecimentos */}
          <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-100 print:shadow-none print:border-slate-200 print:break-inside-avoid">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl text-slate-800">Estabelecimentos por Setor</CardTitle>
                  <CardDescription>Quantidade de negócios classificados por categoria.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <ExportMenu 
                    onExportCSV={() => exportToCSV(chartDataEstabelecimentos, "estabelecimentos_setor")} 
                    onExportPNG={() => exportChartAsPNG("chart-estabelecimentos", "estabelecimentos_setor")} 
                  />
                  {renderStatusIcon(getDataStatus(estabelecimentos, 'total'))}
                </div>
              </div>
            </CardHeader>
            <CardContent id="chart-estabelecimentos" className="h-[400px] bg-slate-50/80 rounded-b-xl pt-4 border-t border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataEstabelecimentos} margin={{ top: 20, right: 10, left: 0, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF4E9" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#292929'}} interval={0} angle={-45} textAnchor="end" height={90} />
                  <YAxis tick={{fontSize: 12, fill: '#292929'}} width={45} tickFormatter={formatNumber} />
                  <Tooltip cursor={{fill: '#EAF4E9'}} formatter={(value: any) => formatNumber(value as number)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend verticalAlign="top" height={40} wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} />
                  {dataKeys.map((key, i) => (
                    <Bar key={key} dataKey={key} fill={isComparing ? CITY_COLORS[i % CITY_COLORS.length] : "var(--primary)"} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Funcionários */}
          <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-100 print:shadow-none print:border-slate-200 print:break-inside-avoid">
            <CardHeader className="flex flex-col pb-2 gap-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl text-slate-800">Força de Trabalho</CardTitle>
                  <CardDescription>Distribuição de funcionários nos setores turísticos.</CardDescription>
                </div>
                
                <div className="flex items-center gap-2 self-start">
                  <ExportMenu 
                    onExportCSV={() => exportToCSV(chartDataFuncionarios, "forca_trabalho")} 
                    onExportPNG={() => exportChartAsPNG("chart-forca-trabalho", "forca_trabalho")} 
                  />
                  {renderStatusIcon(getDataStatus(funcionarios, 'total'))}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-start gap-2">
                <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                  <button 
                    onClick={() => setShowPieChart(true)} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${showPieChart ? 'bg-white shadow-sm text-primary font-medium' : 'text-slate-400 hover:text-slate-700'}`}
                    title="Visão em Pizza (Total)"
                  >
                    <PieChartIcon className="h-4 w-4" />
                    <span className="text-xs hidden sm:inline">Pizza</span>
                  </button>
                  <button 
                    onClick={() => setShowPieChart(false)} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${!showPieChart ? 'bg-white shadow-sm text-primary font-medium' : 'text-slate-400 hover:text-slate-700'}`}
                    title="Visão em Linhas (Comparativo)"
                  >
                    <LineChartIcon className="h-4 w-4" />
                    <span className="text-xs hidden sm:inline">Linhas</span>
                  </button>
                </div>

                {showPieChart && isComparing && (
                  <select 
                    value={activePieCity}
                    onChange={(e) => setPieChartCity(e.target.value)}
                    className="text-sm border border-slate-200 rounded-md p-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                  >
                    <option value="Total">Todas Selecionadas</option>
                    {selectedCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                )}
              </div>
            </CardHeader>
            <CardContent id="chart-forca-trabalho" className="h-[400px] bg-slate-50/80 rounded-b-xl pt-4 border-t border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                {showPieChart ? (
                  <PieChart margin={{ top: 20, right: 0, left: 0, bottom: 20 }}>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={renderCustomizedLabel}
                      labelLine={true}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getPieCellColor(index)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatNumber(value as number)} contentStyle={{borderRadius: '8px', border: '1px solid #EAF4E9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  </PieChart>
                ) : (
                  <LineChart data={chartDataFuncionarios} margin={{ top: 20, right: 10, left: 0, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF4E9" />
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#292929'}} interval={0} angle={-45} textAnchor="end" height={90} />
                    <YAxis tick={{fontSize: 12, fill: '#292929'}} width={45} tickFormatter={formatNumber} />
                    <Tooltip formatter={(value: any) => formatNumber(value as number)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend verticalAlign="top" height={40} wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} />
                    {dataKeys.map((key, i) => (
                      <Line 
                        key={key}
                        type="monotone"
                        dataKey={key} 
                        stroke={isComparing ? CITY_COLORS[i % CITY_COLORS.length] : "var(--primary)"} 
                        strokeWidth={2}
                        dot={{r: 4, strokeWidth: 1}}
                        activeDot={{r: 6, strokeWidth: 0}}
                      />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8 mb-12 print:flex print:flex-col print:gap-12">
          {/* Gráfico de Estoque Acumulado */}
          <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-100 print:shadow-none print:border-slate-200 print:break-inside-avoid">
            <CardHeader className="pb-2">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl text-slate-800">Estoque Acumulado de Empregos</CardTitle>
                  <CardDescription>Série histórica do volume de vagas ativas. (Filtros aplicam-se aos dois gráficos temporais)</CardDescription>
                </div>
                
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                  {/* Filtros de Tempo */}
                  <div className="flex flex-col gap-2 no-export print:hidden">
                    <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-lg border border-slate-200 self-end relative">
                      <button onClick={() => { setTimeFilter("6m"); setIsCustomDateOpen(false); }} className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${timeFilter === "6m" ? 'bg-white shadow-sm text-primary font-medium' : 'text-slate-500 hover:text-slate-700'}`}>6 Meses</button>
                      <button onClick={() => { setTimeFilter("12m"); setIsCustomDateOpen(false); }} className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${timeFilter === "12m" ? 'bg-white shadow-sm text-primary font-medium' : 'text-slate-500 hover:text-slate-700'}`}>1 Ano</button>
                      <button onClick={() => { setTimeFilter("all"); setIsCustomDateOpen(false); }} className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${timeFilter === "all" ? 'bg-white shadow-sm text-primary font-medium' : 'text-slate-500 hover:text-slate-700'}`}>Tudo</button>
                      
                      <div>
                        <button onClick={() => { setTimeFilter("custom"); setIsCustomDateOpen(!isCustomDateOpen); }} className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors flex items-center ${timeFilter === "custom" ? 'bg-white shadow-sm text-primary font-medium' : 'text-slate-500 hover:text-slate-700'}`}>
                          Personalizado <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${isCustomDateOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {timeFilter === "custom" && isCustomDateOpen && (
                          <div className="absolute top-full right-0 mt-2 p-4 bg-white border border-slate-200 rounded-xl shadow-xl z-50 w-64 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">Período Personalizado</h4>
                            <div className="flex flex-col gap-4">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-xs text-slate-500 font-medium">Data Inicial</label>
                                  {(startMonth || startYear) && (
                                    <button onClick={() => { setStartMonth(""); setStartYear(""); }} className="text-slate-400 hover:text-red-500 transition-colors" title="Limpar Data Inicial">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-1/2 text-sm border border-slate-200 rounded-md bg-slate-50 p-2 outline-none focus:ring-1 focus:ring-primary text-slate-700">
                                    <option value="">Mês...</option>
                                    {monthsList.map(m => <option key={`sm-${m.value}`} value={m.value}>{m.label}</option>)}
                                  </select>
                                  <select value={startYear} onChange={e => setStartYear(e.target.value)} className="w-1/2 text-sm border border-slate-200 rounded-md bg-slate-50 p-2 outline-none focus:ring-1 focus:ring-primary text-slate-700">
                                    <option value="">Ano...</option>
                                    {availableYears.map(y => <option key={`sy-${y}`} value={y}>{y}</option>)}
                                  </select>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-xs text-slate-500 font-medium">Data Final</label>
                                  {(endMonth || endYear) && (
                                    <button onClick={() => { setEndMonth(""); setEndYear(""); }} className="text-slate-400 hover:text-red-500 transition-colors" title="Limpar Data Final">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-1/2 text-sm border border-slate-200 rounded-md bg-slate-50 p-2 outline-none focus:ring-1 focus:ring-primary text-slate-700">
                                    <option value="">Mês...</option>
                                    {monthsList.map(m => <option key={`em-${m.value}`} value={m.value}>{m.label}</option>)}
                                  </select>
                                  <select value={endYear} onChange={e => setEndYear(e.target.value)} className="w-1/2 text-sm border border-slate-200 rounded-md bg-slate-50 p-2 outline-none focus:ring-1 focus:ring-primary text-slate-700">
                                    <option value="">Ano...</option>
                                    {availableYears.map(y => <option key={`ey-${y}`} value={y}>{y}</option>)}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ExportMenu 
                      onExportCSV={() => exportToCSV(chartDataEstoque, "estoque_acumulado")} 
                      onExportPNG={() => exportChartAsPNG("chart-estoque", "estoque_acumulado")} 
                    />
                    {renderStatusIcon(getDataStatus(estoque, 'time'))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent id="chart-estoque" className="h-[400px] bg-slate-50/80 rounded-b-xl pt-4 border-t border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartDataEstoque} margin={{ top: 20, right: 30, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF4E9" />
                  <XAxis dataKey="data" tickFormatter={formatXAxisDate} tick={{fontSize: 12, fill: '#292929'}} height={50} dy={15} />
                  <YAxis tick={{fontSize: 12, fill: '#292929'}} width={50} tickFormatter={formatNumber} />
                  <Tooltip labelFormatter={(label: any) => formatTooltipDate(label as string)} formatter={(value: any) => formatNumber(value as number)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Legend verticalAlign="top" height={40} wrapperStyle={{ fontSize: '12px', paddingBottom: '15px' }} />
                  {dataKeys.map((key, i) => (
                    <Line 
                      key={key}
                      type="monotone" 
                      dataKey={key} 
                      stroke={isComparing ? CITY_COLORS[i % CITY_COLORS.length] : "var(--primary)"} 
                      strokeWidth={3} 
                      dot={{r: 3, fill: isComparing ? CITY_COLORS[i % CITY_COLORS.length] : "var(--primary)", strokeWidth: 2, stroke: "#fff"}}
                      activeDot={{r: 6, strokeWidth: 0}} 
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* NOVA SEÇÃO: Análises Exploratórias */}
        <div className="pt-8 border-t border-slate-200">
          <div className="mb-6 flex flex-col sm:flex-row items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800">Análises Exploratórias</h2>
            <span className="bg-accent/10 text-accent text-xs font-semibold px-2 py-1 rounded border border-accent/30">Novos Gráficos</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 print:flex print:flex-col print:gap-12">
            
            {/* Gráfico 1: Área - Saldo de Postos */}
            <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-100 lg:col-span-2 xl:col-span-1">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-slate-800">Saldo de Postos (Admissões vs Demissões)</CardTitle>
                    <CardDescription>Balanço líquido de empregos gerados.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExportMenu 
                      onExportCSV={() => exportToCSV(chartDataPostos, "saldo_postos")} 
                      onExportPNG={() => exportChartAsPNG("chart-postos", "saldo_postos")} 
                    />
                    {renderStatusIcon(getDataStatus(postos, 'time'))}
                  </div>
                </div>
              </CardHeader>
              <CardContent id="chart-postos" className="h-[350px] bg-slate-50/80 rounded-b-xl pt-4 border-t border-slate-100">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDataPostos} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <defs>
                      {dataKeys.map((key, i) => (
                        <linearGradient key={`color-${key}`} id={`color-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isComparing ? CITY_COLORS[i % CITY_COLORS.length] : "var(--primary)"} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={isComparing ? CITY_COLORS[i % CITY_COLORS.length] : "var(--primary)"} stopOpacity={0}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF4E9" />
                    <XAxis dataKey="data" tickFormatter={formatXAxisDate} tick={{fontSize: 10, fill: '#292929'}} dy={10} />
                    <YAxis tick={{fontSize: 10, fill: '#292929'}} tickFormatter={formatNumber} />
                    <Tooltip labelFormatter={(label: any) => formatTooltipDate(label as string)} formatter={(value: any) => formatNumber(value as number)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    {dataKeys.map((key, i) => (
                      <Area 
                        key={key} 
                        type="monotone" 
                        dataKey={key} 
                        stroke={isComparing ? CITY_COLORS[i % CITY_COLORS.length] : "var(--primary)"} 
                        fillOpacity={1} 
                        fill={`url(#color-${i})`} 
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico 2: Radar - Perfil Turístico */}
            <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-100 print:shadow-none print:border-slate-200 print:break-inside-avoid">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-slate-800">Perfil Turístico (Setores)</CardTitle>
                    <CardDescription>Formato de atuação baseado em estabelecimentos.</CardDescription>
                  </div>
                  <ExportMenu 
                    onExportCSV={() => exportToCSV(radarData, "perfil_turistico")} 
                    onExportPNG={() => exportChartAsPNG("chart-perfil", "perfil_turistico")} 
                  />
                </div>
              </CardHeader>
              <CardContent id="chart-perfil" className="h-[350px] bg-slate-50/80 rounded-b-xl pt-4 border-t border-slate-100">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                    <PolarGrid stroke="#EAF4E9" />
                    <PolarAngleAxis dataKey="name" tick={{fontSize: 10, fill: '#292929'}} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{fontSize: 10}} tickFormatter={formatNumber} />
                    <Tooltip formatter={(value: any) => formatNumber(value as number)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    {dataKeys.map((key, i) => (
                      <Radar 
                        key={key} 
                        name={key} 
                        dataKey={key} 
                        stroke={isComparing ? CITY_COLORS[i % CITY_COLORS.length] : "var(--primary)"} 
                        fill={isComparing ? CITY_COLORS[i % CITY_COLORS.length] : "var(--primary)"} 
                        fillOpacity={0.4} 
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico 3: Ranking de Cidades */}
            {selectedCities.length <= 1 && (
              <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-100 lg:col-span-2 xl:col-span-1 print:shadow-none print:border-slate-200 print:break-inside-avoid">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-slate-800">Top 10 Volume de Funcionários</CardTitle>
                      <CardDescription>As cidades com maior força de trabalho (Geral).</CardDescription>
                    </div>
                    <ExportMenu 
                      onExportCSV={() => exportToCSV(chartDataRanking, "ranking_cidades")} 
                      onExportPNG={() => exportChartAsPNG("chart-ranking", "ranking_cidades")} 
                    />
                  </div>
                </CardHeader>
                <CardContent id="chart-ranking" className="h-[350px] bg-slate-50/80 rounded-b-xl pt-4 border-t border-slate-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataRanking} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EAF4E9" />
                      <XAxis type="number" tick={{fontSize: 10, fill: '#292929'}} tickFormatter={formatNumber} />
                      <YAxis dataKey="cidade" type="category" tick={{fontSize: 11, fill: '#292929'}} width={80} />
                      <Tooltip cursor={{fill: '#EAF4E9'}} formatter={(value: any) => formatNumber(value as number)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="funcionarios" name="Funcionários" fill="var(--primary)" radius={[0, 4, 4, 0]}>
                        {chartDataRanking.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length] || "var(--primary)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

          </div>
        </div>

      </div>

      {/* Rodapé */}
      <footer className="mt-16 pt-8 pb-4 border-t border-slate-200 text-center">
        <p className="text-sm text-slate-400">Observatório de Turismo do Sul de Minas Gerais © 2026</p>
      </footer>
    </main>
  );
}
