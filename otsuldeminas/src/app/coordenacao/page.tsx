"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  AlertCircle,
  Building2,
  Check,
  KeyRound,
  Layers,
  LoaderCircle,
  LogOut,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Header } from "@/components/Header";
import {
  AdminManagerRecord,
  createAdminManager,
  deleteAdminManager,
  getAdminManagers,
  getManagerSession,
  logoutManager,
  ManagerSession,
  resetAdminManagerPassword,
  updateAdminManager,
} from "@/lib/manager-api";
import { fetchAllPaginated } from "@/lib/website-api";

type TypeFilter = "todos" | "cidade" | "igr";

function extractValidationError(error: unknown): string {
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

export default function CoordenacaoPage() {
  const router = useRouter();
  const [session, setSession] = useState<ManagerSession | null>(null);
  const [managers, setManagers] = useState<AdminManagerRecord[]>([]);
  const [cities, setCities] = useState<ApiCidade[]>([]);
  const [igrs, setIgrs] = useState<ApiIGR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("todos");

  // Formulário de criação / edição de gestor
  const [editing, setEditing] = useState<AdminManagerRecord | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cidadeId, setCidadeId] = useState("");
  const [igrId, setIgrId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [initialPassword, setInitialPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal dedicado para redefinição de senha (sem visualizar a atual)
  const [passwordTarget, setPasswordTarget] = useState<AdminManagerRecord | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const reloadManagers = useCallback(async () => {
    const items = await getAdminManagers();
    setManagers(items);
  }, []);

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      try {
        const current = await getManagerSession();
        if (!current.is_superuser) {
          router.replace("/coordenacao/acesso");
          return;
        }
        const [managerList, cityList, igrList] = await Promise.all([
          getAdminManagers(),
          fetchAllPaginated<ApiCidade>("cidades/").catch(() => []),
          fetchAllPaginated<ApiIGR>("igrs/").catch(() => []),
        ]);
        if (!active) return;
        setSession(current);
        setManagers(managerList);
        setCities(cityList.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
        setIgrs(igrList.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
        setLoading(false);
      } catch (requestError) {
        if (!active) return;
        if (
          axios.isAxiosError(requestError) &&
          (requestError.response?.status === 401 || requestError.response?.status === 403)
        ) {
          router.replace("/coordenacao/acesso");
          return;
        }
        setError(extractValidationError(requestError));
        setLoading(false);
      }
    }
    bootstrap();
    return () => {
      active = false;
    };
  }, [router]);

  const resetForm = () => {
    setEditing(null);
    setUsername("");
    setEmail("");
    setFirstName("");
    setLastName("");
    setCidadeId("");
    setIgrId("");
    setIsActive(true);
    setIsStaff(false);
    setInitialPassword("");
  };

  const startEdit = (item: AdminManagerRecord) => {
    setEditing(item);
    setUsername(item.username);
    setEmail(item.email || "");
    setFirstName(item.first_name || "");
    setLastName(item.last_name || "");
    setCidadeId(item.cidade_id ? String(item.cidade_id) : "");
    setIgrId(item.igr_id ? String(item.igr_id) : "");
    setIsActive(item.is_active);
    setIsStaff(item.is_staff);
    setInitialPassword("");
    setError("");
    setNotice("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const cidadeVal = cidadeId ? Number(cidadeId) : null;
      const igrVal = igrId ? Number(igrId) : null;

      if (editing) {
        await updateAdminManager(editing.id, {
          username: username.trim(),
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          is_active: isActive,
          is_staff: isStaff,
          cidade: cidadeVal,
          igr: igrVal,
        });
        setNotice(`Dados de "${username.trim()}" atualizados.`);
      } else {
        await createAdminManager({
          username: username.trim(),
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          is_active: isActive,
          is_staff: isStaff,
          cidade: cidadeVal,
          igr: igrVal,
          password: initialPassword,
        });
        setNotice(`Gestor "${username.trim()}" criado com sucesso.`);
      }
      await reloadManagers();
      resetForm();
    } catch (requestError) {
      setError(extractValidationError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordTarget) return;
    setPasswordError("");
    if (newPassword.length < 8) {
      setPasswordError("A nova senha deve conter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }

    setSavingPassword(true);
    try {
      await resetAdminManagerPassword(passwordTarget.id, newPassword, confirmPassword);
      setNotice(`Senha de "${passwordTarget.username}" redefinida com segurança.`);
      setPasswordTarget(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setPasswordError(extractValidationError(requestError));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDelete = async (item: AdminManagerRecord) => {
    if (!window.confirm(`Excluir definitivamente o gestor "${item.username}"?`)) return;
    setError("");
    setNotice("");
    try {
      await deleteAdminManager(item.id);
      setManagers((prev) => prev.filter((m) => m.id !== item.id));
      if (editing?.id === item.id) resetForm();
      setNotice(`Gestor "${item.username}" removido.`);
    } catch (requestError) {
      setError(extractValidationError(requestError));
    }
  };

  const handleLogout = async () => {
    await logoutManager().catch(() => undefined);
    router.replace("/coordenacao/acesso");
  };

  const filteredManagers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return managers.filter((m) => {
      if (typeFilter === "cidade" && !m.cidade_id) return false;
      if (typeFilter === "igr" && !m.igr_id) return false;
      if (!q) return true;
      const haystack =
        `${m.username} ${m.email} ${m.first_name} ${m.last_name} ${m.cidade_name || ""} ${m.igr_name || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [managers, searchTerm, typeFilter]);

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 pb-20">
      <Header
        badge="Coordenação Geral"
        title="Gestão de Contas e Privilégios"
        subtitle="Administre gestores de cidades e IGRs, atualize vínculos e redefina senhas com segurança."
      />

      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-slate-600">
            <LoaderCircle className="h-5 w-5 animate-spin text-[#359830]" />
            Verificando privilégios administrativos...
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col justify-between gap-4 rounded-2xl bg-[#1D5C1B] p-5 text-white sm:flex-row sm:items-center sm:p-7">
              <div>
                <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <ShieldCheck className="h-4 w-4" />
                  Privilégio Máximo (Superusuário)
                </p>
                <h1 className="mt-1 text-2xl font-extrabold">Olá, {session?.username}</h1>
                <p className="mt-1 text-sm text-white/80">
                  {managers.length}{" "}
                  {managers.length === 1 ? "gestor ativo/cadastrado" : "gestores cadastrados"} entre
                  municípios e IGRs.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {session && session.scopes.length > 0 && (
                  <Link
                    href="/gestao"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/25"
                  >
                    Painel de Conteúdo
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 cursor-pointer"
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

            {notice && (
              <div
                role="status"
                className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900"
              >
                <Check className="h-4 w-4 shrink-0 text-emerald-700" />
                {notice}
              </div>
            )}

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(20rem,1.25fr)]">
              {/* Formulário de Cadastro / Edição de Gestor */}
              <form
                onSubmit={handleSubmit}
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h2 className="font-bold text-slate-900 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-[#1D5C1B]" />
                    {editing ? `Editar gestor: ${editing.username}` : "Cadastrar novo gestor"}
                  </h2>
                  {editing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Novo gestor
                    </button>
                  )}
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Usuário (login)
                    <input
                      required
                      maxLength={150}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    E-mail
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Nome
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
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
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

                {!editing && (
                  <label className="block text-xs font-semibold text-slate-700">
                    Senha inicial (mínimo 8 caracteres)
                    <input
                      required
                      type="password"
                      minLength={8}
                      value={initialPassword}
                      onChange={(e) => setInitialPassword(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                )}

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 accent-[#1D5C1B]"
                    />
                    Conta ativa
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isStaff}
                      onChange={(e) => setIsStaff(e.target.checked)}
                      className="h-4 w-4 accent-[#1D5C1B]"
                    />
                    Acesso ao Django Admin
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D5C1B] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#287524] disabled:opacity-60 cursor-pointer"
                >
                  {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  {editing ? "Salvar alterações do gestor" : "Criar conta de gestor"}
                </button>
              </form>

              {/* Listagem de Todos os Gestores */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-bold text-slate-900 flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#1D5C1B]" />
                      Gestores Cadastrados ({filteredManagers.length})
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {(
                        [
                          { id: "todos", label: "Todos" },
                          { id: "cidade", label: "Cidades" },
                          { id: "igr", label: "IGRs" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setTypeFilter(opt.id)}
                          className={`px-3 py-1 rounded-full cursor-pointer transition ${
                            typeFilter === opt.id
                              ? "bg-[#1D5C1B] text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por usuário, nome, e-mail, cidade ou IGR..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-[#359830]"
                    />
                  </div>
                </div>

                {filteredManagers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                    Nenhum gestor encontrado com os filtros aplicados.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredManagers.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900">{item.username}</h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                item.is_active
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {item.is_active ? "Ativo" : "Inativo"}
                            </span>
                            {item.is_staff && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                                Admin
                              </span>
                            )}
                          </div>

                          {(item.first_name || item.last_name || item.email) && (
                            <p className="text-xs text-slate-600">
                              {[item.first_name, item.last_name].filter(Boolean).join(" ")}
                              {item.email ? ` • ${item.email}` : ""}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                            {item.cidade_name && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1D5C1B] font-semibold">
                                <Building2 className="h-3 w-3" />
                                Cidade: {item.cidade_name}
                              </span>
                            )}
                            {item.igr_name && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold">
                                <Layers className="h-3 w-3" />
                                IGR: {item.igr_name}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPasswordTarget(item);
                              setNewPassword("");
                              setConfirmPassword("");
                              setPasswordError("");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            Trocar senha
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="p-2 rounded-xl text-red-600 hover:bg-red-50 cursor-pointer"
                            title="Excluir gestor"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Modal de Redefinição de Senha (nunca exibe a senha atual) */}
      {passwordTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setPasswordTarget(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-700" />
                <h3 className="text-lg font-bold text-slate-900">
                  Redefinir senha — {passwordTarget.username}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPasswordTarget(null)}
                className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Por segurança, a senha atual nunca é exibida ou recuperada. Defina abaixo uma nova
              senha forte para este gestor.
            </p>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <label className="block text-xs font-semibold text-slate-700">
                Nova senha
                <input
                  required
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#359830]"
                />
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Confirmar nova senha
                <input
                  required
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#359830]"
                />
              </label>

              {passwordError && (
                <p
                  role="alert"
                  className="text-xs font-medium text-red-700 bg-red-50 p-2.5 rounded-xl"
                >
                  {passwordError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1D5C1B] hover:bg-[#287524] disabled:opacity-60 cursor-pointer"
                >
                  {savingPassword ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
                  Salvar nova senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
