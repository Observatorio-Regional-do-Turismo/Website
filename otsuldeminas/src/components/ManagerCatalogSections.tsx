"use client";

import { FormEvent, useState } from "react";
import {
  CalendarDays,
  CirclePlus,
  Compass,
  LoaderCircle,
  MapPin,
  Pencil,
  Save,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { ManagerImageManager } from "@/components/ManagerImageManager";
import { ManagerRichTextEditor } from "@/components/ManagerRichTextEditor";
import {
  deleteManagerEvent,
  deleteManagerLocal,
  deleteManagerPonto,
  ManagerCityOption,
  ManagerEvento,
  ManagerLocalGeo,
  ManagerPontoTuristico,
  saveManagerEvent,
  saveManagerLocal,
  saveManagerPonto,
} from "@/lib/manager-api";
import { slugify } from "@/lib/utils";

function localDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

const LOCAL_CATEGORIES = [
  "Alimentação",
  "Hospedagem",
  "Agência e Operadores",
  "Entretenimento",
  "Transportes",
  "Comércio e Serviços",
];

// EVENTOS ============================================================================================================
interface ManagerEventsSectionProps {
  cities: ManagerCityOption[];
  eventos: ManagerEvento[];
  onChange: (items: ManagerEvento[]) => void;
  onError: (msg: string) => void;
}

export function ManagerEventsSection({
  cities,
  eventos,
  onChange,
  onError,
}: ManagerEventsSectionProps) {
  const defaultCityId = cities[0]?.id ? String(cities[0].id) : "";
  const [editing, setEditing] = useState<ManagerEvento | null>(null);
  const [name, setName] = useState("");
  const [cidadeId, setCidadeId] = useState(defaultCityId);
  const [startDate, setStartDate] = useState(() => localDateTime(new Date().toISOString()));
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [popularity, setPopularity] = useState("50");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const resetForm = () => {
    setEditing(null);
    setName("");
    setCidadeId(defaultCityId);
    setStartDate(localDateTime(new Date().toISOString()));
    setEndDate("");
    setDescription("");
    setIsFeatured(false);
    setPopularity("50");
    setLatitude("");
    setLongitude("");
  };

  const startEdit = (item: ManagerEvento) => {
    setEditing(item);
    setName(item.name);
    setCidadeId(String(item.cidade));
    setStartDate(localDateTime(item.start_date));
    setEndDate(item.end_date ? localDateTime(item.end_date) : "");
    setDescription(item.description || "");
    setIsFeatured(item.is_featured);
    setPopularity(String(item.popularity ?? 0));
    setLatitude(item.latitude !== null && item.latitude !== undefined ? String(item.latitude) : "");
    setLongitude(
      item.longitude !== null && item.longitude !== undefined ? String(item.longitude) : "",
    );
    setStatus("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus("");
    onError("");

    try {
      const saved = await saveManagerEvent(
        {
          name: name.trim(),
          slug: editing?.slug || slugify(name),
          description,
          start_date: new Date(startDate).toISOString(),
          end_date: endDate ? new Date(endDate).toISOString() : null,
          is_featured: isFeatured,
          popularity: Math.max(0, Number(popularity) || 0),
          latitude: parseOptionalNumber(latitude),
          longitude: parseOptionalNumber(longitude),
          cidade: Number(cidadeId || defaultCityId),
        },
        editing?.id,
      );

      const next = editing
        ? eventos.map((ev) => (ev.id === saved.id ? saved : ev))
        : [saved, ...eventos];
      onChange(next);
      setEditing(saved);
      setStatus(
        editing ? "Evento atualizado." : "Evento cadastrado. Você já pode anexar fotos abaixo.",
      );
    } catch {
      onError("Não foi possível salvar o evento. Verifique os campos informados.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: ManagerEvento) => {
    if (!window.confirm(`Excluir o evento "${item.name}"?`)) return;
    try {
      await deleteManagerEvent(item.id);
      onChange(eventos.filter((ev) => ev.id !== item.id));
      if (editing?.id === item.id) resetForm();
      setStatus("Evento excluído.");
    } catch {
      onError("Erro ao excluir evento.");
    }
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
      <div className="space-y-4">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900">
              {editing ? `Editar evento: ${editing.name}` : "Cadastrar evento"}
            </h3>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Novo evento
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Nome do evento
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830]"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Município
              <select
                required
                value={cidadeId}
                onChange={(e) => setCidadeId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-[#359830]"
              >
                {cities.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Início
              <input
                required
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#359830]"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Término (opcional)
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#359830]"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Latitude (opcional)
              <input
                type="text"
                placeholder="-21.787800"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#359830]"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Longitude (opcional)
              <input
                type="text"
                placeholder="-46.561300"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#359830]"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 items-center">
            <label className="block text-sm font-semibold text-slate-700">
              Relevância / Popularidade (0–100)
              <input
                type="number"
                min={0}
                max={1000}
                value={popularity}
                onChange={(e) => setPopularity(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-[#359830]"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 pt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 accent-[#1D5C1B]"
              />
              Destacar evento na vitrine
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Descrição</label>
            <ManagerRichTextEditor
              label="Descrição do evento"
              value={description}
              onChange={setDescription}
            />
          </div>

          {status && <p className="text-sm font-semibold text-emerald-800">{status}</p>}

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D5C1B] px-4 py-3 font-bold text-white transition hover:bg-[#287524] disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : editing ? (
              <Save className="h-4 w-4" />
            ) : (
              <CirclePlus className="h-4 w-4" />
            )}
            {editing ? "Salvar alterações do evento" : "Cadastrar evento"}
          </button>
        </form>

        {editing && (
          <ManagerImageManager
            targetType="evento"
            targetId={editing.id}
            images={editing.imagens || []}
            onChanged={(imgs) => {
              const updated = { ...editing, imagens: imgs };
              setEditing(updated);
              onChange(eventos.map((ev) => (ev.id === editing.id ? updated : ev)));
            }}
            title={`Fotos de "${editing.name}"`}
          />
        )}
      </div>

      <section className="space-y-3">
        <h3 className="font-bold text-slate-900">Eventos cadastrados ({eventos.length})</h3>
        {eventos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center text-sm text-slate-600">
            Nenhum evento cadastrado para sua gestão.
          </div>
        ) : (
          eventos.map((ev) => (
            <article
              key={ev.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900">{ev.name}</h4>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5 text-[#359830]" />
                      {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
                        new Date(ev.start_date),
                      )}
                    </span>
                    {ev.cidade_name && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {ev.cidade_name}
                      </span>
                    )}
                    <span>• {ev.imagens?.length ?? 0} fotos</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(ev)}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ev)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

// ATRATIVOS TURÍSTICOS ===============================================================================================
interface ManagerPontosSectionProps {
  cities: ManagerCityOption[];
  pontos: ManagerPontoTuristico[];
  onChange: (items: ManagerPontoTuristico[]) => void;
  onError: (msg: string) => void;
}

export function ManagerPontosSection({
  cities,
  pontos,
  onChange,
  onError,
}: ManagerPontosSectionProps) {
  const defaultCityId = cities[0]?.id ? String(cities[0].id) : "";
  const [editing, setEditing] = useState<ManagerPontoTuristico | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [cidadeId, setCidadeId] = useState(defaultCityId);
  const [description, setDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [popularity, setPopularity] = useState("50");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const resetForm = () => {
    setEditing(null);
    setName("");
    setCategory("");
    setCidadeId(defaultCityId);
    setDescription("");
    setIsFeatured(false);
    setPopularity("50");
    setLatitude("");
    setLongitude("");
  };

  const startEdit = (item: ManagerPontoTuristico) => {
    setEditing(item);
    setName(item.name);
    setCategory(item.category || "");
    setCidadeId(String(item.cidade));
    setDescription(item.description || "");
    setIsFeatured(Boolean(item.is_featured));
    setPopularity(String(item.popularity ?? 0));
    setLatitude(item.latitude !== null && item.latitude !== undefined ? String(item.latitude) : "");
    setLongitude(
      item.longitude !== null && item.longitude !== undefined ? String(item.longitude) : "",
    );
    setStatus("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus("");
    onError("");

    try {
      const saved = await saveManagerPonto(
        {
          name: name.trim(),
          slug: editing?.slug || slugify(name),
          category: category.trim(),
          description,
          is_featured: isFeatured,
          popularity: Math.max(0, Number(popularity) || 0),
          latitude: parseOptionalNumber(latitude),
          longitude: parseOptionalNumber(longitude),
          cidade: Number(cidadeId || defaultCityId),
        },
        editing?.id,
      );
      const next = editing
        ? pontos.map((p) => (p.id === saved.id ? saved : p))
        : [saved, ...pontos];
      onChange(next);
      setEditing(saved);
      setStatus(editing ? "Atrativo atualizado." : "Atrativo cadastrado. Adicione fotos abaixo.");
    } catch {
      onError("Não foi possível salvar o ponto turístico.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: ManagerPontoTuristico) => {
    if (!window.confirm(`Excluir o atrativo "${item.name}"?`)) return;
    try {
      await deleteManagerPonto(item.id);
      onChange(pontos.filter((p) => p.id !== item.id));
      if (editing?.id === item.id) resetForm();
      setStatus("Atrativo excluído.");
    } catch {
      onError("Erro ao excluir ponto turístico.");
    }
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
      <div className="space-y-4">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900">
              {editing ? `Editar atrativo: ${editing.name}` : "Cadastrar ponto turístico"}
            </h3>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Novo atrativo
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Nome do atrativo
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830]"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Município
              <select
                required
                value={cidadeId}
                onChange={(e) => setCidadeId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-[#359830]"
              >
                {cities.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Categoria
              <input
                type="text"
                placeholder="Ex.: Parques, Mirantes, Patrimônio Histórico..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830]"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Relevância (0–100)
              <input
                type="number"
                min={0}
                max={1000}
                value={popularity}
                onChange={(e) => setPopularity(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#359830]"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Latitude (para aparecer no mapa)
              <input
                type="text"
                placeholder="-21.766700"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#359830]"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Longitude (para aparecer no mapa)
              <input
                type="text"
                placeholder="-46.564900"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#359830]"
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 accent-[#1D5C1B]"
            />
            Exibir em &ldquo;Principais Atrativos&rdquo;
          </label>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Descrição</label>
            <ManagerRichTextEditor
              label="Descrição do atrativo"
              value={description}
              onChange={setDescription}
            />
          </div>

          {status && <p className="text-sm font-semibold text-emerald-800">{status}</p>}

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D5C1B] px-4 py-3 font-bold text-white transition hover:bg-[#287524] disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : editing ? (
              <Save className="h-4 w-4" />
            ) : (
              <CirclePlus className="h-4 w-4" />
            )}
            {editing ? "Salvar ponto turístico" : "Cadastrar ponto turístico"}
          </button>
        </form>

        {editing && (
          <ManagerImageManager
            targetType="ponto_turistico"
            targetId={editing.id}
            images={editing.imagens || []}
            onChanged={(imgs) => {
              const updated = { ...editing, imagens: imgs };
              setEditing(updated);
              onChange(pontos.map((p) => (p.id === editing.id ? updated : p)));
            }}
            title={`Fotos de "${editing.name}"`}
          />
        )}
      </div>

      <section className="space-y-3">
        <h3 className="font-bold text-slate-900">Atrativos cadastrados ({pontos.length})</h3>
        {pontos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center text-sm text-slate-600">
            Nenhum ponto turístico cadastrado.
          </div>
        ) : (
          pontos.map((ponto) => (
            <article
              key={ponto.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900">{ponto.name}</h4>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Compass className="h-3.5 w-3.5 text-[#359830]" />
                      {ponto.category || "Sem categoria"}
                    </span>
                    {ponto.cidade_name && <span>• {ponto.cidade_name}</span>}
                    {ponto.is_featured && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-800">
                        Destaque
                      </span>
                    )}
                    <span>• {ponto.imagens?.length ?? 0} fotos</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(ponto)}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ponto)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

// RESTAURANTES & LOCAIS GEORREFERENCIADOS ============================================================================
interface ManagerLocaisSectionProps {
  cities: ManagerCityOption[];
  locais: ManagerLocalGeo[];
  onChange: (items: ManagerLocalGeo[]) => void;
  onError: (msg: string) => void;
}

export function ManagerLocaisSection({
  cities,
  locais,
  onChange,
  onError,
}: ManagerLocaisSectionProps) {
  const defaultCityId = cities[0]?.id ? String(cities[0].id) : "";
  const [editing, setEditing] = useState<ManagerLocalGeo | null>(null);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("Alimentação");
  const [cidadeId, setCidadeId] = useState(defaultCityId);
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const resetForm = () => {
    setEditing(null);
    setNome("");
    setCategoria("Alimentação");
    setCidadeId(defaultCityId);
    setEndereco("");
    setTelefone("");
    setCnpj("");
    setLatitude("");
    setLongitude("");
  };

  const startEdit = (item: ManagerLocalGeo) => {
    setEditing(item);
    setNome(item.nome);
    setCategoria(item.categoria);
    setCidadeId(String(item.cidade));
    setEndereco(item.endereco || "");
    setTelefone(item.telefone || "");
    setCnpj(item.cnpj_completo || "");
    setLatitude(String(item.latitude));
    setLongitude(String(item.longitude));
    setStatus("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus("");
    onError("");

    const latNum = parseOptionalNumber(latitude);
    const lonNum = parseOptionalNumber(longitude);
    if (latNum === null || lonNum === null) {
      setSaving(false);
      onError("Informe latitude e longitude válidas para posicionar o estabelecimento no mapa.");
      return;
    }

    try {
      const saved = await saveManagerLocal(
        {
          nome: nome.trim(),
          categoria: categoria.trim(),
          endereco: endereco.trim(),
          telefone: telefone.trim(),
          cnpj_completo: cnpj.trim() || null,
          cidade: Number(cidadeId || defaultCityId),
          latitude: latNum,
          longitude: lonNum,
        },
        editing?.id,
      );
      const next = editing
        ? locais.map((loc) => (loc.id === saved.id ? saved : loc))
        : [saved, ...locais];
      onChange(next);
      setEditing(saved);
      setStatus(
        editing
          ? "Estabelecimento atualizado."
          : "Estabelecimento cadastrado no mapa. Você já pode anexar imagens abaixo.",
      );
    } catch {
      onError("Não foi possível salvar o estabelecimento. Verifique CNPJ e coordenadas.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: ManagerLocalGeo) => {
    if (!window.confirm(`Excluir o estabelecimento "${item.nome}"?`)) return;
    try {
      await deleteManagerLocal(item.id);
      onChange(locais.filter((loc) => loc.id !== item.id));
      if (editing?.id === item.id) resetForm();
      setStatus("Estabelecimento excluído.");
    } catch {
      onError("Erro ao excluir estabelecimento.");
    }
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
      <div className="space-y-4">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900">
              {editing
                ? `Editar local: ${editing.nome}`
                : "Cadastrar restaurante, hotel ou serviço turístico"}
            </h3>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancelar edição
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Nome do estabelecimento
              <input
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830]"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Categoria
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-[#359830]"
              >
                {LOCAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Município
              <select
                required
                value={cidadeId}
                onChange={(e) => setCidadeId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-[#359830]"
              >
                {cities.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Telefone
              <input
                type="text"
                placeholder="(35) 3722-0000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830]"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
              Endereço completo
              <input
                type="text"
                placeholder="Rua, número, bairro"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830]"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Latitude
              <input
                required
                type="text"
                placeholder="-21.787800"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#359830]"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Longitude
              <input
                required
                type="text"
                placeholder="-46.561300"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#359830]"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
              CNPJ (14 dígitos, opcional)
              <input
                type="text"
                maxLength={14}
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#359830]"
              />
            </label>
          </div>

          {status && <p className="text-sm font-semibold text-emerald-800">{status}</p>}

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D5C1B] px-4 py-3 font-bold text-white transition hover:bg-[#287524] disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : editing ? (
              <Save className="h-4 w-4" />
            ) : (
              <CirclePlus className="h-4 w-4" />
            )}
            {editing ? "Salvar estabelecimento" : "Cadastrar local"}
          </button>
        </form>

        {editing && (
          <ManagerImageManager
            targetType="local"
            targetId={editing.id}
            images={editing.imagens || []}
            title={`Fotos de ${editing.nome}`}
            onChanged={(imgs) => {
              const updated = { ...editing, imagens: imgs };
              setEditing(updated);
              onChange(locais.map((loc) => (loc.id === updated.id ? updated : loc)));
            }}
          />
        )}
      </div>

      <section className="space-y-3">
        <h3 className="font-bold text-slate-900">Locais cadastrados ({locais.length})</h3>
        {locais.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center text-sm text-slate-600">
            Nenhum estabelecimento cadastrado.
          </div>
        ) : (
          locais.map((loc) => (
            <article
              key={loc.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900">{loc.nome}</h4>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <UtensilsCrossed className="h-3.5 w-3.5 text-[#359830]" />
                      {loc.categoria}
                    </span>
                    {loc.cidade_name && <span>• {loc.cidade_name}</span>}
                    <span>• {loc.imagens?.length ?? 0} fotos</span>
                  </p>
                  {loc.endereco && <p className="mt-1 text-xs text-slate-600">{loc.endereco}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(loc)}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(loc)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
