"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, MapPin, RefreshCw, AlertCircle } from "lucide-react";
import { CidadeCard } from "@/components/CidadeCard";
import { CidadeDetalhesModal } from "@/components/CidadeDetalhesModal";
import { Header } from "@/components/Header";
import { NoticiaModal } from "@/components/NoticiaModal";
import { fetchNoticias } from "@/lib/noticias-api";
import { getWebsiteApiBaseUrl } from "@/lib/website-api";
import axios, { AxiosResponse } from "axios";

async function fetchAllResults<T>(url: string): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const response: AxiosResponse<ApiPagination<T> | T[]> = await axios.get(nextUrl, { timeout: 12000 });
    if (Array.isArray(response.data)) {
      results.push(...response.data);
      break;
    }

    const page = response.data as ApiPagination<T>;
    if (!Array.isArray(page?.results)) break;
    results.push(...page.results);

    if (page.next) {
      const nextPageUrl : URL = new URL(page.next, nextUrl);
      if (nextUrl.startsWith("https://")) nextPageUrl.protocol = "https:";
      nextUrl = nextPageUrl.toString();
    } else {
      nextUrl = null;
    }
  }

  return results;
}

function CidadesContent() {
  const [cidades, setCidades] = useState<ApiCidade[] | undefined | null>(undefined);
  const [estados, setEstados] = useState<ApiEstado[]>([]);
  const [igrs, setIgrs] = useState<ApiIGR[]>([]);
  const [noticias, setNoticias] = useState<ApiNoticia[]>([]);
  const [noticiasLoading, setNoticiasLoading] = useState(true);
  const [noticiasError, setNoticiasError] = useState(false);
  const [selectedNoticia, setSelectedNoticia] = useState<ApiNoticia | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [ibgeCode, setIbgeCode] = useState("");
  const [estadoId, setEstadoId] = useState("");
  const [igrId, setIgrId] = useState("");
  const [ordering, setOrdering] = useState("name");
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const [selectedCidade, setSelectedCidade] = useState<ApiCidade | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      let apiBaseUrl: string;
      try {
        apiBaseUrl = getWebsiteApiBaseUrl();
      } catch (error) {
        console.error("Erro ao configurar a API do site:", error);
        if (isMounted) {
          setCidades(null);
          setLoading(false);
        }
        return;
      }
      let nextUrl: string | null = `${apiBaseUrl}/cidades/`;
      let allCidades: ApiCidade[] = [];
      const estadosPromise = fetchAllResults<ApiEstado>(`${apiBaseUrl}/estados/`).catch(() => []);
      const igrsPromise = fetchAllResults<ApiIGR>(`${apiBaseUrl}/igrs/`).catch(() => []);
      fetchNoticias()
        .then((data) => { if (isMounted) setNoticias(data); })
        .catch((error) => {
          console.error("Erro ao carregar notícias relacionadas às cidades:", error);
          if (isMounted) setNoticiasError(true);
        })
        .finally(() => {
          if (isMounted) setNoticiasLoading(false);
        });

      try {
        while (nextUrl) {
          const response: AxiosResponse<ApiPagination<ApiCidade> | ApiCidade[]> = await axios.get(nextUrl, { timeout: 15000 });

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
          const [allEstados, allIgrs] = await Promise.all([estadosPromise, igrsPromise]);
          setEstados(allEstados);
          setIgrs(allIgrs);
          if (allCidades.length > 0) {
            setCidades(allCidades);
          } else {
            setCidades([]);
          }
          setLoading(false);
        }
      } catch (error) {
        console.warn("Erro ao buscar cidades da API externa:", error);
        if (isMounted) {
          setCidades(null);
          setLoading(false);
        }
      }
    }

    fetchData();

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

    let result = [...cidades];
    if (searchTerm.trim()) {
      const lowerQuery = normalizeText(searchTerm.trim());
      result = result.filter(
        (c) =>
          normalizeText(c.name).includes(lowerQuery) ||
          (c.state_name && normalizeText(c.state_name).includes(lowerQuery))
      );
    }
    if (ibgeCode.trim()) {
      result = result.filter((cidade) => String(cidade.ibge_code || "") === ibgeCode.trim());
    }
    if (estadoId) {
      result = result.filter((cidade) => String(cidade.state) === estadoId);
    }
    if (igrId) {
      result = result.filter((cidade) => String(cidade.igr || "") === igrId);
    }
    result.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name, "pt-BR");
      return ordering === "-name" ? -comparison : comparison;
    });
    return result;
  }, [searchTerm, ibgeCode, estadoId, igrId, ordering, cidades]);

  const noticiasPorCidadeCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const noticia of noticias) {
      if (noticia.cidade !== null && noticia.cidade !== undefined) {
        const cityId = String(noticia.cidade);
        counts.set(cityId, (counts.get(cityId) || 0) + 1);
      }
    }
    return counts;
  }, [noticias]);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
          <div className="grid w-full flex-1 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              aria-label="Buscar cidade pelo nome"
              placeholder="Buscar cidade pelo nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830] transition-all shadow-inner"
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
          <input
            type="text"
            inputMode="numeric"
            maxLength={7}
            aria-label="Código IBGE"
            placeholder="Código IBGE"
            value={ibgeCode}
            onChange={(e) => setIbgeCode(e.target.value.replace(/\D/g, ""))}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830]"
          />
          <select
            aria-label="Filtrar por estado"
            value={estadoId}
            onChange={(e) => setEstadoId(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830]"
          >
            <option value="">Todos os estados</option>
            {estados.map((estado) => <option key={estado.id} value={estado.id}>{estado.name}</option>)}
          </select>
          <select
            aria-label="Filtrar por IGR"
            value={igrId}
            onChange={(e) => setIgrId(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830]"
          >
            <option value="">Todas as IGRs</option>
            {igrs.map((igr) => <option key={igr.id} value={igr.id}>{igr.name}</option>)}
          </select>
          <select
            aria-label="Ordenar municípios"
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#359830]/30 focus:border-[#359830]"
          >
            <option value="name">Nome: A-Z</option>
            <option value="-name">Nome: Z-A</option>
          </select>
          </div>

          <div className="flex items-center gap-3 w-full xl:w-auto justify-between xl:justify-end">
            {filteredCidades && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {filteredCidades.length} {filteredCidades.length === 1 ? "município" : "municípios"}
              </span>
            )}
          </div>
        </div>
      </div>

      
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10 flex-1 space-y-12">
        {/* ========================================================================= */}
        {/* SEÇÃO: MUNICÍPIOS & INDICADORES */}
        {/* ========================================================================= */}
        <div>
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
                  noticiasCount={noticiasPorCidadeCount.get(String(cidade.id)) || 0}
                  onSelect={handleSelectCidade}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal de Detalhes da Cidade */}
      {selectedCidade && (
        <CidadeDetalhesModal
          cidade={selectedCidade}
          allNoticias={noticias}
          noticiasLoading={noticiasLoading}
          noticiasError={noticiasError}
          onSelectNoticia={setSelectedNoticia}
          onClose={handleCloseModal}
        />
      )}
      <NoticiaModal
        noticia={selectedNoticia}
        onClose={() => setSelectedNoticia(null)}
      />
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
