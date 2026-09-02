"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, MapPin, Sparkles } from "lucide-react";
import { CIDADES, type Cidade } from "@/data/cidades";
import { CidadeCard } from "@/components/CidadeCard";
import { CidadeDetalhesModal } from "@/components/CidadeDetalhesModal";

function CidadesContent() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCidade, setSelectedCidade] = useState<Cidade | null>(null);

  // Sincronização com query param da URL (?cidade=slug)
  useEffect(() => {
    const cidadeParam = searchParams.get("cidade");
    if (cidadeParam) {
      const match = CIDADES.find(
        (c) => c.slug === cidadeParam || c.nome.toLowerCase() === cidadeParam.toLowerCase()
      );
      if (match) {
        setSelectedCidade(match);
      }
    }
  }, [searchParams]);

  const handleSelectCidade = (cidade: Cidade) => {
    setSelectedCidade(cidade);
    // Atualiza a URL sem recarregar a página para permitir compartilhamento direto
    const newUrl = `/cidades?cidade=${encodeURIComponent(cidade.slug)}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  const handleCloseModal = () => {
    setSelectedCidade(null);
    window.history.pushState({ path: "/cidades" }, "", "/cidades");
  };

  // Normalização para busca sem acentos e case-insensitive
  const filteredCidades = useMemo(() => {
    const normalizeText = (text: string) =>
      text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    let result = CIDADES;

    if (searchTerm.trim()) {
      const lowerQuery = normalizeText(searchTerm.trim());
      result = result.filter((c) => normalizeText(c.nome).includes(lowerQuery));
    }

    return result;
  }, [searchTerm]);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      {/* Header / Hero com Background*/}
      <header className="relative bg-slate-900 shadow-xl print:bg-white print:shadow-none print:border-b print:border-slate-200">
        <div className="absolute inset-0 overflow-hidden print:hidden">
          <img
            src="/images/hero-bg.png"
            alt="Pontos turísticos do Sul de Minas Gerais"
            className="w-full h-full object-cover object-[center_25%] opacity-70"
          />
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

      {/* Barra de Busca e Filtros */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Campo de Busca */}
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar cidade em destaque..."
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

          {/* Tag e Contador */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Cidades em Destaque</span>
            </div>

            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
              {filteredCidades.length} {filteredCidades.length === 1 ? "cidade" : "cidades"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Principal de Cidades */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-slate-200/80 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Cidades em Destaque
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Clique em uma cidade para visualizar o perfil turístico detalhado, atrativos e estatísticas.
            </p>
          </div>
        </div>

        {filteredCidades.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCidades.map((cidade) => (
              <CidadeCard
                key={cidade.id}
                cidade={cidade}
                onSelect={handleSelectCidade}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center my-8">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhuma cidade encontrada</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              Não encontramos resultados para &quot;{searchTerm}&quot;. Verifique a ortografia ou limpe o filtro de busca.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
              }}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-secondary transition-colors shadow-sm"
            >
              Ver todas as cidades em destaque
            </button>
          </div>
        )}
      </section>

      {/* Modal / Painel de Detalhes da Cidade */}
      <CidadeDetalhesModal
        cidade={selectedCidade}
        onClose={handleCloseModal}
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
