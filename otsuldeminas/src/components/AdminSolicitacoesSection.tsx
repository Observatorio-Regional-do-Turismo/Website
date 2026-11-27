"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  LoaderCircle,
  Mail,
  Phone,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import { PaginationControls } from "@/components/PaginationControls";
import {
  AdminCidadeRecord,
  AdminIGRRecord,
  AdminSolicitacaoRecord,
  AdminSolicitacaoSummary,
  approveAdminSolicitacao,
  denyAdminSolicitacao,
  getAdminSolicitacaoDocumentoUrl,
  getAdminSolicitacoes,
  updateAdminSolicitacao,
} from "@/lib/manager-api";
import { normalizeText } from "@/lib/utils";

const PAGE_SIZE = 20;

interface AdminSolicitacoesSectionProps {
  cities: AdminCidadeRecord[];
  igrs: AdminIGRRecord[];
  onApproved: () => void | Promise<void>;
  onSummaryChange?: (summary: AdminSolicitacaoSummary) => void;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}

type StatusFilter = "pendente" | "aprovada" | "recusada" | "todas";

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

function generateStrongPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "@#$%&*!";
  const all = upper + lower + digits + symbols;
  const pick = (pool: string) => pool[Math.floor(Math.random() * pool.length)];
  const chars = [
    pick(upper),
    pick(upper),
    pick(lower),
    pick(lower),
    pick(digits),
    pick(digits),
    pick(symbols),
  ];
  while (chars.length < 12) {
    chars.push(pick(all));
  }
  return chars.sort(() => Math.random() - 0.5).join("");
}

function suggestUsername(req: AdminSolicitacaoRecord): string {
  if (req.username_sugerido?.trim()) return req.username_sugerido.trim();
  const baseEmail = (req.email_cadastro || req.email || "").split("@")[0];
  const raw = baseEmail || req.nome || "gestor";
  return normalizeText(raw)
    .replace(/[^a-z0-9._-]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 40);
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function formatDateTimePt(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function AdminSolicitacoesSection({
  cities,
  igrs,
  onApproved,
  onSummaryChange,
  onNotice,
  onError,
}: AdminSolicitacoesSectionProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pendente");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdminSolicitacaoRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState<AdminSolicitacaoSummary>({
    pendente: 0,
    aprovada: 0,
    recusada: 0,
    total: 0,
  });

  const [selected, setSelected] = useState<AdminSolicitacaoRecord | null>(null);

  // Campos editáveis da solicitação & aprovação
  const [editNome, setEditNome] = useState("");
  const [editEmailContato, setEditEmailContato] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editCargo, setEditCargo] = useState("");
  const [editOrgao, setEditOrgao] = useState("");
  const [editJustificativa, setEditJustificativa] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [emailAcesso, setEmailAcesso] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cidadeId, setCidadeId] = useState("");
  const [igrId, setIgrId] = useState("");
  const [isStaff, setIsStaff] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [notificarRecusa, setNotificarRecusa] = useState(true);

  const [savingEdit, setSavingEdit] = useState(false);
  const [approving, setApproving] = useState(false);
  const [denying, setDenying] = useState(false);

  const populateEditor = useCallback(
    (req: AdminSolicitacaoRecord) => {
      setSelected(req);
      setEditNome(req.nome || "");
      setEditEmailContato(req.email || "");
      setEditTelefone(req.telefone || "");
      setEditCargo(req.cargo || "");
      setEditOrgao(req.orgao || "");
      setEditJustificativa(req.justificativa || "");

      setUsername(suggestUsername(req));
      setPassword(generateStrongPassword());
      setEmailAcesso(req.email_cadastro || req.email || "");
      const { first, last } = splitName(req.nome || "");
      setFirstName(first);
      setLastName(last);
      setIsStaff(false);
      setObservacao(req.observacao_analise || "");

      const normCity = normalizeText(req.cidade_nome || "");
      const matchedCity = normCity
        ? cities.find((c) => normalizeText(c.name) === normCity) ||
          cities.find((c) => normalizeText(c.name).includes(normCity))
        : undefined;
      setCidadeId(matchedCity ? String(matchedCity.id) : "");

      const normIgr = normalizeText(req.igr_nome || "");
      const matchedIgr = normIgr
        ? igrs.find((i) => normalizeText(i.name) === normIgr) ||
          igrs.find((i) => normalizeText(i.name).includes(normIgr))
        : undefined;
      setIgrId(matchedIgr ? String(matchedIgr.id) : "");
    },
    [cities, igrs],
  );

  const loadSolicitacoes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminSolicitacoes({
        status: statusFilter,
        search: searchTerm,
        page,
        page_size: PAGE_SIZE,
      });
      setItems(data.results || []);
      setTotalCount(data.count || 0);
      if (data.summary) {
        setSummary(data.summary);
        onSummaryChange?.(data.summary);
      }
    } catch (err) {
      onError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, page, onError, onSummaryChange]);

  useEffect(() => {
    const timer = window.setTimeout(loadSolicitacoes, 180);
    return () => window.clearTimeout(timer);
  }, [loadSolicitacoes]);

  const handleSaveDetails = async () => {
    if (!selected) return;
    setSavingEdit(true);
    onError("");
    onNotice("");
    try {
      const updated = await updateAdminSolicitacao(selected.id, {
        nome: editNome.trim(),
        email: editEmailContato.trim(),
        telefone: editTelefone.trim(),
        cargo: editCargo.trim(),
        orgao: editOrgao.trim(),
        username_sugerido: username.trim(),
        email_cadastro: emailAcesso.trim(),
        justificativa: editJustificativa.trim(),
        observacao_analise: observacao.trim(),
      });
      setSelected(updated);
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      onNotice(`Alterações salvas na solicitação ${updated.protocolo}.`);
    } catch (err) {
      onError(extractApiError(err));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleApprove = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    onError("");
    onNotice("");

    if (!cidadeId && !igrId) {
      onError("Selecione pelo menos um Município e/ou uma IGR para vincular ao novo gestor.");
      return;
    }
    if (password.length < 8) {
      onError("A senha inicial deve ter pelo menos 8 caracteres.");
      return;
    }

    setApproving(true);
    try {
      // Salva ajustes nos metadados da solicitação antes de aprovar
      await updateAdminSolicitacao(selected.id, {
        nome: editNome.trim(),
        email: editEmailContato.trim(),
        telefone: editTelefone.trim(),
        cargo: editCargo.trim(),
        orgao: editOrgao.trim(),
        username_sugerido: username.trim(),
        email_cadastro: emailAcesso.trim(),
        justificativa: editJustificativa.trim(),
        observacao_analise: observacao.trim(),
      });

      const res = await approveAdminSolicitacao(selected.id, {
        username: username.trim(),
        password,
        email: emailAcesso.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        cidade: cidadeId ? Number(cidadeId) : null,
        igr: igrId ? Number(igrId) : null,
        is_staff: isStaff,
        observacao_analise: observacao.trim(),
      });

      setSelected(res.solicitacao);
      await loadSolicitacoes();
      await onApproved();

      if (res.email_enviado) {
        onNotice(
          `Solicitação ${res.solicitacao.protocolo} aprovada! Conta "${res.gestor.username}" criada e e-mail com credenciais + tutorial enviado para ${emailAcesso.trim()}.`,
        );
      } else {
        onNotice(
          `Solicitação ${res.solicitacao.protocolo} aprovada e conta "${res.gestor.username}" criada, mas houve erro ao enviar o e-mail (${res.email_erro || "verifique SMTP"}).`,
        );
      }
    } catch (err) {
      onError(extractApiError(err));
    } finally {
      setApproving(false);
    }
  };

  const handleDeny = async () => {
    if (!selected) return;
    if (
      !window.confirm(`Confirmar a recusa da solicitação ${selected.protocolo} (${selected.nome})?`)
    ) {
      return;
    }
    setDenying(true);
    onError("");
    onNotice("");
    try {
      const res = await denyAdminSolicitacao(selected.id, {
        observacao_analise: observacao.trim(),
        notificar_solicitante: notificarRecusa,
      });
      setSelected(res.solicitacao);
      await loadSolicitacoes();
      onNotice(
        res.email_enviado
          ? `Solicitação ${res.solicitacao.protocolo} recusada e solicitante notificado por e-mail.`
          : `Solicitação ${res.solicitacao.protocolo} marcada como recusada.`,
      );
    } catch (err) {
      onError(extractApiError(err));
    } finally {
      setDenying(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Barra de filtros por status + busca */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            {(
              [
                { id: "pendente", label: "Pendentes", count: summary.pendente },
                { id: "aprovada", label: "Aprovadas", count: summary.aprovada },
                { id: "recusada", label: "Recusadas", count: summary.recusada },
                { id: "todas", label: "Todas", count: summary.total },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setStatusFilter(opt.id);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition cursor-pointer ${
                  statusFilter === opt.id
                    ? "bg-[#1D5C1B] text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    statusFilter === opt.id ? "bg-white/20 text-white" : "bg-white text-slate-600"
                  }`}
                >
                  {opt.count}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadSolicitacoes}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </button>
        </div>

        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por protocolo, nome, e-mail, login sugerido, cidade ou IGR..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-[#359830]"
          />
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,1.25fr)]">
        {/* Lista de Solicitações */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
              <LoaderCircle className="h-5 w-5 animate-spin text-[#359830]" />
              Carregando solicitações...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Nenhuma solicitação encontrada para este filtro.
            </div>
          ) : (
            <>
              {items.map((req) => {
                const isSelected = selected?.id === req.id;
                const badgeClass =
                  req.status === "aprovada"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : req.status === "recusada"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-amber-50 text-amber-800 border-amber-200";
                return (
                  <button
                    key={req.id}
                    type="button"
                    onClick={() => populateEditor(req)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#359830] bg-[#F4FCF4] shadow-md ring-2 ring-[#359830]/20"
                        : "border-slate-200 bg-white shadow-xs hover:border-[#359830]/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-[#1D5C1B]">
                            {req.protocolo}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${badgeClass}`}
                          >
                            {req.status_display}
                          </span>
                          {req.tem_documento && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                              <FileText className="h-3 w-3 text-[#359830]" />
                              Anexo
                            </span>
                          )}
                        </div>
                        <h3 className="mt-1 font-bold text-slate-900 truncate">{req.nome}</h3>
                        <p className="text-xs text-slate-600 truncate">
                          {req.cargo} {req.orgao ? `• ${req.orgao}` : ""}
                        </p>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 shrink-0">
                        {formatDateTimePt(req.created_at)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-[#1D5C1B]">
                        {req.tipo_vinculo_display}
                      </span>
                      {req.cidade_nome && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          {req.cidade_nome}
                        </span>
                      )}
                      {req.igr_nome && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
                          {req.igr_nome}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalCount}
                pageSize={PAGE_SIZE}
                loading={loading}
                itemLabel="solicitações"
                onPageChange={setPage}
              />
            </>
          )}
        </div>

        {/* Painel de Análise, Edição e Aprovação / Recusa */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          {!selected ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center text-slate-500 p-6">
              <UserCheck className="h-10 w-10 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-700">
                Selecione uma solicitação à esquerda
              </h3>
              <p className="mt-1 text-xs max-w-sm">
                Visualize todos os dados enviados, confira o documento comprobatório, ajuste login,
                senha e vínculos e aprove ou recuse o pedido.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cabeçalho */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-black text-[#1D5C1B]">
                      {selected.protocolo}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                        selected.status === "aprovada"
                          ? "bg-emerald-100 text-emerald-800"
                          : selected.status === "recusada"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {selected.status_display}
                    </span>
                  </div>
                  <h2 className="mt-1 text-xl font-extrabold text-slate-900">{selected.nome}</h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3.5 w-3.5" />
                    Enviada em {formatDateTimePt(selected.created_at)}
                  </p>
                </div>

                {selected.tem_documento && (
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={getAdminSolicitacaoDocumentoUrl(selected.id, false)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#359830]/40 bg-[#EAF4E9] px-3 py-2 text-xs font-bold text-[#1D5C1B] hover:bg-[#359830] hover:text-white transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Abrir Documento
                    </a>
                    <a
                      href={getAdminSolicitacaoDocumentoUrl(selected.id, true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Baixar
                    </a>
                  </div>
                )}
              </div>

              {/* Documento + Resumo enviado */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Informações originais da solicitação
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#359830]" />
                    <strong>Contato:</strong> {selected.email}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[#359830]" />
                    <strong>Telefone:</strong> {selected.telefone}
                  </p>
                  <p>
                    <strong>Vínculo solicitado:</strong> {selected.tipo_vinculo_display}
                  </p>
                  <p>
                    <strong>Módulos:</strong>{" "}
                    {selected.modulos?.length ? selected.modulos.join(", ") : "Institucional"}
                  </p>
                  <p>
                    <strong>Município informado:</strong> {selected.cidade_nome || "—"}
                  </p>
                  <p>
                    <strong>IGR informada:</strong> {selected.igr_nome || "—"}
                  </p>
                  <p className="sm:col-span-2">
                    <strong>Documento comprobatório:</strong>{" "}
                    {selected.documento_nome || "Nenhum documento anexado"}
                  </p>
                </div>
              </div>

              {/* Edição dos dados do solicitante */}
              <div className="space-y-3 border-b border-slate-100 pb-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Editar dados do solicitante</h3>
                  <button
                    type="button"
                    disabled={savingEdit}
                    onClick={handleSaveDetails}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                  >
                    {savingEdit ? (
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Salvar alterações
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Nome completo
                    <input
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    E-mail de contato
                    <input
                      type="email"
                      value={editEmailContato}
                      onChange={(e) => setEditEmailContato(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Telefone
                    <input
                      value={editTelefone}
                      onChange={(e) => setEditTelefone(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Cargo
                    <input
                      value={editCargo}
                      onChange={(e) => setEditCargo(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 sm:col-span-2">
                    Órgão / Secretaria / Entidade
                    <input
                      value={editOrgao}
                      onChange={(e) => setEditOrgao(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 sm:col-span-2">
                    Justificativa / Mensagem
                    <textarea
                      rows={2}
                      value={editJustificativa}
                      onChange={(e) => setEditJustificativa(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                </div>
              </div>

              {selected.status === "aprovada" ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" />
                    Solicitação já aprovada
                  </p>
                  <p>
                    <strong>Usuário criado:</strong>{" "}
                    <span className="font-mono">{selected.usuario_criado_username || "—"}</span>
                  </p>
                  <p>
                    <strong>Analisado por:</strong> {selected.analisado_por_username || "—"} em{" "}
                    {formatDateTimePt(selected.analisado_em)}
                  </p>
                  {selected.observacao_analise && (
                    <p>
                      <strong>Observação:</strong> {selected.observacao_analise}
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleApprove} className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#1D5C1B] flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      Credenciais finais e decisão
                    </h3>
                    <button
                      type="button"
                      onClick={() => setPassword(generateStrongPassword())}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#359830] hover:text-[#1D5C1B] cursor-pointer"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Gerar senha forte
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Login (usuário) <span className="text-[#C90C0F]">*</span>
                      <input
                        required
                        maxLength={150}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-[#359830]"
                      />
                    </label>

                    <label className="block text-xs font-semibold text-slate-700">
                      Senha inicial (enviada por e-mail) <span className="text-[#C90C0F]">*</span>
                      <div className="relative mt-1">
                        <input
                          required
                          minLength={8}
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 pr-9 py-2 font-mono text-sm outline-none focus:border-[#359830]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </label>

                    <label className="block text-xs font-semibold text-slate-700 sm:col-span-2">
                      E-mail para envio das credenciais e tutorial{" "}
                      <span className="text-[#C90C0F]">*</span>
                      <input
                        required
                        type="email"
                        value={emailAcesso}
                        onChange={(e) => setEmailAcesso(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                      />
                    </label>

                    <label className="block text-xs font-semibold text-slate-700">
                      Primeiro nome
                      <input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-slate-700">
                      Sobrenome
                      <input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                      />
                    </label>

                    <label className="block text-xs font-semibold text-slate-700">
                      Município vinculado
                      <select
                        value={cidadeId}
                        onChange={(e) => setCidadeId(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#359830]"
                      >
                        <option value="">Nenhum município</option>
                        {cities.map((c) => (
                          <option key={c.id} value={String(c.id)}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-xs font-semibold text-slate-700">
                      IGR vinculada
                      <select
                        value={igrId}
                        onChange={(e) => setIgrId(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#359830]"
                      >
                        <option value="">Nenhuma IGR</option>
                        {igrs.map((i) => (
                          <option key={i.id} value={String(i.id)}>
                            {i.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block text-xs font-semibold text-slate-700">
                    Observação da análise / Motivo da recusa (opcional)
                    <textarea
                      rows={2}
                      placeholder="Ex.: Documento conferido e validado / ou motivo caso vá recusar..."
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>

                  <div className="flex flex-wrap gap-4">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isStaff}
                        onChange={(e) => setIsStaff(e.target.checked)}
                        className="h-4 w-4 accent-[#1D5C1B]"
                      />
                      Conceder acesso ao Django Admin
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificarRecusa}
                        onChange={(e) => setNotificarRecusa(e.target.checked)}
                        className="h-4 w-4 accent-[#1D5C1B]"
                      />
                      Enviar e-mail ao solicitante em caso de recusa
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={approving || denying}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D5C1B] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#287524] disabled:opacity-60 cursor-pointer"
                    >
                      {approving ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Aprovar e Enviar Credenciais
                    </button>

                    <button
                      type="button"
                      disabled={approving || denying}
                      onClick={handleDeny}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60 cursor-pointer"
                    >
                      {denying ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      Recusar
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
