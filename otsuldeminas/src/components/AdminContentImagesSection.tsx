"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CalendarDays,
  CirclePlus,
  Compass,
  Image as ImageIcon,
  LoaderCircle,
  Newspaper,
  Pencil,
  Save,
  Search,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { ManagerImageManager } from "@/components/ManagerImageManager";
import { ManagerRichTextEditor } from "@/components/ManagerRichTextEditor";
import { PaginationControls } from "@/components/PaginationControls";
import {
  AdminCidadeRecord,
  AdminIGRRecord,
  deleteAdminEvento,
  deleteAdminLocal,
  deleteAdminNoticia,
  deleteAdminPonto,
  getAdminEventos,
  getAdminLocais,
  getAdminNoticias,
  getAdminPontos,
  ManagerEvento,
  ManagerLocalGeo,
  ManagerNews,
  ManagerPontoTuristico,
  saveAdminEvento,
  saveAdminLocal,
  saveAdminNoticia,
  saveAdminPonto,
} from "@/lib/manager-api";
import { slugify } from "@/lib/utils";

const PAGE_SIZE = 20;

const LOCAL_CATEGORIES = [
  "Alimentação",
  "Hospedagem",
  "Agência e Operadores",
  "Entretenimento",
  "Transportes",
  "Comércio e Serviços",
];

type ContentSubTab = "eventos" | "noticias" | "atrativos" | "locais";

interface AdminContentImagesSectionProps {
  cities: AdminCidadeRecord[];
  igrs: AdminIGRRecord[];
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}

function localDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function parseOptionalNumber(raw: string): number | null {
  const cleaned = raw.trim().replace(",", ".");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractApiError(error: unknown): string {
  if (axios.isAxiosError<Record<string, unknown>>(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object") {
      if (typeof data.detail === "string") return data.detail;
      const firstValue = Object.values(data)[0];
      if (Array.isArray(firstValue) && typeof firstValue[0] === "string") return firstValue[0];
      if (typeof firstValue === "string") return firstValue;
    }
  }
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

export function AdminContentImagesSection({
  cities,
  igrs,
  onNotice,
  onError,
}: AdminContentImagesSectionProps) {
  const [subTab, setSubTab] = useState<ContentSubTab>("eventos");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const [eventos, setEventos] = useState<ManagerEvento[]>([]);
  const [noticias, setNoticias] = useState<ManagerNews[]>([]);
  const [pontos, setPontos] = useState<ManagerPontoTuristico[]>([]);
  const [locais, setLocais] = useState<ManagerLocalGeo[]>([]);

  // Evento form
  const [editingEv, setEditingEv] = useState<ManagerEvento | null>(null);
  const [evName, setEvName] = useState("");
  const [evCityId, setEvCityId] = useState("");
  const [evStart, setEvStart] = useState(() => localDateTime(new Date().toISOString()));
  const [evEnd, setEvEnd] = useState("");
  const [evDesc, setEvDesc] = useState("");
  const [evFeatured, setEvFeatured] = useState(false);
  const [evPop, setEvPop] = useState("50");
  const [savingEv, setSavingEv] = useState(false);

  // Notícia form
  const [editingNot, setEditingNot] = useState<ManagerNews | null>(null);
  const [notTitle, setNotTitle] = useState("");
  const [notSummary, setNotSummary] = useState("");
  const [notContent, setNotContent] = useState("");
  const [notPublished, setNotPublished] = useState(() => localDateTime(new Date().toISOString()));
  const [notCityId, setNotCityId] = useState("");
  const [notIgrId, setNotIgrId] = useState("");
  const [notCategory, setNotCategory] = useState("");
  const [notAuthor, setNotAuthor] = useState("");
  const [notFeatured, setNotFeatured] = useState(false);
  const [savingNot, setSavingNot] = useState(false);

  // Ponto Turístico form
  const [editingPonto, setEditingPonto] = useState<ManagerPontoTuristico | null>(null);
  const [ptName, setPtName] = useState("");
  const [ptCategory, setPtCategory] = useState("");
  const [ptCityId, setPtCityId] = useState("");
  const [ptDesc, setPtDesc] = useState("");
  const [ptFeatured, setPtFeatured] = useState(false);
  const [ptPop, setPtPop] = useState("50");
  const [ptLat, setPtLat] = useState("");
  const [ptLon, setPtLon] = useState("");
  const [savingPt, setSavingPt] = useState(false);

  // Local / Restaurante form
  const [editingLocal, setEditingLocal] = useState<ManagerLocalGeo | null>(null);
  const [locNome, setLocNome] = useState("");
  const [locCat, setLocCat] = useState("Alimentação");
  const [locCityId, setLocCityId] = useState("");
  const [locEnd, setLocEnd] = useState("");
  const [locTel, setLocTel] = useState("");
  const [locLat, setLocLat] = useState("");
  const [locLon, setLocLon] = useState("");
  const [locCnpj, setLocCnpj] = useState("");
  const [savingLoc, setSavingLoc] = useState(false);

  const defaultCityId = cities[0]?.id ? String(cities[0].id) : "";

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [evList, notList, ptList, locList] = await Promise.all([
        getAdminEventos().catch(() => []),
        getAdminNoticias().catch(() => []),
        getAdminPontos().catch(() => []),
        getAdminLocais().catch(() => []),
      ]);
      setEventos(evList);
      setNoticias(notList);
      setPontos(ptList);
      setLocais(locList);
    } catch (err) {
      onError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!evCityId && defaultCityId) setEvCityId(defaultCityId);
    if (!ptCityId && defaultCityId) setPtCityId(defaultCityId);
    if (!locCityId && defaultCityId) setLocCityId(defaultCityId);
  }, [defaultCityId, evCityId, ptCityId, locCityId]);

  const handleSaveEv = async (e: FormEvent) => {
    e.preventDefault();
    setSavingEv(true);
    onError("");
    onNotice("");
    try {
      const saved = await saveAdminEvento(
        {
          name: evName.trim(),
          slug: editingEv?.slug || slugify(evName),
          description: evDesc,
          start_date: new Date(evStart).toISOString(),
          end_date: evEnd ? new Date(evEnd).toISOString() : null,
          is_featured: evFeatured,
          popularity: Math.max(0, Number(evPop) || 0),
          latitude: editingEv?.latitude ?? null,
          longitude: editingEv?.longitude ?? null,
          cidade: Number(evCityId || defaultCityId),
        },
        editingEv?.id,
      );
      setEventos((prev) =>
        editingEv ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev],
      );
      setEditingEv(saved);
      onNotice(
        `Evento "${saved.name}" salvo. Gerencie a galeria de imagens logo abaixo do formulário.`,
      );
    } catch (err) {
      onError(extractApiError(err));
    } finally {
      setSavingEv(false);
    }
  };

  const handleSaveNot = async (e: FormEvent) => {
    e.preventDefault();
    setSavingNot(true);
    onError("");
    onNotice("");
    try {
      const saved = await saveAdminNoticia(
        {
          title: notTitle.trim(),
          slug: editingNot?.slug || slugify(notTitle),
          summary: notSummary.trim(),
          content: notContent,
          published_at: new Date(notPublished).toISOString(),
          is_featured: notFeatured,
          cidade: notCityId ? Number(notCityId) : null,
          igr: notIgrId ? Number(notIgrId) : null,
          category: notCategory.trim(),
          author: notAuthor.trim(),
          source_url: editingNot?.source_url || "",
          tags: editingNot?.tags || [],
        },
        editingNot?.id,
      );
      setNoticias((prev) =>
        editingNot ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev],
      );
      setEditingNot(saved);
      onNotice(`Notícia "${saved.title}" salva. Gerencie as imagens de capa/galeria logo abaixo.`);
    } catch (err) {
      onError(extractApiError(err));
    } finally {
      setSavingNot(false);
    }
  };

  const handleSavePt = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPt(true);
    onError("");
    onNotice("");
    try {
      const saved = await saveAdminPonto(
        {
          name: ptName.trim(),
          slug: editingPonto?.slug || slugify(ptName),
          category: ptCategory.trim(),
          description: ptDesc,
          is_featured: ptFeatured,
          popularity: Math.max(0, Number(ptPop) || 0),
          latitude: parseOptionalNumber(ptLat),
          longitude: parseOptionalNumber(ptLon),
          cidade: Number(ptCityId || defaultCityId),
        },
        editingPonto?.id,
      );
      setPontos((prev) =>
        editingPonto ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev],
      );
      setEditingPonto(saved);
      onNotice(`Ponto turístico "${saved.name}" salvo. Você já pode anexar fotos abaixo.`);
    } catch (err) {
      onError(extractApiError(err));
    } finally {
      setSavingPt(false);
    }
  };

  const handleSaveLoc = async (e: FormEvent) => {
    e.preventDefault();
    const latNum = parseOptionalNumber(locLat);
    const lonNum = parseOptionalNumber(locLon);
    if (latNum === null || lonNum === null) {
      onError("Informe latitude e longitude válidas para o estabelecimento.");
      return;
    }
    setSavingLoc(true);
    onError("");
    onNotice("");
    try {
      const saved = await saveAdminLocal(
        {
          nome: locNome.trim(),
          categoria: locCat.trim(),
          endereco: locEnd.trim(),
          telefone: locTel.trim(),
          cnpj_completo: locCnpj.trim() || null,
          cidade: Number(locCityId || defaultCityId),
          latitude: latNum,
          longitude: lonNum,
        },
        editingLocal?.id,
      );
      setLocais((prev) =>
        editingLocal ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev],
      );
      setEditingLocal(saved);
      onNotice(
        `Estabelecimento "${saved.nome}" salvo. Você já pode configurar a imagem de capa abaixo.`,
      );
    } catch (err) {
      onError(extractApiError(err));
    } finally {
      setSavingLoc(false);
    }
  };

  const q = searchTerm.trim().toLowerCase();

  const filteredEventos = useMemo(
    () =>
      q
        ? eventos.filter(
            (e) =>
              e.name.toLowerCase().includes(q) || (e.cidade_name || "").toLowerCase().includes(q),
          )
        : eventos,
    [eventos, q],
  );
  const filteredNoticias = useMemo(
    () =>
      q
        ? noticias.filter(
            (n) =>
              n.title.toLowerCase().includes(q) || (n.category || "").toLowerCase().includes(q),
          )
        : noticias,
    [noticias, q],
  );
  const filteredPontos = useMemo(
    () =>
      q
        ? pontos.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              (p.category || "").toLowerCase().includes(q) ||
              (p.cidade_name || "").toLowerCase().includes(q),
          )
        : pontos,
    [pontos, q],
  );
  const filteredLocais = useMemo(
    () =>
      q
        ? locais.filter(
            (l) =>
              l.nome.toLowerCase().includes(q) ||
              l.categoria.toLowerCase().includes(q) ||
              (l.cidade_name || "").toLowerCase().includes(q),
          )
        : locais,
    [locais, q],
  );

  const activeListLength =
    subTab === "eventos"
      ? filteredEventos.length
      : subTab === "noticias"
        ? filteredNoticias.length
        : subTab === "atrativos"
          ? filteredPontos.length
          : filteredLocais.length;
  const totalPages = Math.max(1, Math.ceil(activeListLength / PAGE_SIZE));
  const sliceStart = (page - 1) * PAGE_SIZE;

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center gap-3 text-slate-600">
        <LoaderCircle className="h-5 w-5 animate-spin text-[#359830]" />
        Carregando conteúdos e galerias de imagens...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-950 flex items-center gap-2.5">
        <ImageIcon className="h-4 w-4 text-[#1D5C1B] shrink-0" />
        <span>
          Selecione ou cadastre qualquer <strong>Evento</strong>, <strong>Notícia</strong>,{" "}
          <strong>Ponto Turístico</strong> ou <strong>Restaurante/Estabelecimento</strong> abaixo
          para configurar suas imagens dinâmicas (capa e galeria). Cidades e IGRs também possuem
          galeria na aba <strong>Cidades &amp; IGRs</strong>.
        </span>
      </div>

      {/* Sub-abas */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: "eventos", label: "Eventos", count: eventos.length, icon: CalendarDays },
            { id: "noticias", label: "Notícias", count: noticias.length, icon: Newspaper },
            { id: "atrativos", label: "Pontos Turísticos", count: pontos.length, icon: Compass },
            {
              id: "locais",
              label: "Restaurantes & Serviços",
              count: locais.length,
              icon: UtensilsCrossed,
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSubTab(tab.id);
                setSearchTerm("");
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition cursor-pointer ${
                active
                  ? "bg-[#1D5C1B] text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,1.15fr)]">
        {/* Coluna Esquerda: Formulário + ManagerImageManager */}
        <div className="space-y-4">
          {subTab === "eventos" && (
            <>
              <form
                onSubmit={handleSaveEv}
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900">
                    {editingEv ? `Editar evento: ${editingEv.name}` : "Novo evento"}
                  </h3>
                  {editingEv && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEv(null);
                        setEvName("");
                        setEvDesc("");
                        setEvStart(localDateTime(new Date().toISOString()));
                        setEvEnd("");
                        setEvFeatured(false);
                        setEvPop("50");
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Novo evento
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Nome do evento
                    <input
                      required
                      value={evName}
                      onChange={(e) => setEvName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Município
                    <select
                      required
                      value={evCityId}
                      onChange={(e) => setEvCityId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    >
                      {cities.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Início
                    <input
                      required
                      type="datetime-local"
                      value={evStart}
                      onChange={(e) => setEvStart(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Término (opcional)
                    <input
                      type="datetime-local"
                      value={evEnd}
                      onChange={(e) => setEvEnd(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Popularidade
                    <input
                      type="number"
                      min={0}
                      value={evPop}
                      onChange={(e) => setEvPop(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 pt-5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={evFeatured}
                      onChange={(e) => setEvFeatured(e.target.checked)}
                      className="h-4 w-4 accent-[#1D5C1B]"
                    />
                    Destaque na vitrine
                  </label>
                </div>
                <ManagerRichTextEditor
                  label="Descrição do evento"
                  value={evDesc}
                  onChange={setEvDesc}
                />
                <button
                  type="submit"
                  disabled={savingEv}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D5C1B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#287524] disabled:opacity-60 cursor-pointer"
                >
                  {savingEv ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : editingEv ? (
                    <Save className="h-4 w-4" />
                  ) : (
                    <CirclePlus className="h-4 w-4" />
                  )}
                  {editingEv ? "Salvar evento" : "Criar evento"}
                </button>
              </form>
              {editingEv && (
                <ManagerImageManager
                  targetType="evento"
                  targetId={editingEv.id}
                  images={editingEv.imagens || []}
                  title={`Imagens do evento: ${editingEv.name}`}
                  onChanged={(imgs) => {
                    const updated = { ...editingEv, imagens: imgs };
                    setEditingEv(updated);
                    setEventos((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                  }}
                />
              )}
            </>
          )}

          {subTab === "noticias" && (
            <>
              <form
                onSubmit={handleSaveNot}
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900">
                    {editingNot ? `Editar notícia: ${editingNot.title}` : "Nova notícia"}
                  </h3>
                  {editingNot && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNot(null);
                        setNotTitle("");
                        setNotSummary("");
                        setNotContent("");
                        setNotCategory("");
                        setNotAuthor("");
                        setNotCityId("");
                        setNotIgrId("");
                        setNotFeatured(false);
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Nova notícia
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-700 sm:col-span-2">
                    Título
                    <input
                      required
                      value={notTitle}
                      onChange={(e) => setNotTitle(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Município (opcional)
                    <select
                      value={notCityId}
                      onChange={(e) => setNotCityId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    >
                      <option value="">Nenhum</option>
                      {cities.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    IGR (opcional)
                    <select
                      value={notIgrId}
                      onChange={(e) => setNotIgrId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    >
                      <option value="">Nenhuma</option>
                      {igrs.map((i) => (
                        <option key={i.id} value={String(i.id)}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Categoria
                    <input
                      value={notCategory}
                      onChange={(e) => setNotCategory(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Autor
                    <input
                      value={notAuthor}
                      onChange={(e) => setNotAuthor(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Publicação
                    <input
                      required
                      type="datetime-local"
                      value={notPublished}
                      onChange={(e) => setNotPublished(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 pt-5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notFeatured}
                      onChange={(e) => setNotFeatured(e.target.checked)}
                      className="h-4 w-4 accent-[#1D5C1B]"
                    />
                    Notícia em destaque
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 sm:col-span-2">
                    Resumo curto
                    <textarea
                      rows={2}
                      value={notSummary}
                      onChange={(e) => setNotSummary(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                </div>
                <ManagerRichTextEditor
                  label="Conteúdo da notícia"
                  value={notContent}
                  onChange={setNotContent}
                />
                <button
                  type="submit"
                  disabled={savingNot}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D5C1B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#287524] disabled:opacity-60 cursor-pointer"
                >
                  {savingNot ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : editingNot ? (
                    <Save className="h-4 w-4" />
                  ) : (
                    <CirclePlus className="h-4 w-4" />
                  )}
                  {editingNot ? "Salvar notícia" : "Publicar notícia"}
                </button>
              </form>
              {editingNot && (
                <ManagerImageManager
                  targetType="noticia"
                  targetId={editingNot.id}
                  images={editingNot.imagens || []}
                  title={`Imagens da notícia: ${editingNot.title}`}
                  onChanged={(imgs) => {
                    const updated = { ...editingNot, imagens: imgs };
                    setEditingNot(updated);
                    setNoticias((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                  }}
                />
              )}
            </>
          )}

          {subTab === "atrativos" && (
            <>
              <form
                onSubmit={handleSavePt}
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900">
                    {editingPonto ? `Editar ponto: ${editingPonto.name}` : "Novo ponto turístico"}
                  </h3>
                  {editingPonto && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPonto(null);
                        setPtName("");
                        setPtCategory("");
                        setPtDesc("");
                        setPtLat("");
                        setPtLon("");
                        setPtFeatured(false);
                        setPtPop("50");
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Novo ponto
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Nome do atrativo
                    <input
                      required
                      value={ptName}
                      onChange={(e) => setPtName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Município
                    <select
                      required
                      value={ptCityId}
                      onChange={(e) => setPtCityId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    >
                      {cities.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Categoria
                    <input
                      value={ptCategory}
                      onChange={(e) => setPtCategory(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Popularidade
                    <input
                      type="number"
                      min={0}
                      value={ptPop}
                      onChange={(e) => setPtPop(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Latitude
                    <input
                      value={ptLat}
                      onChange={(e) => setPtLat(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Longitude
                    <input
                      value={ptLon}
                      onChange={(e) => setPtLon(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ptFeatured}
                    onChange={(e) => setPtFeatured(e.target.checked)}
                    className="h-4 w-4 accent-[#1D5C1B]"
                  />
                  Destaque regional
                </label>
                <ManagerRichTextEditor
                  label="Descrição do atrativo"
                  value={ptDesc}
                  onChange={setPtDesc}
                />
                <button
                  type="submit"
                  disabled={savingPt}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D5C1B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#287524] disabled:opacity-60 cursor-pointer"
                >
                  {savingPt ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : editingPonto ? (
                    <Save className="h-4 w-4" />
                  ) : (
                    <CirclePlus className="h-4 w-4" />
                  )}
                  {editingPonto ? "Salvar atrativo" : "Criar atrativo"}
                </button>
              </form>
              {editingPonto && (
                <ManagerImageManager
                  targetType="ponto_turistico"
                  targetId={editingPonto.id}
                  images={editingPonto.imagens || []}
                  title={`Imagens do atrativo: ${editingPonto.name}`}
                  onChanged={(imgs) => {
                    const updated = { ...editingPonto, imagens: imgs };
                    setEditingPonto(updated);
                    setPontos((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                  }}
                />
              )}
            </>
          )}

          {subTab === "locais" && (
            <>
              <form
                onSubmit={handleSaveLoc}
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900">
                    {editingLocal
                      ? `Editar local: ${editingLocal.nome}`
                      : "Novo restaurante / hospedagem / serviço"}
                  </h3>
                  {editingLocal && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLocal(null);
                        setLocNome("");
                        setLocCat("Alimentação");
                        setLocEnd("");
                        setLocTel("");
                        setLocLat("");
                        setLocLon("");
                        setLocCnpj("");
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Novo local
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Nome do estabelecimento
                    <input
                      required
                      value={locNome}
                      onChange={(e) => setLocNome(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Categoria
                    <select
                      value={locCat}
                      onChange={(e) => setLocCat(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    >
                      {LOCAL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Município
                    <select
                      required
                      value={locCityId}
                      onChange={(e) => setLocCityId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    >
                      {cities.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Telefone
                    <input
                      value={locTel}
                      onChange={(e) => setLocTel(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 sm:col-span-2">
                    Endereço
                    <input
                      value={locEnd}
                      onChange={(e) => setLocEnd(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Latitude
                    <input
                      required
                      value={locLat}
                      onChange={(e) => setLocLat(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Longitude
                    <input
                      required
                      value={locLon}
                      onChange={(e) => setLocLon(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 sm:col-span-2">
                    CNPJ (opcional, 14 dígitos)
                    <input
                      maxLength={14}
                      value={locCnpj}
                      onChange={(e) => setLocCnpj(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={savingLoc}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D5C1B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#287524] disabled:opacity-60 cursor-pointer"
                >
                  {savingLoc ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : editingLocal ? (
                    <Save className="h-4 w-4" />
                  ) : (
                    <CirclePlus className="h-4 w-4" />
                  )}
                  {editingLocal ? "Salvar estabelecimento" : "Criar estabelecimento"}
                </button>
              </form>
              {editingLocal && (
                <ManagerImageManager
                  targetType="local"
                  targetId={editingLocal.id}
                  images={editingLocal.imagens || []}
                  title={`Imagens do estabelecimento: ${editingLocal.nome}`}
                  onChanged={(imgs) => {
                    const updated = { ...editingLocal, imagens: imgs };
                    setEditingLocal(updated);
                    setLocais((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Coluna Direita: Lista Paginada (max 20/página) */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar registro para editar ou configurar imagens..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-[#359830]"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {subTab === "eventos" &&
              filteredEventos.slice(sliceStart, sliceStart + PAGE_SIZE).map((ev) => (
                <article
                  key={ev.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{ev.name}</h4>
                    <p className="text-xs text-slate-500">
                      {ev.cidade_name || "—"} • {ev.imagens?.length ?? 0} fotos
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEv(ev);
                        setEvName(ev.name);
                        setEvCityId(String(ev.cidade));
                        setEvStart(localDateTime(ev.start_date));
                        setEvEnd(ev.end_date ? localDateTime(ev.end_date) : "");
                        setEvDesc(ev.description || "");
                        setEvFeatured(ev.is_featured);
                        setEvPop(String(ev.popularity ?? 0));
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar / Fotos
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(`Excluir evento "${ev.name}"?`)) return;
                        await deleteAdminEvento(ev.id);
                        setEventos((prev) => prev.filter((x) => x.id !== ev.id));
                        if (editingEv?.id === ev.id) setEditingEv(null);
                      }}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}

            {subTab === "noticias" &&
              filteredNoticias.slice(sliceStart, sliceStart + PAGE_SIZE).map((not) => (
                <article
                  key={not.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{not.title}</h4>
                    <p className="text-xs text-slate-500">
                      {not.category || "Notícia"} • {not.imagens?.length ?? 0} fotos
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNot(not);
                        setNotTitle(not.title);
                        setNotSummary(not.summary || "");
                        setNotContent(not.content || "");
                        setNotPublished(localDateTime(not.published_at));
                        setNotCityId(not.cidade ? String(not.cidade) : "");
                        setNotIgrId(not.igr ? String(not.igr) : "");
                        setNotCategory(not.category || "");
                        setNotAuthor(not.author || "");
                        setNotFeatured(not.is_featured);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar / Fotos
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(`Excluir notícia "${not.title}"?`)) return;
                        await deleteAdminNoticia(not.id);
                        setNoticias((prev) => prev.filter((x) => x.id !== not.id));
                        if (editingNot?.id === not.id) setEditingNot(null);
                      }}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}

            {subTab === "atrativos" &&
              filteredPontos.slice(sliceStart, sliceStart + PAGE_SIZE).map((pt) => (
                <article
                  key={pt.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{pt.name}</h4>
                    <p className="text-xs text-slate-500">
                      {pt.cidade_name || "—"} • {pt.category || "Atrativo"} •{" "}
                      {pt.imagens?.length ?? 0} fotos
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPonto(pt);
                        setPtName(pt.name);
                        setPtCategory(pt.category || "");
                        setPtCityId(String(pt.cidade));
                        setPtDesc(pt.description || "");
                        setPtFeatured(pt.is_featured);
                        setPtPop(String(pt.popularity ?? 0));
                        setPtLat(
                          pt.latitude !== null && pt.latitude !== undefined
                            ? String(pt.latitude)
                            : "",
                        );
                        setPtLon(
                          pt.longitude !== null && pt.longitude !== undefined
                            ? String(pt.longitude)
                            : "",
                        );
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar / Fotos
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(`Excluir atrativo "${pt.name}"?`)) return;
                        await deleteAdminPonto(pt.id);
                        setPontos((prev) => prev.filter((x) => x.id !== pt.id));
                        if (editingPonto?.id === pt.id) setEditingPonto(null);
                      }}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}

            {subTab === "locais" &&
              filteredLocais.slice(sliceStart, sliceStart + PAGE_SIZE).map((loc) => (
                <article
                  key={loc.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{loc.nome}</h4>
                    <p className="text-xs text-slate-500">
                      {loc.categoria} • {loc.cidade_name || "—"} • {loc.imagens?.length ?? 0} fotos
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLocal(loc);
                        setLocNome(loc.nome);
                        setLocCat(loc.categoria || "Alimentação");
                        setLocCityId(String(loc.cidade));
                        setLocEnd(loc.endereco || "");
                        setLocTel(loc.telefone || "");
                        setLocLat(String(loc.latitude));
                        setLocLon(String(loc.longitude));
                        setLocCnpj(loc.cnpj_completo || "");
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar / Fotos
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(`Excluir estabelecimento "${loc.nome}"?`)) return;
                        await deleteAdminLocal(loc.id);
                        setLocais((prev) => prev.filter((x) => x.id !== loc.id));
                        if (editingLocal?.id === loc.id) setEditingLocal(null);
                      }}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
          </div>

          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            totalItems={activeListLength}
            pageSize={PAGE_SIZE}
            itemLabel="registros"
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
