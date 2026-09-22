"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, MapPin } from "lucide-react";
import { CidadeCard } from "@/components/CidadeCard";
import { CidadeDetalhesModal } from "@/components/CidadeDetalhesModal";
import { Header } from "@/components/Header";
import axios from "axios";

function CidadesContent() {

  const [cidades, setCidades] = useState<ApiCidade[] | undefined | null>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const searchParams = useSearchParams();
  const [selectedCidade, setSelectedCidade] = useState<ApiCidade | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchAllCidades() {
      const url = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_CIDADES_API_BASE_URL;
      if (!url) {
        console.error("API_URL não definida no .env");
        if (isMounted) setCidades(null);
        return;
      }
      const cleanUrl = url.trim().replace(/\/$/, "");
      let nextUrl: string | null = cleanUrl.endsWith("/cidades") ? `${cleanUrl}/` : `${cleanUrl}/cidades/`;
      let allCidades: ApiCidade[] = [];

      try {
        while (nextUrl) {
          const response = await axios.get<ApiPagination<ApiCidade> | ApiCidade[]>(nextUrl);
          if (Array.isArray(response.data)) {
            allCidades = [...allCidades, ...response.data];
            break;
          } else if (response.data && Array.isArray(response.data.results)) {
            allCidades = [...allCidades, ...response.data.results];
            nextUrl = response.data.next;
          } else {
            break;
          }
        }
        if (isMounted) {
          setCidades(allCidades);
        }
      } catch (error) {
        console.error("Erro ao buscar cidades:", error);
        if (isMounted) {
          setCidades(null);
        }
      }
    }

    fetchAllCidades();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCidades = useMemo(() => {
    if (cidades == undefined) return undefined;
    if (cidades == null) return null;

    const normalizeText = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    let result = [...cidades].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    if (searchTerm.trim()) {
      const lowerQuery = normalizeText(searchTerm.trim());
      result = result.filter((c) => normalizeText(c.name).includes(lowerQuery));
    }
    return result;
  }, [searchTerm, cidades]);

  const handleSelectCidade = (cidade: ApiCidade) => {
    setSelectedCidade(cidade);
    const newUrl = `/cidades?cidade=${encodeURIComponent(cidade.slug)}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  useEffect(() => {
    const cidadeParam = searchParams.get("cidade");
    if (cidadeParam && cidades) {
      const match = cidades.find((c) => c.slug === cidadeParam || c.name.toLowerCase() === cidadeParam.toLowerCase());
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
    <main className="min-h-screen bg-background flex flex-col pb-20">

      <Header />

      <div className="bg-site-surface border-b border-slate-200 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            {
              searchTerm &&
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                title="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            }
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Municípios
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Clique em uma cidade para visualizar o perfil turístico detalhado e seus indicadores socioeconômicos.
            </p>
          </div>
        </div>

        {
          filteredCidades === undefined ?
            <div className="flex items-center justify-center py-20">
              <span className="text-sm text-slate-500">Carregando cidades...</span>
            </div>
            : filteredCidades === null ?
              <div className="bg-site-surface rounded-2xl border border-slate-200 p-12 text-center my-8">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Erro ao carregar cidades</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                  Ocorreu um erro ao buscar a lista de cidades. Por favor, tente novamente mais tarde.
                </p>
              </div>
              : filteredCidades.length == 0 ?
                <div className="bg-site-surface rounded-2xl border border-slate-200 p-12 text-center my-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhuma cidade encontrada</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                    Não encontramos resultados para &quot;{searchTerm}&quot;. Verifique a ortografia ou cadastre uma nova cidade.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => setSearchTerm("")}
                      className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Ver todas as cidades
                    </button>
                  </div>
                </div>
                :
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {
                    filteredCidades.map((cidade) => (
                      <CidadeCard
                        key={cidade.id}
                        cidade={cidade}
                        onSelect={handleSelectCidade}
                      />
                    ))
                  }
                </div>

        }
      </section>

      {
        selectedCidade &&
        <CidadeDetalhesModal
          cidade={selectedCidade}
          onClose={handleCloseModal}
        />
      }

    </main>
  );
}

export default function CidadesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <CidadesContent />
    </Suspense>
  );
}
