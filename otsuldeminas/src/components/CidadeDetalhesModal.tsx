"use client";

import { useEffect, useState } from "react";
import { 
  Building2, 
  Bed, 
  Utensils, 
  Users, 
  MapPin, 
  X,
  Sparkles,
  Info
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import type { Cidade } from "@/data/cidades";

interface CidadeDetalhesModalProps {
  cidade: Cidade | null;
  onClose: () => void;
}

export function CidadeDetalhesModal({ cidade, onClose }: CidadeDetalhesModalProps) {
  const [imageError, setImageError] = useState(false);

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

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl bg-slate-50 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col border border-slate-200/80 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================
            1. HEADER / HERO DA CIDADE
        ========================================================= */}
        <div className="relative w-full min-h-[220px] sm:min-h-[260px] md:min-h-[280px] bg-slate-900 overflow-hidden flex flex-col justify-end p-6 sm:p-8 shrink-0">
          {/* Imagem de Fundo da Cidade */}
          {!imageError && cidade.imagem ? (
            <img
              src={cidade.imagem}
              alt={cidade.nome}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-slate-900 to-slate-900 opacity-90" />
          )}

          {/* Gradientes de escurecimento para leitura perfeita */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-900/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />

          {/* Botão Fechar no Topo Direito */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black/50 hover:bg-black/80 text-white rounded-full text-xs font-semibold backdrop-blur-md border border-white/20 shadow-md transition-all duration-150 cursor-pointer"
            title="Fechar detalhes"
          >
            <X className="h-3.5 w-3.5" />
            <span>Fechar</span>
          </button>

          {/* Textos e Tags do Hero */}
          <div className="relative z-10 max-w-3xl">
            <span className="text-[11px] sm:text-xs font-bold text-slate-300 tracking-widest uppercase mb-1.5 flex items-center gap-1.5 drop-shadow">
              <MapPin className="h-3 w-3 text-primary" />
              Sul de Minas Gerais
            </span>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md mb-3">
              {cidade.nome}
            </h1>

            {/* Pílulas / Tags da Cidade */}
            <div className="flex flex-wrap gap-2 pt-1">
              {cidade.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium text-white border border-white/30 shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* =========================================================
            CONTEÚDO ROLÁVEL DO PAINEL DA CIDADE
        ========================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 bg-slate-50">
          
          {/* =========================================================
              2. CARDS DE INDICADORES (KPIs - 4 Cards no Topo)
          ========================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Hospedagem */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight block">
                  {cidade.hospedagens}
                </span>
                <span className="text-xs font-medium text-slate-500 block leading-tight">
                  Meios de Hospedagem
                </span>
              </div>
            </div>

            {/* Card 2: Leitos */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                <Bed className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight block">
                  {cidade.leitos}
                </span>
                <span className="text-xs font-medium text-slate-500 block leading-tight">
                  Leitos Disponíveis
                </span>
              </div>
            </div>

            {/* Card 3: Restaurantes */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                <Utensils className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight block">
                  {cidade.restaurantes}
                </span>
                <span className="text-xs font-medium text-slate-500 block leading-tight">
                  Restaurantes
                </span>
              </div>
            </div>

            {/* Card 4: População */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight block">
                  {cidade.populacao}
                </span>
                <span className="text-xs font-medium text-slate-500 block leading-tight">
                  População
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================
              3. SEÇÃO SOBRE A CIDADE & PRINCIPAIS ATRATIVOS (2 Colunas)
          ========================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sobre a Cidade */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  Sobre a Cidade
                </span>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed text-justify">
                  {cidade.descricao}
                </p>
              </div>
            </div>

            {/* Principais Atrativos */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Principais Atrativos
              </span>

              <div className="space-y-3.5">
                {cidade.atrativos.map((atrativo, index) => (
                  <div 
                    key={atrativo.nome}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm ${
                        index === 0 ? "bg-accent" : index === 1 ? "bg-primary" : "bg-slate-600"
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 leading-tight">
                          {atrativo.nome}
                        </h4>
                        <span className="text-xs text-slate-500 font-medium">
                          {atrativo.categoria}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <div className="flex text-amber-400 text-xs">
                        {"★★★★★".slice(0, 5)}
                      </div>
                      <span className="text-xs font-bold text-slate-700 ml-1">
                        {atrativo.nota.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* #########################################################################
              📊 SEÇÃO 4: GRÁFICOS ANALÍTICOS (Recharts)
              - Gráfico 1: Visitantes Estimados por Mês (BarChart)
              - Gráfico 2: Tipos de Eventos / Distribuição (PieChart / Donut)
              - Gráfico 3: Taxa de Ocupação Hoteleira % (LineChart)
          ######################################################################### */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico 1: Visitantes Estimados por Mês (BarChart) */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide">
                  Visitantes Estimados por Mês
                </h3>
                <p className="text-xs text-slate-500">
                  Fluxo turístico anual (estimativa com base nos meios de hospedagem)
                </p>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cidade.dadosMensais} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF4E9" />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                    />
                    <Tooltip 
                      formatter={(val: number | string) => [`${Number(val).toLocaleString("pt-BR")} visitantes`, "Fluxo Estimado"]}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                    />
                    <Bar 
                      dataKey="visitantes" 
                      fill="#359830" 
                      radius={[6, 6, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 2: Tipos de Evento (Donut Chart) */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide">
                  Tipos de Evento
                </h3>
                <p className="text-xs text-slate-500">
                  Distribuição por categoria
                </p>
              </div>

              <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cidade.tiposEvento}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {cidade.tiposEvento.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: number | string) => [`${val} eventos`, "Quantidade"]}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legenda Customizada */}
                <div className="w-full sm:w-auto flex-1 space-y-2">
                  {cidade.tiposEvento.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-700 font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================
              5. TAXA DE OCUPAÇÃO & PRÓXIMOS EVENTOS (2 Colunas)
          ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico 3: Taxa de Ocupação Hoteleira (%) (LineChart) */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide">
                  Taxa de Ocupação Hoteleira (%)
                </h3>
                <p className="text-xs text-slate-500">
                  Variação anual estimada
                </p>
              </div>

              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cidade.dadosMensais} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF4E9" />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip 
                      formatter={(val: number | string) => [`${val}%`, "Taxa de Ocupação"]}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ocupacao" 
                      stroke="#359830" 
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#359830" }}
                      activeDot={{ r: 6, fill: "#287524" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Seção 4: Próximos Eventos */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide">
                  Próximos Eventos
                </h3>
                <p className="text-xs text-slate-500">
                  Calendário de eventos turísticos confirmados
                </p>
              </div>

              <div className="space-y-3">
                {cidade.eventos.map((evento) => {
                  const [dia, mes] = evento.data.split(" ");
                  return (
                    <div 
                      key={evento.titulo}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/80 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
                          <span className="text-sm font-black leading-none">{dia}</span>
                          <span className="text-[10px] font-bold uppercase leading-none mt-0.5 opacity-90">{mes}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 leading-tight">
                            {evento.titulo}
                          </h4>
                          <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-accent" />
                            {evento.local}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary whitespace-nowrap shrink-0">
                        {evento.tipo}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
