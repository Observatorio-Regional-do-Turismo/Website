"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Building2,
  CirclePlus,
  Layers,
  LoaderCircle,
  Pencil,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { ManagerRichTextEditor } from "@/components/ManagerRichTextEditor";
import {
  AdminCidadeRecord,
  AdminEstadoRecord,
  AdminIGRRecord,
  deleteAdminCidade,
  deleteAdminIgr,
  getAdminCidades,
  getAdminEstados,
  getAdminIgrs,
  saveAdminCidade,
  saveAdminIgr,
} from "@/lib/manager-api";
import { slugify } from "@/lib/utils";

interface AdminEntitiesSectionProps {
  onCatalogChanged: () => void | Promise<void>;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
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

function parseOptionalCoord(raw: string): string | null {
  const cleaned = raw.trim().replace(",", ".");
  return cleaned ? cleaned : null;
}

export function AdminEntitiesSection({
  onCatalogChanged,
  onNotice,
  onError,
}: AdminEntitiesSectionProps) {
  const [subTab, setSubTab] = useState<"cidades" | "igrs">("cidades");
  const [estados, setEstados] = useState<AdminEstadoRecord[]>([]);
  const [cidades, setCidades] = useState<AdminCidadeRecord[]>([]);
  const [igrs, setIgrs] = useState<AdminIGRRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado do formulário de IGR
  const [editingIgr, setEditingIgr] = useState<AdminIGRRecord | null>(null);
  const [igrName, setIgrName] = useState("");
  const [igrSlug, setIgrSlug] = useState("");
  const [igrDescription, setIgrDescription] = useState("");
  const [savingIgr, setSavingIgr] = useState(false);
  const [igrSearch, setIgrSearch] = useState("");

  // Estado do formulário de Cidade
  const [editingCidade, setEditingCidade] = useState<AdminCidadeRecord | null>(null);
  const [cityName, setCityName] = useState("");
  const [citySlug, setCitySlug] = useState("");
  const [cityStateId, setCityStateId] = useState("");
  const [cityIbge, setCityIbge] = useState("");
  const [cityLat, setCityLat] = useState("");
  const [cityLon, setCityLon] = useState("");
  const [cityDescription, setCityDescription] = useState("");
  const [cityIgrIds, setCityIgrIds] = useState<number[]>([]);
  const [savingCidade, setSavingCidade] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [estadoList, cidadeList, igrList] = await Promise.all([
        getAdminEstados(),
        getAdminCidades(),
        getAdminIgrs(),
      ]);
      setEstados(estadoList);
      setCidades(cidadeList);
      setIgrs(igrList);
      setCityStateId((prev) => {
        if (prev) return prev;
        const mg = estadoList.find((e) => e.abbreviation.toUpperCase() === "MG");
        return String(mg?.id ?? estadoList[0]?.id ?? "");
      });
    } catch (err) {
      onError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetIgrForm = () => {
    setEditingIgr(null);
    setIgrName("");
    setIgrSlug("");
    setIgrDescription("");
  };

  const resetCidadeForm = () => {
    setEditingCidade(null);
    setCityName("");
    setCitySlug("");
    const mg = estados.find((e) => e.abbreviation.toUpperCase() === "MG");
    setCityStateId(String(mg?.id ?? estados[0]?.id ?? ""));
    setCityIbge("");
    setCityLat("");
    setCityLon("");
    setCityDescription("");
    setCityIgrIds([]);
  };

  const handleSaveIgr = async (e: FormEvent) => {
    e.preventDefault();
    setSavingIgr(true);
    onError("");
    onNotice("");
    try {
      const saved = await saveAdminIgr(
        {
          name: igrName.trim(),
          slug: igrSlug.trim() || slugify(igrName.trim()),
          description: igrDescription,
        },
        editingIgr?.id,
      );
      await loadData();
      await onCatalogChanged();
      onNotice(
        editingIgr ? `IGR "${saved.name}" atualizada.` : `IGR "${saved.name}" criada com sucesso.`,
      );
      resetIgrForm();
    } catch (err) {
      onError(extractApiError(err));
    } finally {
      setSavingIgr(false);
    }
  };

  const handleDeleteIgr = async (item: AdminIGRRecord) => {
    if (!window.confirm(`Excluir a IGR "${item.name}"?`)) return;
    onError("");
    onNotice("");
    try {
      await deleteAdminIgr(item.id);
      if (editingIgr?.id === item.id) resetIgrForm();
      await loadData();
      await onCatalogChanged();
      onNotice(`IGR "${item.name}" removida.`);
    } catch (err) {
      onError(extractApiError(err));
    }
  };

  const handleSaveCidade = async (e: FormEvent) => {
    e.preventDefault();
    if (!cityStateId) {
      onError("Selecione o estado da cidade.");
      return;
    }
    setSavingCidade(true);
    onError("");
    onNotice("");
    try {
      const saved = await saveAdminCidade(
        {
          name: cityName.trim(),
          slug: citySlug.trim() || slugify(cityName.trim()),
          state: Number(cityStateId),
          ibge_code: cityIbge.trim() || null,
          latitude: parseOptionalCoord(cityLat),
          longitude: parseOptionalCoord(cityLon),
          description: cityDescription,
          igrs: cityIgrIds,
        },
        editingCidade?.id,
      );
      await loadData();
      await onCatalogChanged();
      onNotice(
        editingCidade
          ? `Cidade "${saved.name}" atualizada.`
          : `Cidade "${saved.name}" criada com sucesso.`,
      );
      resetCidadeForm();
    } catch (err) {
      onError(extractApiError(err));
    } finally {
      setSavingCidade(false);
    }
  };

  const handleDeleteCidade = async (item: AdminCidadeRecord) => {
    if (!window.confirm(`Excluir definitivamente a cidade "${item.name}"?`)) return;
    onError("");
    onNotice("");
    try {
      await deleteAdminCidade(item.id);
      if (editingCidade?.id === item.id) resetCidadeForm();
      await loadData();
      await onCatalogChanged();
      onNotice(`Cidade "${item.name}" removida.`);
    } catch (err) {
      onError(extractApiError(err));
    }
  };

  const toggleCityIgr = (igrId: number) => {
    setCityIgrIds((prev) =>
      prev.includes(igrId) ? prev.filter((id) => id !== igrId) : [...prev, igrId],
    );
  };

  const filteredIgrs = useMemo(() => {
    const q = igrSearch.trim().toLowerCase();
    if (!q) return igrs;
    return igrs.filter((i) => i.name.toLowerCase().includes(q) || i.slug.toLowerCase().includes(q));
  }, [igrs, igrSearch]);

  const filteredCidades = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    if (!q) return cidades;
    return cidades.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.ibge_code || "").includes(q) ||
        c.igrs_info.some((igr) => igr.name.toLowerCase().includes(q)),
    );
  }, [cidades, citySearch]);

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center gap-3 text-slate-600">
        <LoaderCircle className="h-5 w-5 animate-spin text-[#359830]" />
        Carregando cadastro territorial...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSubTab("cidades")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition cursor-pointer ${
            subTab === "cidades"
              ? "bg-[#1D5C1B] text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Cidades ({cidades.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab("igrs")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition cursor-pointer ${
            subTab === "igrs"
              ? "bg-[#1D5C1B] text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          <Layers className="h-4 w-4" />
          IGRs ({igrs.length})
        </button>
      </div>

      {subTab === "cidades" ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,1.2fr)]">
          <form
            onSubmit={handleSaveCidade}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h2 className="flex items-center gap-2 font-bold text-slate-900">
                <CirclePlus className="h-5 w-5 text-[#1D5C1B]" />
                {editingCidade ? `Editar cidade: ${editingCidade.name}` : "Cadastrar nova cidade"}
              </h2>
              {editingCidade && (
                <button
                  type="button"
                  onClick={resetCidadeForm}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Nova cidade
                </button>
              )}
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-slate-700">
                Nome da cidade
                <input
                  required
                  maxLength={255}
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Slug (opcional)
                <input
                  maxLength={255}
                  placeholder="Gerado automaticamente"
                  value={citySlug}
                  onChange={(e) => setCitySlug(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-[#359830]"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Estado
                <select
                  required
                  value={cityStateId}
                  onChange={(e) => setCityStateId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#359830]"
                >
                  <option value="">Selecione...</option>
                  {estados.map((est) => (
                    <option key={est.id} value={String(est.id)}>
                      {est.name} ({est.abbreviation})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Código IBGE (7 dígitos, opcional)
                <input
                  maxLength={7}
                  pattern="\d{7}"
                  placeholder="Ex.: 3151800"
                  value={cityIbge}
                  onChange={(e) => setCityIbge(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-[#359830]"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Latitude (opcional)
                <input
                  placeholder="-21.787800"
                  value={cityLat}
                  onChange={(e) => setCityLat(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Longitude (opcional)
                <input
                  placeholder="-46.561300"
                  value={cityLon}
                  onChange={(e) => setCityLon(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                />
              </label>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                IGRs vinculadas (uma cidade pode participar de múltiplas IGRs)
              </span>
              {igrs.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhuma IGR cadastrada ainda.</p>
              ) : (
                <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2.5 grid gap-1.5 sm:grid-cols-2">
                  {igrs.map((igr) => (
                    <label
                      key={igr.id}
                      className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={cityIgrIds.includes(igr.id)}
                        onChange={() => toggleCityIgr(igr.id)}
                        className="h-4 w-4 accent-[#1D5C1B]"
                      />
                      <span className="truncate">{igr.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Descrição institucional (opcional)
              </label>
              <ManagerRichTextEditor
                label="Descrição da cidade"
                value={cityDescription}
                onChange={setCityDescription}
              />
            </div>

            <button
              type="submit"
              disabled={savingCidade}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D5C1B] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#287524] disabled:opacity-60 cursor-pointer"
            >
              {savingCidade ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editingCidade ? "Salvar alterações da cidade" : "Criar nova cidade"}
            </button>
          </form>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900">
                Cidades Cadastradas ({filteredCidades.length})
              </h3>
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nome, código IBGE ou IGR..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-[#359830]"
                />
              </div>
            </div>

            <div className="max-h-[42rem] space-y-2.5 overflow-y-auto pr-1">
              {filteredCidades.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900">{item.name}</h4>
                      <span className="text-xs text-slate-500">{item.state_name}</span>
                      {item.ibge_code && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                          IBGE: {item.ibge_code}
                        </span>
                      )}
                    </div>
                    {item.igrs_info.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {item.igrs_info.map((igr) => (
                          <span
                            key={igr.id}
                            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800"
                          >
                            <Layers className="h-3 w-3" />
                            {igr.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCidade(item);
                        setCityName(item.name);
                        setCitySlug(item.slug);
                        setCityStateId(String(item.state));
                        setCityIbge(item.ibge_code || "");
                        setCityLat(item.latitude !== null ? String(item.latitude) : "");
                        setCityLon(item.longitude !== null ? String(item.longitude) : "");
                        setCityDescription(item.description || "");
                        setCityIgrIds(item.igrs || []);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCidade(item)}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Excluir cidade"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,1.2fr)]">
          <form
            onSubmit={handleSaveIgr}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h2 className="flex items-center gap-2 font-bold text-slate-900">
                <CirclePlus className="h-5 w-5 text-[#1D5C1B]" />
                {editingIgr ? `Editar IGR: ${editingIgr.name}` : "Cadastrar nova IGR"}
              </h2>
              {editingIgr && (
                <button
                  type="button"
                  onClick={resetIgrForm}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Nova IGR
                </button>
              )}
            </div>

            <label className="block text-xs font-semibold text-slate-700">
              Nome da IGR
              <input
                required
                maxLength={255}
                value={igrName}
                onChange={(e) => setIgrName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-700">
              Slug (opcional)
              <input
                maxLength={255}
                placeholder="Gerado automaticamente"
                value={igrSlug}
                onChange={(e) => setIgrSlug(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-[#359830]"
              />
            </label>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Descrição institucional (opcional)
              </label>
              <ManagerRichTextEditor
                label="Descrição da IGR"
                value={igrDescription}
                onChange={setIgrDescription}
              />
            </div>

            <button
              type="submit"
              disabled={savingIgr}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D5C1B] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#287524] disabled:opacity-60 cursor-pointer"
            >
              {savingIgr ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editingIgr ? "Salvar alterações da IGR" : "Criar nova IGR"}
            </button>
          </form>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900">IGRs Cadastradas ({filteredIgrs.length})</h3>
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar IGR por nome ou slug..."
                  value={igrSearch}
                  onChange={(e) => setIgrSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-[#359830]"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              {filteredIgrs.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <h4 className="font-bold text-slate-900">{item.name}</h4>
                    <p className="text-xs text-slate-500">
                      <span className="font-mono">{item.slug}</span> • {item.cidades_count}{" "}
                      {item.cidades_count === 1 ? "cidade vinculada" : "cidades vinculadas"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingIgr(item);
                        setIgrName(item.name);
                        setIgrSlug(item.slug);
                        setIgrDescription(item.description || "");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteIgr(item)}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Excluir IGR"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
