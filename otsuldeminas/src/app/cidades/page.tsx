"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, MapPin, Plus } from "lucide-react";
import { CidadeCard } from "@/components/CidadeCard";
import { CidadeDetalhesModal } from "@/components/CidadeDetalhesModal";

const STORAGE_KEY = "observatorio_custom_cidades";
import { fetchCidades } from "@/lib/cidades-api";
import { Header } from "@/components/Header";
import axios from "axios";

function CidadesContent() {

  const [cidades, setCidades] = useState<ApiCidade[] | undefined | null>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const searchParams = useSearchParams();
  const [selectedCidade, setSelectedCidade] = useState<ApiCidade | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  useEffect(() => {
    let url = process.env.NEXT_PUBLIC_API_URL
    if(url == undefined){
      console.error("API_URL não definida no .env");
      return
    }
    axios.get<ApiPagination<ApiCidade>>(url+"/cidades")
      .then((response) => setCidades(response.data.results))
      .catch((error) => {
        console.error("Erro ao buscar cidades:", error);
        setCidades(null);
      })
  }, [])

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

  // useEffect(() => {
  //   try {
  //     const saved = localStorage.getItem(STORAGE_KEY);
  //     if (saved) {
  //       const parsed: ApiCidade[] = JSON.parse(saved);
  //       if (Array.isArray(parsed) && parsed.length > 0) {
  //         const parsedMap = new Map(parsed.map(c => [c.id, c]));
  //         const baseAtualizadas = CIDADES.map(c => parsedMap.get(c.id) || c);
  //         const baseIds = new Set(CIDADES.map(c => c.id));
  //         const novas = parsed.filter(c => !baseIds.has(c.id));
  //         setCidadesList([...novas, ...baseAtualizadas]);
  //       }
  //     }
  //   } catch (e) {
  //     console.error("Erro ao carregar cidades customizadas:", e);
  //   }
  // }, []);

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

  // const handleOpenAddModal = () => {
  //   setCidadeParaEditar(null);
  //   setIsFormModalOpen(true);
  // };

  // const handleOpenEditModal = (cidade: ApiCidade) => {
  //   setCidadeParaEditar(cidade);
  //   setIsFormModalOpen(true);
  // };

  // const handleSaveCidade = (cidadeSalva: ApiCidade) => {
  //   const isExisting = cidadesList.some(c => c.id === cidadeSalva.id);
  //   let atualizadas: ApiCidade[];

  //   if (isExisting) {
  //     atualizadas = cidadesList.map(c => c.id === cidadeSalva.id ? cidadeSalva : c);
  //   } else {
  //     atualizadas = [cidadeSalva, ...cidadesList];
  //   }

  //   setCidadesList(atualizadas);

  //   try {
  //     const customOuModificadas = atualizadas.filter(c => {
  //       const base = CIDADES.find(b => b.id === c.id);
  //       if (!base) return true;
  //       return JSON.stringify(base) !== JSON.stringify(c);
  //     });
  //     localStorage.setItem(STORAGE_KEY, JSON.stringify(customOuModificadas));
  //   } catch (e) {
  //     console.error("Erro ao salvar no localStorage:", e);
  //   }

  //   // Se estiver selecionada (no modal de detalhes), atualiza os dados
  //   if (selectedCidade && selectedCidade.id === cidadeSalva.id) {
  //     setSelectedCidade(cidadeSalva);
  //   } else if (!isExisting) {
  //     // Seleciona e abre a nova cidade imediatamente
  //     handleSelectCidade(cidadeSalva);
  //   }
  // };


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
