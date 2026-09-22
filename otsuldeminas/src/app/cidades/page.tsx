"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, MapPin, RefreshCw, AlertCircle } from "lucide-react";
import { CidadeCard } from "@/components/CidadeCard";
import { CidadeDetalhesModal } from "@/components/CidadeDetalhesModal";
import { Header } from "@/components/Header";
import { gerarCidadesFallback } from "@/data/cidadesFallback";
import axios, { AxiosResponse } from "axios";

function CidadesContent() {
  const [cidades, setCidades] = useState<ApiCidade[] | undefined | null>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const [selectedCidade, setSelectedCidade] = useState<ApiCidade | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchAllCidades() {
      setLoading(true);
      const url = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_CIDADES_API_BASE_URL;

      if (!url) {
        // Fallback automático para os 148 municípios do Sul de Minas com indicadores
        if (isMounted) {
          setCidades(gerarCidadesFallback());
          setIsUsingFallback(true);
          setLoading(false);
        }
        return;
      }

      const cleanUrl = url.trim().replace(/\/$/, "");
      let nextUrl: string | null = cleanUrl.endsWith("/cidades") ? `${cleanUrl}/` : `${cleanUrl}/cidades/`;
      let allCidades: ApiCidade[] = [];

      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout na requisição")), 6000)
        );

        while (nextUrl) {
          const fetchPromise = axios.get<ApiPagination<ApiCidade> | ApiCidade[]>(nextUrl);
          const response = (await Promise.race([fetchPromise, timeoutPromise])) as AxiosResponse<
            ApiPagination<ApiCidade> | ApiCidade[]
          >;

          if (Array.isArray(response.data)) {
            allCidades = [...allCidades, ...response.data];
            break;
          } else if (response.data && Array.isArray((response.data as ApiPagination<ApiCidade>).results)) {
            const pageData = response.data as ApiPagination<ApiCidade>;
            allCidades = [...allCidades, ...pageData.results];
            if (pageData.next) {
              const nextPageUrl: URL = new URL(pageData.next, nextUrl);
              if (nextUrl.startsWith("https://")) {
                nextPageUrl.protocol = "https:";
              }
              nextUrl = nextPageUrl.toString();
            } else {
              nextUrl = null;
            }
          } else {
            break;
          }
        }

        if (isMounted) {
          if (allCidades.length > 0) {
            setCidades(allCidades);
            setIsUsingFallback(false);
          } else {
            // Se a API retornou array vazio, usa a base regional
            setCidades(gerarCidadesFallback());
            setIsUsingFallback(true);
          }
          setLoading(false);
        }
      } catch (error) {
        console.warn("Erro ao buscar cidades da API externa. Utilizando catálogo regional de fallback:", error);
        if (isMounted) {
          setCidades(gerarCidadesFallback());
          setIsUsingFallback(true);
          setLoading(false);
        }
      }
    }

    fetchAllCidades();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCidades = useMemo(() => {
    if (cidades === undefined) return undefined;
    if (cidades === null) return null;

    const normalizeText = (text: string) =>
      text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    let result = [...cidades].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    if (searchTerm.trim()) {
      const lowerQuery = normalizeText(searchTerm.trim());
      result = result.filter(
        (c) =>
          normalizeText(c.name).includes(lowerQuery) ||
          (c.state_name && normalizeText(c.state_name).includes(lowerQuery))
      );
    }
    return result;
  }, [searchTerm, cidades]);

  const handleSelectCidade = (cidade: ApiCidade) => {
    setSelectedCidade(cidade);
    const newUrl = `/cidades?cidade=${encodeURIComponent(cidade.slug || cidade.name)}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  useEffect(() => {
    const cidadeParam = searchParams.get("cidade");
    if (cidadeParam && cidades && cidades.length > 0) {
      const match = cidades.find(
        (c) =>
          (c.slug && c.slug.toLowerCase() === cidadeParam.toLowerCase()) ||
          c.name.toLowerCase() === cidadeParam.toLowerCase()
      );
      if (match) {
        setSelectedCidade(match);
      }
    }
  }, [searchParams, cidades]);

  const handleCloseModal = () => {
    setSelectedCidade(null);
    window.history.pushState({ path: "/cidades" }, "", "/cidades");
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Header />

      {/* Barra de Busca e Filtro */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar cidade pelo nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                title="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {filteredCidades && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {filteredCidades.length} {filteredCidades.length === 1 ? "município" : "municípios"}
              </span>
            )}
            {isUsingFallback && (
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Catálogo Regional Ativo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal de Cidades */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <MapPin className="h-3.5 w-3.5" />
              Observatório Sul de Minas
            </div>
            <h1 className="text-3xl font-extrabold text-[#1D5C1B] tracking-tight">
              Municípios & Indicadores
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Consulte dados socioeconômicos, demográficos e turísticos de cada município: PIB, IDH, População, MUNIC Cultura, Estatísticas PNAD, Área, Densidade, Escolarização e capacidade de Serviços.
            </p>
          </div>
        </div>

        {loading || filteredCidades === undefined ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            <span className="text-sm font-semibold text-slate-600">Carregando dados dos municípios...</span>
          </div>
        ) : filteredCidades === null ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-8 shadow-sm">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-500">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Erro ao carregar cidades</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              Não foi possível obter a lista de cidades no momento.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md"
            >
              Tentar novamente
            </button>
          </div>
        ) : filteredCidades.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-8 shadow-sm">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
              <MapPin className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhum município encontrado</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              Não encontramos resultados correspondentes a &quot;{searchTerm}&quot;.
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Ver todos os municípios
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCidades.map((cidade) => (
              <CidadeCard
                key={cidade.id || cidade.slug || cidade.name}
                cidade={cidade}
                onSelect={handleSelectCidade}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modal de Detalhes da Cidade */}
      {selectedCidade && (
        <CidadeDetalhesModal
          cidade={selectedCidade}
          onClose={handleCloseModal}
        />
      )}
    </main>
  );
}

export default function CidadesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <CidadesContent />
    </Suspense>
  );
}
