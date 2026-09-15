"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Plus, 
  Trash2, 
  MapPin, 
  Sparkles, 
  Calendar, 
  Info, 
  Image as ImageIcon,
  Check,
  Pencil,
  Building2,
  UtensilsCrossed,
  Users
} from "lucide-react";
import type { Cidade, CidadeAtrativo, CidadeEvento } from "@/data/cidades";
import { gerarSlug } from "@/data/cidades";

interface AdicionarCidadeModalProps {
  isOpen: boolean;
  cidadeParaEditar?: Cidade | null;
  onClose: () => void;
  onSave: (cidade: Cidade) => void;
}

export function AdicionarCidadeModal({ 
  isOpen, 
  cidadeParaEditar, 
  onClose, 
  onSave 
}: AdicionarCidadeModalProps) {
  const isEditing = Boolean(cidadeParaEditar);

  const [nome, setNome] = useState("");
  const [imagem, setImagem] = useState("");
  const [tags, setTags] = useState("");
  const [descricao, setDescricao] = useState("");
  const [populacao, setPopulacao] = useState("");
  const [hospedagens, setHospedagens] = useState<number | string>("");
  const [restaurantes, setRestaurantes] = useState<number | string>("");

  const [atrativos, setAtrativos] = useState<CidadeAtrativo[]>([
    { nome: "", categoria: "Natureza", nota: 4.8 }
  ]);

  const [eventos, setEventos] = useState<CidadeEvento[]>([
    { data: "", titulo: "", local: "", tipo: "Cultural" }
  ]);

  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  // Preencher formulário ao abrir para edição ou resetar ao adicionar nova cidade
  useEffect(() => {
    if (!isOpen) return;

    if (cidadeParaEditar) {
      setNome(cidadeParaEditar.nome || "");
      setImagem(cidadeParaEditar.imagem || "");
      setTags(Array.isArray(cidadeParaEditar.tags) ? cidadeParaEditar.tags.join(", ") : "");
      setDescricao(cidadeParaEditar.descricao || "");
      setPopulacao(cidadeParaEditar.populacao || "");
      setHospedagens(cidadeParaEditar.hospedagens ?? "");
      setRestaurantes(cidadeParaEditar.restaurantes ?? "");
      
      setAtrativos(
        cidadeParaEditar.atrativos && cidadeParaEditar.atrativos.length > 0
          ? cidadeParaEditar.atrativos.map(a => ({ ...a }))
          : [{ nome: "", categoria: "Natureza", nota: 4.8 }]
      );
      
      setEventos(
        cidadeParaEditar.eventos && cidadeParaEditar.eventos.length > 0
          ? cidadeParaEditar.eventos.map(e => ({ ...e }))
          : [{ data: "", titulo: "", local: "", tipo: "Cultural" }]
      );
    } else {
      setNome("");
      setImagem("");
      setTags("");
      setDescricao("");
      setPopulacao("");
      setHospedagens("");
      setRestaurantes("");
      setAtrativos([{ nome: "", categoria: "Natureza", nota: 4.8 }]);
      setEventos([{ data: "", titulo: "", local: "", tipo: "Cultural" }]);
    }
    setErroValidacao(null);
  }, [isOpen, cidadeParaEditar]);

  if (!isOpen) return null;

  // Handlers para Atrativos
  const handleAddAtrativo = () => {
    setAtrativos([
      ...atrativos,
      { nome: "", categoria: "Ecoturismo", nota: 4.7 }
    ]);
  };

  const handleUpdateAtrativo = (index: number, campo: keyof CidadeAtrativo, valor: string | number) => {
    const novos = [...atrativos];
    novos[index] = { ...novos[index], [campo]: valor };
    setAtrativos(novos);
  };

  const handleRemoveAtrativo = (index: number) => {
    if (atrativos.length === 1) {
      setAtrativos([{ nome: "", categoria: "Natureza", nota: 4.8 }]);
      return;
    }
    setAtrativos(atrativos.filter((_, i) => i !== index));
  };

  // Handlers para Eventos
  const handleAddEvento = () => {
    setEventos([
      ...eventos,
      { data: "", titulo: "", local: "", tipo: "Festival" }
    ]);
  };

  const handleUpdateEvento = (index: number, campo: keyof CidadeEvento, valor: string) => {
    const novos = [...eventos];
    novos[index] = { ...novos[index], [campo]: valor };
    setEventos(novos);
  };

  const handleRemoveEvento = (index: number) => {
    if (eventos.length === 1) {
      setEventos([{ data: "", titulo: "", local: "", tipo: "Cultural" }]);
      return;
    }
    setEventos(eventos.filter((_, i) => i !== index));
  };

  // Submissão do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      setErroValidacao("Por favor, preencha o nome da cidade.");
      return;
    }

    if (!descricao.trim()) {
      setErroValidacao("Por favor, preencha a seção 'Sobre a Cidade'.");
      return;
    }

    const slug = isEditing && cidadeParaEditar?.slug ? cidadeParaEditar.slug : gerarSlug(nome.trim());
    const id = isEditing && cidadeParaEditar?.id ? cidadeParaEditar.id : slug;

    const tagsArray = tags.trim()
      ? tags.split(",").map(t => t.trim()).filter(Boolean)
      : ["Turismo Regional", "Sul de Minas"];

    // Filtrar atrativos válidos
    const atrativosValidos = atrativos
      .filter(a => a.nome.trim().length > 0)
      .map(a => ({
        ...a,
        nota: Number(a.nota) || 4.5
      }));

    if (atrativosValidos.length === 0) {
      atrativosValidos.push({
        nome: `Centro Histórico e Matriz de ${nome.trim()}`,
        categoria: "Histórico",
        nota: 4.8
      });
    }

    // Filtrar eventos válidos
    const eventosValidos = eventos
      .filter(ev => ev.titulo.trim().length > 0)
      .map(ev => ({
        ...ev,
        data: ev.data.trim() || "15 out",
        local: ev.local.trim() || "Praça Central",
        tipo: ev.tipo.trim() || "Cultural"
      }));

    if (eventosValidos.length === 0) {
      eventosValidos.push({
        data: "12 out",
        titulo: `Festa Tradicional de ${nome.trim()}`,
        local: "Praça da Matriz",
        tipo: "Festa Típica"
      });
    }

    const cidadeFinal: Cidade = {
      id,
      nome: nome.trim(),
      slug,
      imagem: imagem.trim() || cidadeParaEditar?.imagem || `/images/cidades/${slug}.jpg`,
      tags: tagsArray,
      descricao: descricao.trim(),
      populacao: populacao.trim() || cidadeParaEditar?.populacao || "A carregar do IBGE...",
      hospedagens: hospedagens !== "" ? Number(hospedagens) : (cidadeParaEditar?.hospedagens ?? 0),
      restaurantes: restaurantes !== "" ? Number(restaurantes) : (cidadeParaEditar?.restaurantes ?? 0),
      leitos: cidadeParaEditar?.leitos,
      pib: cidadeParaEditar?.pib,
      atrativos: atrativosValidos,
      eventos: eventosValidos,
      destaque: cidadeParaEditar?.destaque ?? true,
      dadosMensais: cidadeParaEditar?.dadosMensais ?? [
        { mes: "Jan", visitantes: 2200, ocupacao: 70 },
        { mes: "Fev", visitantes: 2000, ocupacao: 65 },
        { mes: "Mar", visitantes: 1900, ocupacao: 62 },
        { mes: "Abr", visitantes: 2400, ocupacao: 72 },
        { mes: "Mai", visitantes: 2700, ocupacao: 76 },
        { mes: "Jun", visitantes: 3100, ocupacao: 82 },
        { mes: "Jul", visitantes: 3800, ocupacao: 88 },
        { mes: "Ago", visitantes: 2900, ocupacao: 77 },
        { mes: "Set", visitantes: 2600, ocupacao: 74 },
        { mes: "Out", visitantes: 2800, ocupacao: 76 },
        { mes: "Nov", visitantes: 2300, ocupacao: 68 },
        { mes: "Dez", visitantes: 3000, ocupacao: 80 }
      ],
      tiposEvento: cidadeParaEditar?.tiposEvento ?? [
        { name: "Cultural", value: 10, color: "#359830" },
        { name: "Gastronômico", value: 8, color: "#5BAF56" },
        { name: "Ecoturismo", value: 6, color: "#C90C0F" },
        { name: "Corporativo", value: 4, color: "#F4A261" }
      ]
    };

    onSave(cidadeFinal);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-site-surface rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
              {isEditing ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {isEditing ? `Editar ${cidadeParaEditar?.nome || "Cidade"}` : "Adicionar Nova Cidade"}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing 
                  ? "Atualize as informações descritivas, atrativos turísticos e eventos do município"
                  : "Preencha as informações descritivas, atrativos turísticos e eventos"
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8 flex-1 bg-slate-50/50">
          
          {erroValidacao && (
            <div className="p-3.5 bg-accent/10 border border-accent/20 rounded-xl text-accent text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0" />
              <span>{erroValidacao}</span>
            </div>
          )}

          {/* 1. Informações Básicas */}
          <div className="bg-site-surface p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Informações do Município
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Nome da Cidade *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pouso Alegre, Itajubá..."
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value);
                    if (erroValidacao) setErroValidacao(null);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Tags / Vocação (separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Gastronomia, Ecoturismo, História"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  URL da Imagem de Capa (opcional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: /images/cidades/suacidade.jpg ou https://..."
                    value={imagem}
                    onChange={(e) => setImagem(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Campos Opcionais de Estatísticas */}
            <div className="pt-2 border-t border-slate-100">
              <span className="block text-xs font-semibold text-slate-500 mb-3">
                Dados Adicionais do Município (opcional)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    População Estimada
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 140.000 hab."
                    value={populacao}
                    onChange={(e) => setPopulacao(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    Hospedagens (Hotéis/Pousadas)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 35"
                    value={hospedagens}
                    onChange={(e) => setHospedagens(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1.5">
                    <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />
                    Restaurantes & Bares
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 180"
                    value={restaurantes}
                    onChange={(e) => setRestaurantes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Seção Sobre a Cidade */}
          <div className="bg-site-surface p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <Info className="h-4 w-4" />
              Sobre a Cidade *
            </h3>
            <p className="text-xs text-slate-500">
              Descreva a vocação turística, história, principais características e atrativos do município.
            </p>
            <textarea
              required
              rows={4}
              placeholder="Ex: Pouso Alegre é um dos principais pólos econômicos e turísticos do Sul de Minas, unindo rica tradição cultural, gastronomia autêntica e forte infraestrutura para receber visitantes..."
              value={descricao}
              onChange={(e) => {
                setDescricao(e.target.value);
                if (erroValidacao) setErroValidacao(null);
              }}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-y"
            />
          </div>

          {/* 3. Seção Principais Atrativos */}
          <div className="bg-site-surface p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Principais Atrativos
              </h3>
              <button
                type="button"
                onClick={handleAddAtrativo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg border border-primary/20 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Atrativo
              </button>
            </div>

            <div className="space-y-3">
              {atrativos.map((atrativo, index) => (
                <div key={index} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-black flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>

                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Nome do Atrativo (ex: Parque das Águas)"
                      value={atrativo.nome}
                      onChange={(e) => handleUpdateAtrativo(index, "nome", e.target.value)}
                      className="px-3 py-1.5 bg-site-surface border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Categoria (ex: Ecoturismo, Museu)"
                      value={atrativo.categoria}
                      onChange={(e) => handleUpdateAtrativo(index, "categoria", e.target.value)}
                      className="px-3 py-1.5 bg-site-surface border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 whitespace-nowrap">Nota:</span>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        placeholder="Nota (1-5)"
                        value={atrativo.nota}
                        onChange={(e) => handleUpdateAtrativo(index, "nota", parseFloat(e.target.value))}
                        className="w-20 px-2 py-1.5 bg-site-surface border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveAtrativo(index)}
                    className="p-1.5 text-slate-400 hover:text-accent rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                    title="Remover atrativo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Seção Próximos Eventos */}
          <div className="bg-site-surface p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Próximos Eventos
              </h3>
              <button
                type="button"
                onClick={handleAddEvento}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg border border-primary/20 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Evento
              </button>
            </div>

            <div className="space-y-3">
              {eventos.map((evento, index) => (
                <div key={index} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Data (ex: 15 out)"
                      value={evento.data}
                      onChange={(e) => handleUpdateEvento(index, "data", e.target.value)}
                      className="px-3 py-1.5 bg-site-surface border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Título do Evento"
                      value={evento.titulo}
                      onChange={(e) => handleUpdateEvento(index, "titulo", e.target.value)}
                      className="px-3 py-1.5 bg-site-surface border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Local (ex: Praça Central)"
                      value={evento.local}
                      onChange={(e) => handleUpdateEvento(index, "local", e.target.value)}
                      className="px-3 py-1.5 bg-site-surface border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Tipo (ex: Festival, Cultural)"
                      value={evento.tipo}
                      onChange={(e) => handleUpdateEvento(index, "tipo", e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveEvento(index)}
                    className="p-1.5 text-slate-400 hover:text-accent rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                    title="Remover evento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé / Ações */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-sm font-bold shadow-md shadow-primary/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isEditing ? <Check className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              {isEditing ? "Salvar Alterações" : "Salvar Cidade"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
