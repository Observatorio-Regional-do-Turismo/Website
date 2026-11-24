"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Database,
  LoaderCircle,
  Pause,
  Play,
  RefreshCw,
  SlidersHorizontal,
  X,
  XCircle,
} from "lucide-react";
import {
  AdminTaskLogsResponse,
  AdminTaskRecord,
  AdminTaskRunInput,
  AdminTaskUpdateInput,
  getAdminTaskLogs,
  getAdminTasks,
  runAdminTaskNow,
  updateAdminTaskSchedule,
} from "@/lib/manager-api";

interface AdminTasksSectionProps {
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}

type ScheduleEditorMode = "daily" | "weekly" | "monthly" | "custom_cron" | "interval" | "clocked";

function extractTaskError(error: unknown): string {
  if (axios.isAxiosError<Record<string, unknown>>(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object") {
      if (typeof data.detail === "string") return data.detail;
      const firstValue = Object.values(data)[0];
      if (Array.isArray(firstValue) && typeof firstValue[0] === "string") return firstValue[0];
      if (typeof firstValue === "string") return firstValue;
    }
  }
  return error instanceof Error ? error.message : "Não foi possível atualizar a task.";
}

function formatDateTimePt(iso: string | null): string {
  if (!iso) return "Nunca executada via agendamento";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function toLocalDateTimeInput(iso?: string | null): string {
  const date = iso ? new Date(iso) : new Date(Date.now() + 3600_000);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function inferEditorMode(task: AdminTaskRecord): ScheduleEditorMode {
  if (task.schedule_type === "clocked") return "clocked";
  if (task.schedule_type === "interval") return "interval";
  const c = task.crontab;
  if (!c) return "monthly";
  if (c.day_of_month === "*" && c.month_of_year === "*" && c.day_of_week === "*") {
    return "daily";
  }
  if (c.day_of_month === "*" && c.month_of_year === "*" && c.day_of_week !== "*") {
    return "weekly";
  }
  if (c.month_of_year === "*" && c.day_of_week === "*" && /^\d+$/.test(c.day_of_month)) {
    return "monthly";
  }
  return "custom_cron";
}

const WEEKDAYS = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda-feira" },
  { value: "2", label: "Terça-feira" },
  { value: "3", label: "Quarta-feira" },
  { value: "4", label: "Quinta-feira" },
  { value: "5", label: "Sexta-feira" },
  { value: "6", label: "Sábado" },
];

export function AdminTasksSection({ onNotice, onError }: AdminTasksSectionProps) {
  const [tasks, setTasks] = useState<AdminTaskRecord[]>([]);
  const [logs, setLogs] = useState<AdminTaskLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingLogs, setRefreshingLogs] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("Todas");
  const [runningTaskId, setRunningTaskId] = useState<number | null>(null);

  // Modal de execução manual com parâmetros opcionais
  const [runTarget, setRunTarget] = useState<AdminTaskRecord | null>(null);
  const [runParams, setRunParams] = useState<Record<string, string>>({});

  // Modal de edição de agendamento/frequência
  const [editTarget, setEditTarget] = useState<AdminTaskRecord | null>(null);
  const [editorMode, setEditorMode] = useState<ScheduleEditorMode>("monthly");
  const [enabled, setEnabled] = useState(true);
  const [timeStr, setTimeStr] = useState("03:00");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [cronMinute, setCronMinute] = useState("0");
  const [cronHour, setCronHour] = useState("3");
  const [cronDom, setCronDom] = useState("1");
  const [cronMoy, setCronMoy] = useState("*");
  const [cronDow, setCronDow] = useState("*");
  const [intervalEvery, setIntervalEvery] = useState("1");
  const [intervalPeriod, setIntervalPeriod] = useState<"minutes" | "hours" | "days">("days");
  const [clockedDateTime, setClockedDateTime] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);

  const loadTasksAndLogs = useCallback(async () => {
    try {
      const [taskList, logData] = await Promise.all([getAdminTasks(), getAdminTaskLogs()]);
      setTasks(taskList);
      setLogs(logData);
    } catch (err) {
      onError(extractTaskError(err));
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    loadTasksAndLogs();
  }, [loadTasksAndLogs]);

  const reloadLogs = async () => {
    setRefreshingLogs(true);
    try {
      const data = await getAdminTaskLogs();
      setLogs(data);
    } catch (err) {
      onError(extractTaskError(err));
    } finally {
      setRefreshingLogs(false);
    }
  };

  const categories = useMemo(() => {
    const uniq = Array.from(new Set(tasks.map((t) => t.category)));
    return ["Todas", ...uniq];
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    if (categoryFilter === "Todas") return tasks;
    return tasks.filter((t) => t.category === categoryFilter);
  }, [tasks, categoryFilter]);

  const openScheduleModal = (task: AdminTaskRecord) => {
    setEditTarget(task);
    setEnabled(task.enabled);
    const mode = inferEditorMode(task);
    setEditorMode(mode);

    const c = task.crontab;
    const hh = c?.hour && /^\d+$/.test(c.hour) ? c.hour.padStart(2, "0") : "03";
    const mm = c?.minute && /^\d+$/.test(c.minute) ? c.minute.padStart(2, "0") : "00";
    setTimeStr(`${hh}:${mm}`);
    setDayOfMonth(c?.day_of_month && /^\d+$/.test(c.day_of_month) ? c.day_of_month : "1");
    setDayOfWeek(c?.day_of_week && /^\d+$/.test(c.day_of_week) ? c.day_of_week : "1");
    setCronMinute(c?.minute || "0");
    setCronHour(c?.hour || "3");
    setCronDom(c?.day_of_month || "1");
    setCronMoy(c?.month_of_year || "*");
    setCronDow(c?.day_of_week || "*");

    setIntervalEvery(String(task.interval?.every ?? 1));
    setIntervalPeriod(task.interval?.period ?? "days");
    setClockedDateTime(toLocalDateTimeInput(task.clocked?.clocked_time));
  };

  const handleToggleEnabled = async (task: AdminTaskRecord) => {
    onError("");
    onNotice("");
    try {
      const updated = await updateAdminTaskSchedule(task.id, { enabled: !task.enabled });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      onNotice(`Task "${updated.label}" ${updated.enabled ? "ativada" : "pausada"} no agendador.`);
    } catch (err) {
      onError(extractTaskError(err));
    }
  };

  const handleSaveSchedule = async (e: FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSavingSchedule(true);
    onError("");
    onNotice("");

    try {
      const [hhRaw, mmRaw] = (timeStr || "03:00").split(":");
      const hourNum = String(Number(hhRaw || "0"));
      const minNum = String(Number(mmRaw || "0"));

      let payload: AdminTaskUpdateInput = { enabled };
      if (editorMode === "daily") {
        payload = {
          enabled,
          schedule_type: "crontab",
          crontab: {
            minute: minNum,
            hour: hourNum,
            day_of_month: "*",
            month_of_year: "*",
            day_of_week: "*",
          },
        };
      } else if (editorMode === "weekly") {
        payload = {
          enabled,
          schedule_type: "crontab",
          crontab: {
            minute: minNum,
            hour: hourNum,
            day_of_month: "*",
            month_of_year: "*",
            day_of_week: dayOfWeek,
          },
        };
      } else if (editorMode === "monthly") {
        payload = {
          enabled,
          schedule_type: "crontab",
          crontab: {
            minute: minNum,
            hour: hourNum,
            day_of_month: dayOfMonth,
            month_of_year: "*",
            day_of_week: "*",
          },
        };
      } else if (editorMode === "custom_cron") {
        payload = {
          enabled,
          schedule_type: "crontab",
          crontab: {
            minute: cronMinute.trim() || "0",
            hour: cronHour.trim() || "*",
            day_of_month: cronDom.trim() || "*",
            month_of_year: cronMoy.trim() || "*",
            day_of_week: cronDow.trim() || "*",
          },
        };
      } else if (editorMode === "interval") {
        payload = {
          enabled,
          schedule_type: "interval",
          interval: {
            every: Math.max(1, Number(intervalEvery) || 1),
            period: intervalPeriod,
          },
        };
      } else if (editorMode === "clocked") {
        if (!clockedDateTime) {
          onError("Informe a data e hora desejada.");
          setSavingSchedule(false);
          return;
        }
        payload = {
          enabled,
          one_off: true,
          schedule_type: "clocked",
          clocked: {
            clocked_time: new Date(clockedDateTime).toISOString(),
          },
        };
      }

      const updated = await updateAdminTaskSchedule(editTarget.id, payload);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditTarget(null);
      onNotice(`Agendamento de "${updated.label}" atualizado (${updated.schedule_display}).`);
    } catch (err) {
      onError(extractTaskError(err));
    } finally {
      setSavingSchedule(false);
    }
  };

  const executeTask = async (task: AdminTaskRecord, paramsObj?: AdminTaskRunInput) => {
    setRunningTaskId(task.id);
    onError("");
    onNotice("");
    try {
      const res = await runAdminTaskNow(task.id, paramsObj);
      onNotice(`${res.detail} (${task.label}${res.task_id ? ` • ID: ${res.task_id}` : ""})`);
      setRunTarget(null);
      setRunParams({});
      await reloadLogs();
    } catch (err) {
      onError(extractTaskError(err));
    } finally {
      setRunningTaskId(null);
    }
  };

  const handleRunModalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!runTarget) return;
    const payload: AdminTaskRunInput = {};
    if (runParams.cidade_id?.trim()) payload.cidade_id = Number(runParams.cidade_id.trim());
    if (runParams.data?.trim()) payload.data = runParams.data.trim();
    if (runParams.ano?.trim()) payload.ano = Number(runParams.ano.trim());
    if (runParams.mes?.trim()) payload.mes = Number(runParams.mes.trim());
    await executeTask(runTarget, payload);
  };

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center gap-3 text-slate-600">
        <LoaderCircle className="h-5 w-5 animate-spin text-[#359830]" />
        Carregando rotinas automatizadas de coleta...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho e filtro por fonte */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <Database className="h-5 w-5 text-[#1D5C1B]" />
            Rotinas Automatizadas de Coleta de Dados ({visibleTasks.length})
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Execute coletas imediatamente ou ajuste data, horário e frequência no Celery Beat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                categoryFilter === cat
                  ? "bg-[#1D5C1B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Tasks */}
      <div className="grid gap-4 md:grid-cols-2">
        {visibleTasks.map((task) => {
          const isRunning = runningTaskId === task.id;
          return (
            <article
              key={task.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-[#1D5C1B]">
                        {task.category}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          task.enabled
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {task.enabled ? "Ativa" : "Pausada"}
                      </span>
                      {task.one_off && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                          Execução única
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{task.label}</h3>
                  </div>
                </div>

                <p className="text-xs leading-5 text-slate-600">{task.task_description}</p>

                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1 text-xs text-slate-700">
                  <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <CalendarClock className="h-3.5 w-3.5 text-[#1D5C1B]" />
                    {task.schedule_display}
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    Última execução agendada: {formatDateTimePt(task.last_run_at)} •{" "}
                    {task.total_run_count} {task.total_run_count === 1 ? "execução" : "execuções"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => {
                    if (task.allowed_params.length > 0) {
                      setRunTarget(task);
                      setRunParams({});
                    } else {
                      executeTask(task);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D5C1B] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#287524] disabled:opacity-60 cursor-pointer"
                >
                  {isRunning ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  Executar agora
                </button>

                <button
                  type="button"
                  onClick={() => openScheduleModal(task)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Agendar / Frequência
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleEnabled(task)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  {task.enabled ? (
                    <>
                      <Pause className="h-3.5 w-3.5" /> Pausar
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" /> Ativar
                    </>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Histórico recente */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900">Logs Recentes de Coleta e Celery</h3>
            <p className="text-xs text-slate-500">
              Últimos registros gravados em LogOperacao e django_celery_results.
            </p>
          </div>
          <button
            type="button"
            disabled={refreshingLogs}
            onClick={reloadLogs}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshingLogs ? "animate-spin" : ""}`} />
            Atualizar logs
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Operações ETL ({logs?.operacoes.length ?? 0})
            </h4>
            {!logs || logs.operacoes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
                Nenhum log de operação registrado ainda.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {logs.operacoes.map((op) => (
                  <div
                    key={op.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                        {op.sucesso ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                        )}
                        {op.operacao} — {op.arquivo} ({op.data_referencia})
                      </p>
                      {op.erro && <p className="text-red-700 line-clamp-2">{op.erro}</p>}
                    </div>
                    <span className="text-[11px] text-slate-500 shrink-0">
                      {formatDateTimePt(op.systimestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Resultados Celery ({logs?.task_results.length ?? 0})
            </h4>
            {!logs || logs.task_results.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
                Nenhum resultado de worker Celery registrado ainda.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {logs.task_results.map((res) => (
                  <div
                    key={res.task_id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-semibold text-slate-900 truncate">
                        {res.periodic_task_name || res.task_name || res.task_id}
                      </p>
                      <p className="text-slate-600">Status: {res.status}</p>
                    </div>
                    <span className="text-[11px] text-slate-500 shrink-0">
                      {formatDateTimePt(res.date_done)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Modal de execução manual */}
      {runTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setRunTarget(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900">Executar coleta agora</h3>
              <button
                type="button"
                onClick={() => setRunTarget(null)}
                className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs font-semibold text-[#1D5C1B] mb-1">{runTarget.label}</p>
            <p className="text-xs text-slate-600 mb-4">
              Todos os parâmetros abaixo são opcionais. Deixe em branco para usar o comportamento
              automático padrão da rotina.
            </p>
            <form onSubmit={handleRunModalSubmit} className="space-y-3.5">
              {runTarget.allowed_params.map((param) => (
                <label key={param.name} className="block text-xs font-semibold text-slate-700">
                  {param.label}
                  <input
                    type={param.type === "int" ? "number" : "text"}
                    placeholder={param.placeholder}
                    value={runParams[param.name] || ""}
                    onChange={(e) =>
                      setRunParams((prev) => ({ ...prev, [param.name]: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                  />
                </label>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRunTarget(null)}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={runningTaskId === runTarget.id}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D5C1B] px-5 py-2 text-xs font-bold text-white hover:bg-[#287524] disabled:opacity-60 cursor-pointer"
                >
                  {runningTaskId === runTarget.id ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  Disparar coleta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de agendamento / frequência */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setEditTarget(null)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Agendamento e Frequência</h3>
                <p className="text-xs font-semibold text-[#1D5C1B]">{editTarget.label}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <label className="block text-xs font-semibold text-slate-700">
                Tipo de agendamento
                <select
                  value={editorMode}
                  onChange={(e) => setEditorMode(e.target.value as ScheduleEditorMode)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#359830]"
                >
                  <option value="daily">Diariamente (horário fixo)</option>
                  <option value="weekly">Semanalmente (dia da semana e horário)</option>
                  <option value="monthly">Mensalmente (dia do mês e horário)</option>
                  <option value="interval">Intervalo recorrente (a cada X min/horas/dias)</option>
                  <option value="clocked">Data e hora específica (execução única)</option>
                  <option value="custom_cron">Cron avançado (expressão completa)</option>
                </select>
              </label>

              {(editorMode === "daily" || editorMode === "weekly" || editorMode === "monthly") && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Horário de execução
                    <input
                      type="time"
                      required
                      value={timeStr}
                      onChange={(e) => setTimeStr(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>

                  {editorMode === "weekly" && (
                    <label className="block text-xs font-semibold text-slate-700">
                      Dia da semana
                      <select
                        value={dayOfWeek}
                        onChange={(e) => setDayOfWeek(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#359830]"
                      >
                        {WEEKDAYS.map((wd) => (
                          <option key={wd.value} value={wd.value}>
                            {wd.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {editorMode === "monthly" && (
                    <label className="block text-xs font-semibold text-slate-700">
                      Dia do mês (1 a 31)
                      <input
                        type="number"
                        min={1}
                        max={31}
                        required
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                      />
                    </label>
                  )}
                </div>
              )}

              {editorMode === "interval" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    A cada
                    <input
                      type="number"
                      min={1}
                      required
                      value={intervalEvery}
                      onChange={(e) => setIntervalEvery(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Unidade
                    <select
                      value={intervalPeriod}
                      onChange={(e) =>
                        setIntervalPeriod(e.target.value as "minutes" | "hours" | "days")
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#359830]"
                    >
                      <option value="minutes">Minuto(s)</option>
                      <option value="hours">Hora(s)</option>
                      <option value="days">Dia(s)</option>
                    </select>
                  </label>
                </div>
              )}

              {editorMode === "clocked" && (
                <label className="block text-xs font-semibold text-slate-700">
                  Data e hora da execução (execução única)
                  <input
                    type="datetime-local"
                    required
                    value={clockedDateTime}
                    onChange={(e) => setClockedDateTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#359830]"
                  />
                </label>
              )}

              {editorMode === "custom_cron" && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Minuto
                    <input
                      required
                      value={cronMinute}
                      onChange={(e) => setCronMinute(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-2.5 py-2 font-mono text-xs outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Hora
                    <input
                      required
                      value={cronHour}
                      onChange={(e) => setCronHour(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-2.5 py-2 font-mono text-xs outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Dia mês
                    <input
                      required
                      value={cronDom}
                      onChange={(e) => setCronDom(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-2.5 py-2 font-mono text-xs outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Mês
                    <input
                      required
                      value={cronMoy}
                      onChange={(e) => setCronMoy(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-2.5 py-2 font-mono text-xs outline-none focus:border-[#359830]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Dia sem.
                    <input
                      required
                      value={cronDow}
                      onChange={(e) => setCronDow(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-2.5 py-2 font-mono text-xs outline-none focus:border-[#359830]"
                    />
                  </label>
                </div>
              )}

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="h-4 w-4 accent-[#1D5C1B]"
                />
                Task ativa no agendador automático
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingSchedule}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D5C1B] px-5 py-2 text-xs font-bold text-white hover:bg-[#287524] disabled:opacity-60 cursor-pointer"
                >
                  {savingSchedule ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
                  Salvar agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
