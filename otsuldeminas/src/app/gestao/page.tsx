"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  AlertCircle,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  CirclePlus,
  Compass,
  Layers,
  Link2,
  LoaderCircle,
  LogOut,
  Newspaper,
  Pencil,
  Save,
  ShieldCheck,
  Trash2,
  Unlink,
  UtensilsCrossed,
} from "lucide-react";
import { Header } from "@/components/Header";
import {
  ManagerEventsSection,
  ManagerLocaisSection,
  ManagerPontosSection,
} from "@/components/ManagerCatalogSections";
import { ManagerImageManager } from "@/components/ManagerImageManager";
import { ManagerRichTextEditor } from "@/components/ManagerRichTextEditor";
import {
  AvailableCityForIgr,
  deleteManagerNews,
  getAvailableCitiesForIgr,
  getAvailableIgrsForCity,
  getManagerCollection,
  getManagerSession,
  linkCityToIgr,
  linkIgrToCity,
  logoutManager,
  ManagerCity,
  ManagerCityOption,
  ManagerEvento,
  ManagerIGR,
  ManagerLinkedIgr,
  ManagerLocalGeo,
  ManagerNews,
  ManagerNewsInput,
  ManagerPontoTuristico,
  ManagerSession,
  saveManagerNews,
  unlinkCityFromIgr,
  unlinkIgrFromCity,
  updateManagerRecord,
} from "@/lib/manager-api";
import { slugify } from "@/lib/utils";

type ManagerTab = "entidade" | "noticias" | "eventos" | "atrativos" | "locais";

interface EntityFields {
  name: string;
  slug: string;
  description: string;
}

interface NewsFields {
  title: string;
  summary: string;
  content: string;
  publishedAt: string;
  category: string;
  author: string;
  sourceUrl: string;
  tags: string;
  isFeatured: boolean;
}

function localDateTime(value: string): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function defaultNewsFields(): NewsFields {
  return {
    title: "",
    summary: "",
    content: "",
    publishedAt: localDateTime(new Date().toISOString()),
    category: "",
    author: "",
    sourceUrl: "",
    tags: "",
    isFeatured: false,
  };
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail || "Não foi possível concluir a operação.";
  }
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}

function ManagerEntityEditor<T extends ManagerCity | ManagerIGR>({
  entity,
  label,
  endpoint,
  targetType,
  onSaved,
}: {
  entity: T;
  label: string;
  endpoint: "cidades" | "igrs";
  targetType: "cidade" | "igr";
  onSaved: (record: T) => void;
}) {
  const [fields, setFields] = useState<EntityFields>({
    name: entity.name,
    slug: entity.slug,
    description: entity.description || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFields({ name: entity.name, slug: entity.slug, description: entity.description || "" });
  }, [entity]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const updated = await updateManagerRecord<T>(endpoint, entity.id, fields);
      onSaved(updated);
      setSaved(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-[#1D5C1B]">
            {endpoint === "cidades" ? (
              <Building2 className="h-5 w-5" />
            ) : (
              <Layers className="h-5 w-5" />
            )}
          </span>
          <div>
            <h2 className="font-bold text-slate-900">Dados de {label}</h2>
            <p className="text-xs text-slate-500">
              Atualize as informações públicas e fotos vinculadas à sua conta.
            </p>
          </div>
        </div>
        <label className="block text-sm font-semibold text-slate-700">
          Nome
          <input
            required
            maxLength={255}
            value={fields.name}
            onChange={(event) => setFields((current) => ({ ...current, name: event.target.value }))}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Slug
          <input
            required
            maxLength={255}
            value={fields.slug}
            onChange={(event) => setFields((current) => ({ ...current, slug: event.target.value }))}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-mono text-sm font-normal outline-none focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
          />
        </label>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Descrição</label>
          <ManagerRichTextEditor
            label={`Descrição de ${label}`}
            value={fields.description}
            onChange={(description) => setFields((current) => ({ ...current, description }))}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Formatação e links são aceitos; o conteúdo é sanitizado antes de ser salvo.
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        {saved && (
          <p
            role="status"
            className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800"
          >
            <Check className="h-4 w-4" /> Alterações salvas.
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1D5C1B] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#287524] disabled:opacity-60 cursor-pointer"
        >
          {saving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar dados
        </button>
      </form>

      <ManagerImageManager
        targetType={targetType}
        targetId={entity.id}
        images={entity.imagens || []}
        onChanged={(imgs) => onSaved({ ...entity, imagens: imgs })}
        title={`Imagens de ${entity.name}`}
      />
    </div>
  );
}

export default function GestaoPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ManagerTab>("entidade");
  const [manager, setManager] = useState<ManagerSession | null>(null);
  const [managedCities, setManagedCities] = useState<ManagerCity[]>([]);
  const [igr, setIgr] = useState<ManagerIGR | null>(null);
  const [availableIgrs, setAvailableIgrs] = useState<ManagerLinkedIgr[]>([]);
  const [availableCities, setAvailableCities] = useState<AvailableCityForIgr[]>([]);
  const [selectedIgrToAttach, setSelectedIgrToAttach] = useState("");
  const [selectedCityToAttach, setSelectedCityToAttach] = useState("");
  const [linkingRelation, setLinkingRelation] = useState(false);
  const [relationNotice, setRelationNotice] = useState("");
  const [news, setNews] = useState<ManagerNews[]>([]);
  const [eventos, setEventos] = useState<ManagerEvento[]>([]);
  const [pontos, setPontos] = useState<ManagerPontoTuristico[]>([]);
  const [locais, setLocais] = useState<ManagerLocalGeo[]>([]);
  const [newsFields, setNewsFields] = useState<NewsFields>(defaultNewsFields);
  const [editingNews, setEditingNews] = useState<ManagerNews | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingNews, setSavingNews] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadNews = useCallback(async () => {
    const items = await getManagerCollection<ManagerNews>("noticias/");
    setNews(items);
  }, []);

  const refreshIgrRelatedCollections = useCallback(async () => {
    const [current, cities, igrs, items, evItems, ptItems, locItems, availCities] =
      await Promise.all([
        getManagerSession(),
        getManagerCollection<ManagerCity>("cidades/"),
        getManagerCollection<ManagerIGR>("igrs/"),
        getManagerCollection<ManagerNews>("noticias/"),
        getManagerCollection<ManagerEvento>("eventos/"),
        getManagerCollection<ManagerPontoTuristico>("pontos-turisticos/"),
        getManagerCollection<ManagerLocalGeo>("locais/"),
        getAvailableCitiesForIgr().catch(() => []),
      ]);
    setManager(current);
    setManagedCities(cities);
    setIgr(igrs[0] || null);
    setNews(items);
    setEventos(evItems);
    setPontos(ptItems);
    setLocais(locItems);
    setAvailableCities(availCities);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadPortal() {
      try {
        const current = await getManagerSession();
        const hasCityScope = current.scopes.some((scope) => scope.type === "cidade");
        const hasIgrScope = current.scopes.some((scope) => scope.type === "igr");
        const [cities, igrs, items, evItems, ptItems, locItems, availIgrs, availCities] =
          await Promise.all([
            getManagerCollection<ManagerCity>("cidades/"),
            hasIgrScope ? getManagerCollection<ManagerIGR>("igrs/") : Promise.resolve([]),
            getManagerCollection<ManagerNews>("noticias/"),
            getManagerCollection<ManagerEvento>("eventos/"),
            getManagerCollection<ManagerPontoTuristico>("pontos-turisticos/"),
            getManagerCollection<ManagerLocalGeo>("locais/"),
            hasCityScope ? getAvailableIgrsForCity().catch(() => []) : Promise.resolve([]),
            hasIgrScope ? getAvailableCitiesForIgr().catch(() => []) : Promise.resolve([]),
          ]);
        if (!active) return;
        setManager(current);
        setManagedCities(cities);
        setIgr(igrs[0] || null);
        setAvailableIgrs(availIgrs);
        setAvailableCities(availCities);
        setNews(items);
        setEventos(evItems);
        setPontos(ptItems);
        setLocais(locItems);
        setLoading(false);
      } catch (requestError) {
        if (!active) return;
        if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
          router.replace("/acesso");
          return;
        }
        setError(getErrorMessage(requestError));
        setLoading(false);
      }
    }
    loadPortal();
    return () => {
      active = false;
    };
  }, [router]);

  const allowedCityOptions: ManagerCityOption[] =
    manager?.cities && manager.cities.length > 0
      ? manager.cities
      : managedCities.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  const directCityScopeId = manager?.scopes.find((s) => s.type === "cidade")?.id ?? null;
  const directCity =
    directCityScopeId !== null
      ? managedCities.find((c) => c.id === directCityScopeId) || null
      : null;

  const handleAttachCityToIgr = async (e: FormEvent) => {
    e.preventDefault();
    if (!directCity || !selectedIgrToAttach) return;
    setLinkingRelation(true);
    setError("");
    setRelationNotice("");
    try {
      const updated = await linkCityToIgr(directCity.id, Number(selectedIgrToAttach));
      setManagedCities((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSelectedIgrToAttach("");
      setRelationNotice("Cidade anexada à IGR selecionada.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLinkingRelation(false);
    }
  };

  const handleDetachCityFromIgr = async (igrId: number, igrName: string) => {
    if (!directCity) return;
    if (!window.confirm(`Desvincular "${directCity.name}" da IGR "${igrName}"?`)) return;
    setLinkingRelation(true);
    setError("");
    setRelationNotice("");
    try {
      const updated = await unlinkCityFromIgr(directCity.id, igrId);
      setManagedCities((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setRelationNotice(`Vínculo com "${igrName}" removido.`);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLinkingRelation(false);
    }
  };

  const handleAttachIgrToCity = async (e: FormEvent) => {
    e.preventDefault();
    if (!igr || !selectedCityToAttach) return;
    setLinkingRelation(true);
    setError("");
    setRelationNotice("");
    try {
      await linkIgrToCity(igr.id, Number(selectedCityToAttach));
      setSelectedCityToAttach("");
      await refreshIgrRelatedCollections();
      setRelationNotice("Município anexado à sua IGR.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLinkingRelation(false);
    }
  };

  const handleDetachIgrFromCity = async (cidadeId: number, cidadeName: string) => {
    if (!igr) return;
    if (!window.confirm(`Retirar o município "${cidadeName}" da IGR "${igr.name}"?`)) return;
    setLinkingRelation(true);
    setError("");
    setRelationNotice("");
    try {
      await unlinkIgrFromCity(igr.id, cidadeId);
      await refreshIgrRelatedCollections();
      setRelationNotice(`Município "${cidadeName}" retirado da IGR.`);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLinkingRelation(false);
    }
  };

  const handleNewsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingNews(true);
    setError("");
    setNotice("");
    const values: ManagerNewsInput = {
      title: newsFields.title.trim(),
      slug: editingNews?.slug || slugify(newsFields.title),
      summary: newsFields.summary.trim(),
      content: newsFields.content,
      published_at: new Date(newsFields.publishedAt).toISOString(),
      is_featured: newsFields.isFeatured,
      category: newsFields.category.trim(),
      author: newsFields.author.trim(),
      source_url: newsFields.sourceUrl.trim(),
      tags: newsFields.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      ...(editingNews ? { cidade: editingNews.cidade, igr: editingNews.igr } : {}),
    };
    try {
      const saved = await saveManagerNews(values, editingNews?.id);
      await loadNews();
      setEditingNews(saved);
      setNotice(
        editingNews
          ? "Notícia atualizada."
          : "Notícia publicada. Caso queira, adicione fotos na galeria abaixo.",
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSavingNews(false);
    }
  };

  const startEditingNews = (item: ManagerNews) => {
    setEditingNews(item);
    setNewsFields({
      title: item.title,
      summary: item.summary,
      content: item.content || "",
      publishedAt: localDateTime(item.published_at),
      category: item.category || "",
      author: item.author || "",
      sourceUrl: item.source_url || "",
      tags: (item.tags || []).join(", "),
      isFeatured: item.is_featured,
    });
    setNotice("");
  };

  const removeNews = async (item: ManagerNews) => {
    if (!window.confirm(`Excluir a notícia "${item.title}"?`)) return;
    setError("");
    setNotice("");
    try {
      await deleteManagerNews(item.id);
      setNews((current) => current.filter((newsItem) => newsItem.id !== item.id));
      if (editingNews?.id === item.id) {
        setEditingNews(null);
        setNewsFields(defaultNewsFields());
      }
      setNotice("Notícia excluída.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const handleLogout = async () => {
    try {
      await logoutManager();
      router.replace("/acesso");
    } catch {
      setError("Não foi possível encerrar a sessão. Tente novamente.");
    }
  };

  const clearNewsForm = () => {
    setEditingNews(null);
    setNewsFields(defaultNewsFields());
  };

  const tabs: { id: ManagerTab; label: string; count?: number; icon: typeof Building2 }[] = [
    { id: "entidade", label: "Entidade & Fotos", icon: Building2 },
    { id: "noticias", label: "Notícias", count: news.length, icon: Newspaper },
    { id: "eventos", label: "Eventos", count: eventos.length, icon: CalendarDays },
    { id: "atrativos", label: "Atrativos Turísticos", count: pontos.length, icon: Compass },
    { id: "locais", label: "Restaurantes & Locais", count: locais.length, icon: UtensilsCrossed },
  ];

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <Header
        badge="Portal de Gestão"
        title="Painel do Gestor"
        subtitle="Gerencie informações da cidade ou IGR, fotos, notícias, eventos, atrativos e estabelecimentos."
      />
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-slate-600">
            <LoaderCircle className="h-5 w-5 animate-spin text-[#359830]" />
            Carregando sua área de gestão...
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl bg-[#1D5C1B] p-5 text-white sm:flex-row sm:items-center sm:p-7">
              <div>
                <p className="text-sm font-semibold text-emerald-100">Área restrita</p>
                <h1 className="mt-1 text-2xl font-extrabold">Olá, {manager?.username}</h1>
                <p className="mt-1 text-sm text-white/80">
                  {manager?.scopes
                    .map((scope) => `${scope.type === "cidade" ? "Cidade" : "IGR"}: ${scope.name}`)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                {manager?.is_superuser && (
                  <Link
                    href="/coordenacao"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/25"
                  >
                    <ShieldCheck className="h-4 w-4 text-amber-300" />
                    Gerenciar Gestores
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Navegação por abas */}
            <div className="mb-8 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setError("");
                    }}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                      active
                        ? "bg-[#1D5C1B] text-white shadow-sm"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {activeTab === "entidade" && (
              <div className="space-y-6">
                {relationNotice && (
                  <p
                    role="status"
                    className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900"
                  >
                    <Check className="h-4 w-4 text-emerald-700" />
                    {relationNotice}
                  </p>
                )}

                <div className="grid gap-6 lg:grid-cols-2 items-start">
                  {directCity && (
                    <ManagerEntityEditor
                      entity={directCity}
                      label={`a cidade de ${directCity.name}`}
                      endpoint="cidades"
                      targetType="cidade"
                      onSaved={(updated) =>
                        setManagedCities((prev) =>
                          prev.map((c) => (c.id === updated.id ? updated : c)),
                        )
                      }
                    />
                  )}

                  {directCity && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-5">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                          <Link2 className="h-5 w-5" />
                        </span>
                        <div>
                          <h2 className="font-bold text-slate-900">Vínculo com IGRs</h2>
                          <p className="text-xs text-slate-500">
                            Anexe {directCity.name} a uma ou mais IGRs ou retire o vínculo (sem
                            alterar os dados da IGR).
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          IGRs vinculadas ({(directCity.igrs || []).length})
                        </h3>
                        {!directCity.igrs || directCity.igrs.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
                            Esta cidade ainda não está vinculada a nenhuma IGR.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {directCity.igrs.map((linkedIgr) => (
                              <div
                                key={linkedIgr.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5"
                              >
                                <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                  <Layers className="h-4 w-4 text-[#1D5C1B]" />
                                  {linkedIgr.name}
                                </span>
                                <button
                                  type="button"
                                  disabled={linkingRelation}
                                  onClick={() =>
                                    handleDetachCityFromIgr(linkedIgr.id, linkedIgr.name)
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 cursor-pointer"
                                >
                                  <Unlink className="h-3.5 w-3.5" />
                                  Retirar
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <form
                        onSubmit={handleAttachCityToIgr}
                        className="space-y-3 border-t border-slate-100 pt-4"
                      >
                        <label className="block text-xs font-semibold text-slate-700">
                          Anexar a uma IGR
                          <select
                            value={selectedIgrToAttach}
                            onChange={(e) => setSelectedIgrToAttach(e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#359830]"
                          >
                            <option value="">Selecione uma IGR...</option>
                            {availableIgrs
                              .filter(
                                (opt) => !(directCity.igrs || []).some((l) => l.id === opt.id),
                              )
                              .map((opt) => (
                                <option key={opt.id} value={String(opt.id)}>
                                  {opt.name}
                                </option>
                              ))}
                          </select>
                        </label>
                        <button
                          type="submit"
                          disabled={linkingRelation || !selectedIgrToAttach}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#1D5C1B] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#287524] disabled:opacity-50 cursor-pointer"
                        >
                          {linkingRelation ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Link2 className="h-4 w-4" />
                          )}
                          Anexar cidade à IGR
                        </button>
                      </form>
                    </div>
                  )}

                  {igr && (
                    <ManagerEntityEditor
                      entity={igr}
                      label={igr.name}
                      endpoint="igrs"
                      targetType="igr"
                      onSaved={setIgr}
                    />
                  )}

                  {igr && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-5">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-[#1D5C1B]">
                          <Building2 className="h-5 w-5" />
                        </span>
                        <div>
                          <h2 className="font-bold text-slate-900">Municípios da IGR</h2>
                          <p className="text-xs text-slate-500">
                            Anexe cidades à {igr.name} ou retire o vínculo. Os dados cadastrais de
                            cada município são gerenciados apenas pelo respectivo gestor municipal.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Cidades vinculadas ({(igr.cidades || []).length})
                        </h3>
                        {!igr.cidades || igr.cidades.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
                            Nenhum município vinculado a esta IGR no momento.
                          </p>
                        ) : (
                          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                            {igr.cidades.map((linkedCity) => (
                              <div
                                key={linkedCity.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5"
                              >
                                <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                  <Building2 className="h-4 w-4 text-[#1D5C1B]" />
                                  {linkedCity.name}
                                </span>
                                <button
                                  type="button"
                                  disabled={linkingRelation}
                                  onClick={() =>
                                    handleDetachIgrFromCity(linkedCity.id, linkedCity.name)
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 cursor-pointer"
                                >
                                  <Unlink className="h-3.5 w-3.5" />
                                  Retirar
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <form
                        onSubmit={handleAttachIgrToCity}
                        className="space-y-3 border-t border-slate-100 pt-4"
                      >
                        <label className="block text-xs font-semibold text-slate-700">
                          Anexar município à IGR
                          <select
                            value={selectedCityToAttach}
                            onChange={(e) => setSelectedCityToAttach(e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#359830]"
                          >
                            <option value="">Selecione um município...</option>
                            {availableCities
                              .filter((opt) => !(igr.cidades || []).some((c) => c.id === opt.id))
                              .map((opt) => (
                                <option key={opt.id} value={String(opt.id)}>
                                  {opt.name}
                                  {opt.igrs.length > 0
                                    ? ` (também em: ${opt.igrs.map((i) => i.name).join(", ")})`
                                    : ""}
                                </option>
                              ))}
                          </select>
                        </label>
                        <button
                          type="submit"
                          disabled={linkingRelation || !selectedCityToAttach}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#1D5C1B] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#287524] disabled:opacity-50 cursor-pointer"
                        >
                          {linkingRelation ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Link2 className="h-4 w-4" />
                          )}
                          Anexar município
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "noticias" && (
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
                <div className="space-y-4">
                  <form
                    onSubmit={handleNewsSubmit}
                    className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold text-slate-900">
                        {editingNews ? "Editar notícia" : "Cadastrar notícia"}
                      </h3>
                      {editingNews && (
                        <button
                          type="button"
                          onClick={clearNewsForm}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          Nova notícia
                        </button>
                      )}
                    </div>
                    <label className="block text-sm font-semibold text-slate-700">
                      Título
                      <input
                        required
                        maxLength={255}
                        value={newsFields.title}
                        onChange={(event) =>
                          setNewsFields((current) => ({ ...current, title: event.target.value }))
                        }
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      Resumo
                      <textarea
                        rows={3}
                        value={newsFields.summary}
                        onChange={(event) =>
                          setNewsFields((current) => ({ ...current, summary: event.target.value }))
                        }
                        className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
                      />
                    </label>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Conteúdo
                      </label>
                      <ManagerRichTextEditor
                        label="Conteúdo da notícia"
                        value={newsFields.content}
                        onChange={(content) =>
                          setNewsFields((current) => ({ ...current, content }))
                        }
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Data de publicação
                        <input
                          required
                          type="datetime-local"
                          value={newsFields.publishedAt}
                          onChange={(event) =>
                            setNewsFields((current) => ({
                              ...current,
                              publishedAt: event.target.value,
                            }))
                          }
                          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-700">
                        Categoria
                        <input
                          maxLength={100}
                          value={newsFields.category}
                          onChange={(event) =>
                            setNewsFields((current) => ({
                              ...current,
                              category: event.target.value,
                            }))
                          }
                          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-700">
                        Autor
                        <input
                          maxLength={255}
                          value={newsFields.author}
                          onChange={(event) =>
                            setNewsFields((current) => ({ ...current, author: event.target.value }))
                          }
                          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-700">
                        Link da fonte
                        <input
                          type="url"
                          maxLength={500}
                          value={newsFields.sourceUrl}
                          onChange={(event) =>
                            setNewsFields((current) => ({
                              ...current,
                              sourceUrl: event.target.value,
                            }))
                          }
                          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
                        />
                      </label>
                    </div>
                    <label className="block text-sm font-semibold text-slate-700">
                      Tags separadas por vírgula
                      <input
                        value={newsFields.tags}
                        onChange={(event) =>
                          setNewsFields((current) => ({ ...current, tags: event.target.value }))
                        }
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
                      />
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={newsFields.isFeatured}
                        onChange={(event) =>
                          setNewsFields((current) => ({
                            ...current,
                            isFeatured: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-[#1D5C1B]"
                      />
                      Marcar como destaque
                    </label>
                    {notice && (
                      <p role="status" className="text-sm font-semibold text-emerald-800">
                        {notice}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={savingNews}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D5C1B] px-4 py-3 font-bold text-white transition hover:bg-[#287524] disabled:opacity-60 cursor-pointer"
                    >
                      {savingNews ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : editingNews ? (
                        <Save className="h-4 w-4" />
                      ) : (
                        <CirclePlus className="h-4 w-4" />
                      )}
                      {savingNews
                        ? "Salvando..."
                        : editingNews
                          ? "Salvar notícia"
                          : "Publicar notícia"}
                    </button>
                  </form>

                  {editingNews && (
                    <ManagerImageManager
                      targetType="noticia"
                      targetId={editingNews.id}
                      images={editingNews.imagens || []}
                      onChanged={(imgs) => {
                        const updated = { ...editingNews, imagens: imgs };
                        setEditingNews(updated);
                        setNews((prev) => prev.map((n) => (n.id === editingNews.id ? updated : n)));
                      }}
                      title={`Fotos de "${editingNews.title}"`}
                    />
                  )}
                </div>

                <section className="space-y-3">
                  <h3 className="font-bold text-slate-900">Notícias cadastradas</h3>
                  {news.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center text-sm text-slate-600">
                      Nenhuma notícia cadastrada para sua área.
                    </div>
                  ) : (
                    news.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-bold leading-snug text-slate-900">{item.title}</h4>
                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                              <CalendarClock className="h-3.5 w-3.5" />
                              {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
                                new Date(item.published_at),
                              )}
                              {item.is_featured && (
                                <span className="ml-1 rounded-full bg-red-50 px-2 py-0.5 font-bold text-red-700">
                                  Destaque
                                </span>
                              )}
                            </p>
                          </div>
                          <details className="relative shrink-0">
                            <summary
                              aria-label={`Ações para ${item.title}`}
                              className="flex cursor-pointer list-none items-center gap-1 rounded-lg p-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                            >
                              Ações <ChevronDown className="h-4 w-4" />
                            </summary>
                            <div className="absolute right-0 z-10 mt-1 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                              <button
                                type="button"
                                onClick={() => startEditingNews(item)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100"
                              >
                                <Pencil className="h-4 w-4" /> Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => removeNews(item)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" /> Excluir
                              </button>
                            </div>
                          </details>
                        </div>
                        {item.summary && (
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                            {item.summary}
                          </p>
                        )}
                      </article>
                    ))
                  )}
                </section>
              </div>
            )}

            {activeTab === "eventos" && (
              <ManagerEventsSection
                cities={allowedCityOptions}
                eventos={eventos}
                onChange={setEventos}
                onError={setError}
              />
            )}

            {activeTab === "atrativos" && (
              <ManagerPontosSection
                cities={allowedCityOptions}
                pontos={pontos}
                onChange={setPontos}
                onError={setError}
              />
            )}

            {activeTab === "locais" && (
              <ManagerLocaisSection
                cities={allowedCityOptions}
                locais={locais}
                onChange={setLocais}
                onError={setError}
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}
