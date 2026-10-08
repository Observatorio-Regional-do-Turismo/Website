"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  AlertCircle,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  CirclePlus,
  Layers,
  LoaderCircle,
  LogOut,
  Newspaper,
  Pencil,
  Save,
  Trash2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { ManagerRichTextEditor } from "@/components/ManagerRichTextEditor";
import {
  deleteManagerNews,
  getManagerCollection,
  getManagerSession,
  logoutManager,
  ManagerCity,
  ManagerIGR,
  ManagerNews,
  ManagerNewsInput,
  ManagerSession,
  saveManagerNews,
  updateManagerRecord,
} from "@/lib/manager-api";

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

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
  onSaved,
}: {
  entity: T;
  label: string;
  endpoint: "cidades" | "igrs";
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-[#1D5C1B]">
          {endpoint === "cidades" ? <Building2 className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
        </span>
        <div>
          <h2 className="font-bold text-slate-900">Dados de {label}</h2>
          <p className="text-xs text-slate-500">Atualize as informações públicas vinculadas à sua conta.</p>
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
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {saved && <p role="status" className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800"><Check className="h-4 w-4" /> Alterações salvas.</p>}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-[#1D5C1B] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#287524] disabled:opacity-60"
      >
        {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar dados
      </button>
    </form>
  );
}

export default function GestaoPage() {
  const router = useRouter();
  const [manager, setManager] = useState<ManagerSession | null>(null);
  const [city, setCity] = useState<ManagerCity | null>(null);
  const [igr, setIgr] = useState<ManagerIGR | null>(null);
  const [news, setNews] = useState<ManagerNews[]>([]);
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

  useEffect(() => {
    let active = true;
    async function loadPortal() {
      try {
        const current = await getManagerSession();
        const hasCityScope = current.scopes.some((scope) => scope.type === "cidade");
        const hasIgrScope = current.scopes.some((scope) => scope.type === "igr");
        const [cities, igrs, items] = await Promise.all([
          hasCityScope ? getManagerCollection<ManagerCity>("cidades/") : Promise.resolve([]),
          hasIgrScope ? getManagerCollection<ManagerIGR>("igrs/") : Promise.resolve([]),
          getManagerCollection<ManagerNews>("noticias/"),
        ]);
        if (!active) return;
        setManager(current);
        setCity(cities[0] || null);
        setIgr(igrs[0] || null);
        setNews(items);
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
    return () => { active = false; };
  }, [router]);

  const handleNewsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingNews(true);
    setError("");
    setNotice("");
    const values: ManagerNewsInput = {
      title: newsFields.title.trim(),
      slug: slugify(newsFields.title),
      summary: newsFields.summary.trim(),
      content: newsFields.content,
      published_at: new Date(newsFields.publishedAt).toISOString(),
      is_featured: newsFields.isFeatured,
      category: newsFields.category.trim(),
      author: newsFields.author.trim(),
      source_url: newsFields.sourceUrl.trim(),
      tags: newsFields.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      ...(editingNews ? { cidade: editingNews.cidade, igr: editingNews.igr } : {}),
    };
    try {
      await saveManagerNews(values, editingNews?.id);
      await loadNews();
      setEditingNews(null);
      setNewsFields(defaultNewsFields());
      setNotice(editingNews ? "Notícia atualizada." : "Notícia cadastrada.");
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

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <Header
        imageSrc="/images/sul_de_minas_bg.jpg"
        imageAlt="Área de gestão do Observatório Regional do Turismo"
      />
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-slate-600">
            <LoaderCircle className="h-5 w-5 animate-spin text-[#359830]" />
            Carregando sua área de gestão...
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col justify-between gap-4 rounded-2xl bg-[#1D5C1B] p-5 text-white sm:flex-row sm:items-center sm:p-7">
              <div>
                <p className="text-sm font-semibold text-emerald-100">Área restrita</p>
                <h1 className="mt-1 text-2xl font-extrabold">Olá, {manager?.username}</h1>
                <p className="mt-1 text-sm text-white/80">
                  {manager?.scopes.map((scope) => `${scope.type === "cidade" ? "Cidade" : "IGR"}: ${scope.name}`).join(" · ")}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/30 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 sm:self-auto"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>

            {error && (
              <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="mb-10 grid gap-5 lg:grid-cols-2">
              {city && (
                <ManagerEntityEditor
                  entity={city}
                  label={`a cidade de ${city.name}`}
                  endpoint="cidades"
                  onSaved={setCity}
                />
              )}
              {igr && (
                <ManagerEntityEditor
                  entity={igr}
                  label={igr.name}
                  endpoint="igrs"
                  onSaved={setIgr}
                />
              )}
            </div>

            <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
                  <Newspaper className="h-5 w-5 text-[#359830]" />
                  Notícias
                </h2>
                <p className="mt-1 text-sm text-slate-600">Cadastre e edite notícias da sua cidade ou IGR.</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-[#1D5C1B]">
                {news.length} {news.length === 1 ? "notícia" : "notícias"}
              </span>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
              <form onSubmit={handleNewsSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-slate-900">
                    {editingNews ? "Editar notícia" : "Cadastrar notícia"}
                  </h3>
                  {editingNews && (
                    <button type="button" onClick={clearNewsForm} className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                      Cancelar edição
                    </button>
                  )}
                </div>
                <label className="block text-sm font-semibold text-slate-700">
                  Título
                  <input
                    required
                    maxLength={255}
                    value={newsFields.title}
                    onChange={(event) => setNewsFields((current) => ({ ...current, title: event.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Resumo
                  <textarea
                    rows={3}
                    value={newsFields.summary}
                    onChange={(event) => setNewsFields((current) => ({ ...current, summary: event.target.value }))}
                    className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
                  />
                </label>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Conteúdo</label>
                  <ManagerRichTextEditor
                    label="Conteúdo da notícia"
                    value={newsFields.content}
                    onChange={(content) => setNewsFields((current) => ({ ...current, content }))}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Data de publicação
                    <input
                      required
                      type="datetime-local"
                      value={newsFields.publishedAt}
                      onChange={(event) => setNewsFields((current) => ({ ...current, publishedAt: event.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Categoria
                    <input
                      maxLength={100}
                      value={newsFields.category}
                      onChange={(event) => setNewsFields((current) => ({ ...current, category: event.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Autor
                    <input
                      maxLength={255}
                      value={newsFields.author}
                      onChange={(event) => setNewsFields((current) => ({ ...current, author: event.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Link da fonte
                    <input
                      type="url"
                      maxLength={500}
                      value={newsFields.sourceUrl}
                      onChange={(event) => setNewsFields((current) => ({ ...current, sourceUrl: event.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
                    />
                  </label>
                </div>
                <label className="block text-sm font-semibold text-slate-700">
                  Tags separadas por vírgula
                  <input
                    value={newsFields.tags}
                    onChange={(event) => setNewsFields((current) => ({ ...current, tags: event.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
                  />
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newsFields.isFeatured}
                    onChange={(event) => setNewsFields((current) => ({ ...current, isFeatured: event.target.checked }))}
                    className="h-4 w-4 accent-[#1D5C1B]"
                  />
                  Marcar como destaque
                </label>
                {notice && <p role="status" className="text-sm font-semibold text-emerald-800">{notice}</p>}
                <button
                  type="submit"
                  disabled={savingNews}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D5C1B] px-4 py-3 font-bold text-white transition hover:bg-[#287524] disabled:opacity-60"
                >
                  {savingNews
                    ? <LoaderCircle className="h-4 w-4 animate-spin" />
                    : editingNews ? <Save className="h-4 w-4" /> : <CirclePlus className="h-4 w-4" />}
                  {savingNews ? "Salvando..." : editingNews ? "Salvar notícia" : "Publicar notícia"}
                </button>
              </form>

              <section className="space-y-3">
                <h3 className="font-bold text-slate-900">Notícias cadastradas</h3>
                {news.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center text-sm text-slate-600">
                    Nenhuma notícia cadastrada para sua área.
                  </div>
                ) : (
                  news.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-bold leading-snug text-slate-900">{item.title}</h4>
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(item.published_at))}
                            {item.is_featured && <span className="ml-1 rounded-full bg-red-50 px-2 py-0.5 font-bold text-red-700">Destaque</span>}
                          </p>
                        </div>
                        <details className="relative shrink-0">
                          <summary aria-label={`Ações para ${item.title}`} className="flex cursor-pointer list-none items-center gap-1 rounded-lg p-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                            Ações <ChevronDown className="h-4 w-4" />
                          </summary>
                          <div className="absolute right-0 z-10 mt-1 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                            <button type="button" onClick={() => startEditingNews(item)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100">
                              <Pencil className="h-4 w-4" /> Editar
                            </button>
                            <button type="button" onClick={() => removeNews(item)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" /> Excluir
                            </button>
                          </div>
                        </details>
                      </div>
                      {item.summary && <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{item.summary}</p>}
                    </article>
                  ))
                )}
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
