"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, MapPin, Plus } from "lucide-react";
import { CIDADES, type Cidade } from "@/data/cidades";
import { CidadeCard } from "@/components/CidadeCard";
import { CidadeDetalhesModal } from "@/components/CidadeDetalhesModal";
import { AdicionarCidadeModal } from "@/components/AdicionarCidadeModal";

const STORAGE_KEY = "observatorio_custom_cidades";
import { fetchCidades } from "@/lib/cidades-api";

function CidadesContent() {
  const searchParams = useSearchParams();
  const [cidades, setCidades] = useState<Cidade[]>(CIDADES);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCidade, setSelectedCidade] = useState<Cidade | null>(null);
  const [cidadeParaEditar, setCidadeParaEditar] = useState<Cidade | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [cidadesList, setCidadesList] = useState<Cidade[]>(CIDADES);

  // Carregar cidades salvas no localStorage (novas cidades e cidades base editadas)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Cidade[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const parsedMap = new Map(parsed.map(c => [c.id, c]));
          const baseAtualizadas = CIDADES.map(c => parsedMap.get(c.id) || c);
          const baseIds = new Set(CIDADES.map(c => c.id));
          const novas = parsed.filter(c => !baseIds.has(c.id));
          setCidadesList([...novas, ...baseAtualizadas]);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar cidades customizadas:", e);
    }
  }, []);

  useEffect(() => {
    fetchCidades()
      .then((loadedCidades) => {
        setCidades(loadedCidades);
      });
  }, []);

  useEffect(() => {
    const cidadeParam = searchParams.get("cidade");
    if (cidadeParam) {
      const match = cidadesList.find(
        (c) => c.slug === cidadeParam || c.nome.toLowerCase() === cidadeParam.toLowerCase()
      );
      if (match) {
        setSelectedCidade(match);
      }
    }
  }, [searchParams, cidadesList]);

  const handleSelectCidade = (cidade: Cidade) => {
    setSelectedCidade(cidade);
    const newUrl = `/cidades?cidade=${encodeURIComponent(cidade.slug)}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  const handleCloseModal = () => {
    setSelectedCidade(null);
    window.history.pushState({ path: "/cidades" }, "", "/cidades");
  };

  const handleOpenAddModal = () => {
    setCidadeParaEditar(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (cidade: Cidade) => {
    setCidadeParaEditar(cidade);
    setIsFormModalOpen(true);
  };

  const handleSaveCidade = (cidadeSalva: Cidade) => {
    const isExisting = cidadesList.some(c => c.id === cidadeSalva.id);
    let atualizadas: Cidade[];

    if (isExisting) {
      atualizadas = cidadesList.map(c => c.id === cidadeSalva.id ? cidadeSalva : c);
    } else {
      atualizadas = [cidadeSalva, ...cidadesList];
    }

    setCidadesList(atualizadas);

    try {
      const customOuModificadas = atualizadas.filter(c => {
        const base = CIDADES.find(b => b.id === c.id);
        if (!base) return true;
        return JSON.stringify(base) !== JSON.stringify(c);
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customOuModificadas));
    } catch (e) {
      console.error("Erro ao salvar no localStorage:", e);
    }

    // Se estiver selecionada (no modal de detalhes), atualiza os dados
    if (selectedCidade && selectedCidade.id === cidadeSalva.id) {
      setSelectedCidade(cidadeSalva);
    } else if (!isExisting) {
      // Seleciona e abre a nova cidade imediatamente
      handleSelectCidade(cidadeSalva);
    }
  };

  // Normalização para busca sem acentos e ordenação alfabética
  const filteredCidades = useMemo(() => {
    const normalizeText = (text: string) =>
      text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    // Ordenação alfabética (A-Z)
    let result = [...cidadesList].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    if (searchTerm.trim()) {
      const lowerQuery = normalizeText(searchTerm.trim());
      result = result.filter((c) => normalizeText(c.nome).includes(lowerQuery));
    }

    return result;
  }, [searchTerm, cidadesList]);

  return (
    <main className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header / Hero com Background Límpido e Iluminado */}
      <header className="relative bg-slate-900 shadow-xl print:bg-white print:shadow-none print:border-b print:border-slate-200">
        <div className="absolute inset-0 overflow-hidden print:hidden">
          <img
            src="/images/cidades-hero.jpg"
            alt="Pontos turísticos e paisagens do Sul de Minas Gerais"
            className="w-full h-full object-cover object-[center_40%] opacity-85 brightness-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-900/45 to-slate-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
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

      {/* Barra de Busca e Filtros */}
      <div className="bg-site-surface border-b border-slate-200 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Campo de Busca */}
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

          {/* Botão Adicionar Cidade e Tag / Contador */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-secondary text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Cidade</span>
            </button>

            <span className="text-xs text-slate-500 font-medium whitespace-nowrap bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              {filteredCidades.length} {filteredCidades.length === 1 ? "cidade" : "cidades"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Principal de Cidades */}
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

          <button
            onClick={handleOpenAddModal}
            className="sm:hidden inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-secondary text-white text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Nova Cidade</span>
          </button>
        </div>

        {filteredCidades.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCidades.map((cidade) => (
              <CidadeCard
                key={cidade.id}
                cidade={cidade}
                onSelect={handleSelectCidade}
                onEdit={handleOpenEditModal}
              />
            ))}
          </div>
        ) : (
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
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-secondary transition-colors shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Cadastrar {searchTerm ? `"${searchTerm}"` : "nova cidade"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Modal / Painel de Detalhes da Cidade */}
      <CidadeDetalhesModal
        cidade={selectedCidade}
        onClose={handleCloseModal}
        onEdit={handleOpenEditModal}
      />

      {/* Modal para Adicionar/Editar Cidade */}
      <AdicionarCidadeModal
        isOpen={isFormModalOpen}
        cidadeParaEditar={cidadeParaEditar}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveCidade}
      />
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
