import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { normalizeMediaUrls } from "@/lib/website-api";
export interface ManagerScope {
  type: "cidade" | "igr";
  id: number;
  name: string;
  slug: string;
}

export interface ManagerCityOption {
  id: number;
  name: string;
  slug: string;
}

export interface ManagerSession {
  username: string;
  is_superuser?: boolean;
  scopes: ManagerScope[];
  cities?: ManagerCityOption[];
}

export interface AdminManagerRecord {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  last_login: string | null;
  cidade_id: number | null;
  cidade_name: string | null;
  igr_id: number | null;
  igr_name: string | null;
  tipo: "cidade" | "igr" | "ambos" | "sem_vinculo";
}

export interface AdminManagerCreateInput {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  cidade?: number | null;
  igr?: number | null;
  password: string;
}

export interface AdminManagerUpdateInput {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  cidade?: number | null;
  igr?: number | null;
}

export type ManagerTargetType =
  "cidade" | "igr" | "evento" | "ponto_turistico" | "noticia" | "local" | "estado";

export interface ManagerImagem {
  id: number;
  image: string;
  alt_text?: string | null;
  caption?: string | null;
  order: number;
  is_cover: boolean;
  entity_type?: string;
  entity_id?: number;
}

export interface ManagerLinkedIgr {
  id: number;
  name: string;
  slug: string;
}

export interface ManagerLinkedCidade {
  id: number;
  name: string;
  slug: string;
}

export interface ManagerCity {
  id: number;
  name: string;
  slug: string;
  description: string;
  state: number;
  state_name: string;
  igrs?: ManagerLinkedIgr[];
  imagens?: ManagerImagem[];
}

export interface ManagerIGR {
  id: number;
  name: string;
  slug: string;
  description: string;
  cidades?: ManagerLinkedCidade[];
  imagens?: ManagerImagem[];
}

export interface AvailableCityForIgr {
  id: number;
  name: string;
  slug: string;
  state_name: string;
  igrs: { id: number; name: string }[];
}

export interface AdminEstadoRecord {
  id: number;
  name: string;
  slug: string;
  abbreviation: string;
}

export interface AdminIGRRecord {
  id: number;
  name: string;
  slug: string;
  description: string;
  cidades_count: number;
  imagens?: ManagerImagem[];
}

export interface AdminIGRInput {
  name: string;
  slug?: string;
  description?: string;
}

export interface AdminCidadeRecord {
  id: number;
  name: string;
  slug: string;
  description: string;
  ibge_code: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  state: number;
  state_name: string;
  igrs: number[];
  igrs_info: ManagerLinkedIgr[];
  imagens?: ManagerImagem[];
}

export interface AdminCidadeInput {
  name: string;
  slug?: string;
  description?: string;
  ibge_code?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  state: number;
  igrs?: number[];
}

export interface AdminTaskParamSpec {
  name: "cidade_id" | "data" | "ano" | "mes";
  label: string;
  type: "int" | "month";
  placeholder: string;
}

export interface AdminTaskCrontab {
  minute: string;
  hour: string;
  day_of_month: string;
  month_of_year: string;
  day_of_week: string;
}

export interface AdminTaskInterval {
  every: number;
  period: "minutes" | "hours" | "days";
}

export interface AdminTaskClocked {
  clocked_time: string;
}

export interface AdminTaskRecord {
  id: number;
  name: string;
  label: string;
  category: string;
  task: string;
  description: string;
  task_description: string;
  enabled: boolean;
  one_off: boolean;
  kwargs_dict: Record<string, unknown>;
  allowed_params: AdminTaskParamSpec[];
  schedule_type: "crontab" | "interval" | "clocked";
  schedule_display: string;
  crontab: AdminTaskCrontab | null;
  interval: AdminTaskInterval | null;
  clocked: AdminTaskClocked | null;
  last_run_at: string | null;
  total_run_count: number;
  date_changed: string;
}

export interface AdminTaskUpdateInput {
  enabled?: boolean;
  one_off?: boolean;
  schedule_type?: "crontab" | "interval" | "clocked";
  crontab?: AdminTaskCrontab;
  interval?: AdminTaskInterval;
  clocked?: AdminTaskClocked;
}

export interface AdminTaskRunInput {
  cidade_id?: number;
  data?: string;
  ano?: number;
  mes?: number;
}

export interface AdminTaskRunResponse {
  task_id: string | null;
  task: string;
  name: string;
  kwargs: Record<string, unknown>;
  detail: string;
}

export interface AdminTaskOperacaoLog {
  id: number;
  operacao: string;
  arquivo: string;
  data_referencia: string;
  sucesso: boolean;
  erro: string;
  systimestamp: string;
}

export interface AdminTaskCeleryResult {
  task_id: string;
  task_name: string | null;
  periodic_task_name: string | null;
  status: string;
  date_done: string | null;
  traceback: string | null;
}

export interface AdminTaskLogsResponse {
  operacoes: AdminTaskOperacaoLog[];
  task_results: AdminTaskCeleryResult[];
}

export interface ManagerNews {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  published_at: string;
  is_featured: boolean;
  cidade: number | null;
  igr: number | null;
  category: string;
  author: string;
  source_url: string;
  tags: string[];
  imagens?: ManagerImagem[];
}

export type ManagerNewsInput = Omit<ManagerNews, "id" | "cidade" | "igr" | "imagens"> &
  Partial<Pick<ManagerNews, "cidade" | "igr">>;

export interface ManagerEvento {
  id: number;
  name: string;
  slug: string;
  description: string;
  start_date: string;
  end_date: string | null;
  is_featured: boolean;
  popularity: number;
  latitude: string | number | null;
  longitude: string | number | null;
  cidade: number;
  cidade_name?: string;
  imagens?: ManagerImagem[];
}

export type ManagerEventoInput = Omit<ManagerEvento, "id" | "slug" | "cidade_name" | "imagens"> & {
  slug?: string;
};

export interface ManagerPontoTuristico {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  is_featured: boolean;
  popularity: number;
  latitude: string | number | null;
  longitude: string | number | null;
  cidade: number;
  cidade_name?: string;
  imagens?: ManagerImagem[];
}

export type ManagerPontoTuristicoInput = Omit<
  ManagerPontoTuristico,
  "id" | "slug" | "cidade_name" | "imagens"
> & {
  slug?: string;
};

export interface ManagerLocalGeo {
  id: number;
  cnpj_completo?: string | null;
  nome: string;
  categoria: string;
  endereco: string;
  telefone: string;
  cidade: number;
  cidade_name?: string;
  latitude: string | number;
  longitude: string | number;
  imagens?: ManagerImagem[];
}

export type ManagerLocalGeoInput = Omit<ManagerLocalGeo, "id" | "cidade_name" | "imagens">;

export interface AdminSolicitacaoRecord {
  id: number;
  protocolo: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  orgao: string;
  tipo_vinculo: "cidade" | "igr" | "ambas";
  tipo_vinculo_display: string;
  cidade_nome: string;
  igr_nome: string;
  modulos: string[];
  username_sugerido: string;
  email_cadastro: string;
  justificativa: string;
  tem_documento: boolean;
  documento_nome: string | null;
  status: "pendente" | "aprovada" | "recusada";
  status_display: string;
  observacao_analise: string;
  usuario_criado: number | null;
  usuario_criado_username: string | null;
  analisado_por: number | null;
  analisado_por_username: string | null;
  analisado_em: string | null;
  email_enviado: boolean;
  erro_envio_email: string;
  created_at: string;
}

export interface AdminSolicitacaoSummary {
  pendente: number;
  aprovada: number;
  recusada: number;
  total: number;
}

export interface AdminSolicitacaoListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminSolicitacaoRecord[];
  summary: AdminSolicitacaoSummary;
}

export interface AdminSolicitacaoUpdateInput {
  nome?: string;
  email?: string;
  telefone?: string;
  cargo?: string;
  orgao?: string;
  tipo_vinculo?: "cidade" | "igr" | "ambas";
  cidade_nome?: string;
  igr_nome?: string;
  username_sugerido?: string;
  email_cadastro?: string;
  justificativa?: string;
  observacao_analise?: string;
}

export interface AdminSolicitacaoAprovarInput {
  username: string;
  password: string;
  email: string;
  first_name?: string;
  last_name?: string;
  cidade?: number | null;
  igr?: number | null;
  is_staff?: boolean;
  observacao_analise?: string;
}

export interface AdminSolicitacaoAprovarResponse {
  solicitacao: AdminSolicitacaoRecord;
  gestor: AdminManagerRecord;
  email_enviado: boolean;
  email_erro: string;
}

export interface AdminSolicitacaoRecusarResponse {
  solicitacao: AdminSolicitacaoRecord;
  email_enviado: boolean;
  email_erro: string;
}

interface ApiPage<T> {
  count: number;
  next: string | null;
  results: T[];
}

function authUrl(path: string): string {
  return `/api/manager/auth/${path}`;
}

function managerUrl(path: string): string {
  return `/api/manager/gestao/${path}`;
}

async function getCsrfToken(): Promise<string> {
  const response = await axios.get<{ csrfToken: string }>(authUrl("csrf/"), {
    withCredentials: true,
    timeout: 12000,
  });
  return response.data.csrfToken;
}

async function managerRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const csrfToken = await getCsrfToken();
  const response = await axios.request<T>({
    ...config,
    withCredentials: true,
    timeout: 15000,
    headers: {
      ...config.headers,
      "X-CSRFToken": csrfToken,
    },
  });
  return normalizeMediaUrls(response.data);
}

export async function loginManager(username: string, password: string): Promise<ManagerSession> {
  return managerRequest<ManagerSession>({
    method: "POST",
    url: authUrl("login/"),
    data: { username, password },
  });
}

export async function logoutManager(): Promise<void> {
  await managerRequest<void>({ method: "POST", url: authUrl("logout/") });
}

export async function getManagerSession(): Promise<ManagerSession> {
  const response = await axios.get<ManagerSession>(authUrl("session/"), {
    withCredentials: true,
    timeout: 12000,
  });
  return response.data;
}

export async function getManagerCollection<T>(path: string): Promise<T[]> {
  const initial = new URL(managerUrl(path), window.location.origin);
  if (!initial.searchParams.has("page_size")) {
    initial.searchParams.set("page_size", "200");
  }
  let nextUrl: string | null = `${initial.pathname}${initial.search}`;
  const items: T[] = [];

  while (nextUrl) {
    const response: AxiosResponse<ApiPage<T> | T[]> = await axios.get<ApiPage<T> | T[]>(nextUrl, {
      withCredentials: true,
      timeout: 15000,
    });
    const normalized = normalizeMediaUrls(response.data);
    if (Array.isArray(normalized)) {
      items.push(...normalized);
      break;
    }
    if (!Array.isArray(normalized.results)) {
      throw new Error("A API de gestão retornou uma resposta inválida.");
    }
    items.push(...normalized.results);
    if (normalized.next) {
      const next = new URL(normalized.next, window.location.origin);
      const backendPath = next.pathname.replace(/^\/backend(?=\/|$)/, "");
      nextUrl = `/api/manager${backendPath}${next.search}`;
    } else {
      nextUrl = null;
    }
  }

  return items;
}

export async function updateManagerRecord<T extends ManagerCity | ManagerIGR>(
  path: string,
  id: number,
  values: Pick<T, "name" | "slug" | "description">,
): Promise<T> {
  return managerRequest<T>({
    method: "PATCH",
    url: managerUrl(`${path}/${id}/`),
    data: values,
  });
}

export async function saveManagerNews(values: ManagerNewsInput, id?: number): Promise<ManagerNews> {
  return managerRequest<ManagerNews>({
    method: id ? "PATCH" : "POST",
    url: managerUrl(`noticias/${id ? `${id}/` : ""}`),
    data: values,
  });
}

export async function deleteManagerNews(id: number): Promise<void> {
  await managerRequest<void>({
    method: "DELETE",
    url: managerUrl(`noticias/${id}/`),
  });
}

async function saveManagerEntity<T, TInput>(
  resource: string,
  values: TInput,
  id?: number,
): Promise<T> {
  return managerRequest<T>({
    method: id ? "PATCH" : "POST",
    url: managerUrl(`${resource}/${id ? `${id}/` : ""}`),
    data: values,
  });
}

async function deleteManagerEntity(resource: string, id: number): Promise<void> {
  await managerRequest<void>({
    method: "DELETE",
    url: managerUrl(`${resource}/${id}/`),
  });
}

export const saveManagerEvent = (values: ManagerEventoInput, id?: number) =>
  saveManagerEntity<ManagerEvento, ManagerEventoInput>("eventos", values, id);
export const deleteManagerEvent = (id: number) => deleteManagerEntity("eventos", id);

export const saveManagerPonto = (values: ManagerPontoTuristicoInput, id?: number) =>
  saveManagerEntity<ManagerPontoTuristico, ManagerPontoTuristicoInput>(
    "pontos-turisticos",
    values,
    id,
  );
export const deleteManagerPonto = (id: number) => deleteManagerEntity("pontos-turisticos", id);

export const saveManagerLocal = (values: ManagerLocalGeoInput, id?: number) =>
  saveManagerEntity<ManagerLocalGeo, ManagerLocalGeoInput>("locais", values, id);
export const deleteManagerLocal = (id: number) => deleteManagerEntity("locais", id);

export async function uploadManagerImage(formData: FormData): Promise<ManagerImagem> {
  return managerRequest<ManagerImagem>({
    method: "POST",
    url: managerUrl("imagens/"),
    data: formData,
  });
}

export async function setCoverManagerImage(id: number): Promise<ManagerImagem> {
  return managerRequest<ManagerImagem>({
    method: "PATCH",
    url: managerUrl(`imagens/${id}/`),
    data: { is_cover: true },
  });
}

export async function deleteManagerImage(id: number): Promise<void> {
  await deleteManagerEntity("imagens", id);
}

export async function getAdminManagers(
  search?: string,
  tipo?: string,
): Promise<AdminManagerRecord[]> {
  const params = new URLSearchParams();
  if (search?.trim()) params.set("search", search.trim());
  if (tipo && tipo !== "todos") params.set("tipo", tipo);
  const query = params.toString();
  return getManagerCollection<AdminManagerRecord>(`admin-gestores/${query ? `?${query}` : ""}`);
}

export const createAdminManager = (values: AdminManagerCreateInput) =>
  saveManagerEntity<AdminManagerRecord, AdminManagerCreateInput>("admin-gestores", values);

export const updateAdminManager = (id: number, values: AdminManagerUpdateInput) =>
  saveManagerEntity<AdminManagerRecord, AdminManagerUpdateInput>("admin-gestores", values, id);

export async function resetAdminManagerPassword(
  id: number,
  newPassword: string,
  confirmPassword: string,
): Promise<{ detail: string }> {
  return managerRequest<{ detail: string }>({
    method: "POST",
    url: managerUrl(`admin-gestores/${id}/alterar-senha/`),
    data: { new_password: newPassword, confirm_password: confirmPassword },
  });
}

export const deleteAdminManager = (id: number) => deleteManagerEntity("admin-gestores", id);

// Vínculos Cidade <-> IGR (Gestores)
export async function getAvailableIgrsForCity(): Promise<ManagerLinkedIgr[]> {
  const response = await axios.get<ManagerLinkedIgr[]>(managerUrl("cidades/igrs-disponiveis/"), {
    withCredentials: true,
    timeout: 15000,
  });
  return response.data;
}

export async function linkCityToIgr(cidadeId: number, igrId: number): Promise<ManagerCity> {
  return managerRequest<ManagerCity>({
    method: "POST",
    url: managerUrl(`cidades/${cidadeId}/vincular-igr/`),
    data: { igr_id: igrId },
  });
}

export async function unlinkCityFromIgr(cidadeId: number, igrId: number): Promise<ManagerCity> {
  return managerRequest<ManagerCity>({
    method: "POST",
    url: managerUrl(`cidades/${cidadeId}/desvincular-igr/`),
    data: { igr_id: igrId },
  });
}

export async function getAvailableCitiesForIgr(): Promise<AvailableCityForIgr[]> {
  const response = await axios.get<AvailableCityForIgr[]>(managerUrl("igrs/cidades-disponiveis/"), {
    withCredentials: true,
    timeout: 15000,
  });
  return response.data;
}

export async function linkIgrToCity(igrId: number, cidadeId: number): Promise<ManagerIGR> {
  return managerRequest<ManagerIGR>({
    method: "POST",
    url: managerUrl(`igrs/${igrId}/vincular-cidade/`),
    data: { cidade_id: cidadeId },
  });
}

export async function unlinkIgrFromCity(igrId: number, cidadeId: number): Promise<ManagerIGR> {
  return managerRequest<ManagerIGR>({
    method: "POST",
    url: managerUrl(`igrs/${igrId}/desvincular-cidade/`),
    data: { cidade_id: cidadeId },
  });
}

// Coordenação Master: Estados, IGRs, Cidades e Tasks ETL
export const getAdminEstados = () => getManagerCollection<AdminEstadoRecord>("admin-estados/");
export const getAdminIgrs = () => getManagerCollection<AdminIGRRecord>("admin-igrs/");
export const saveAdminIgr = (values: AdminIGRInput, id?: number) =>
  saveManagerEntity<AdminIGRRecord, AdminIGRInput>("admin-igrs", values, id);
export const deleteAdminIgr = (id: number) => deleteManagerEntity("admin-igrs", id);

export const getAdminCidades = () => getManagerCollection<AdminCidadeRecord>("admin-cidades/");
export const saveAdminCidade = (values: AdminCidadeInput, id?: number) =>
  saveManagerEntity<AdminCidadeRecord, AdminCidadeInput>("admin-cidades", values, id);
export const deleteAdminCidade = (id: number) => deleteManagerEntity("admin-cidades", id);

// Coordenação Master: Conteúdos & Imagens (Eventos, Notícias, Pontos Turísticos, Restaurantes/Locais)
export const getAdminEventos = () => getManagerCollection<ManagerEvento>("admin-eventos/");
export const saveAdminEvento = (values: ManagerEventoInput, id?: number) =>
  saveManagerEntity<ManagerEvento, ManagerEventoInput>("admin-eventos", values, id);
export const deleteAdminEvento = (id: number) => deleteManagerEntity("admin-eventos", id);

export const getAdminNoticias = () => getManagerCollection<ManagerNews>("admin-noticias/");
export const saveAdminNoticia = (values: ManagerNewsInput, id?: number) =>
  saveManagerEntity<ManagerNews, ManagerNewsInput>("admin-noticias", values, id);
export const deleteAdminNoticia = (id: number) => deleteManagerEntity("admin-noticias", id);

export const getAdminPontos = () =>
  getManagerCollection<ManagerPontoTuristico>("admin-pontos-turisticos/");
export const saveAdminPonto = (values: ManagerPontoTuristicoInput, id?: number) =>
  saveManagerEntity<ManagerPontoTuristico, ManagerPontoTuristicoInput>(
    "admin-pontos-turisticos",
    values,
    id,
  );
export const deleteAdminPonto = (id: number) => deleteManagerEntity("admin-pontos-turisticos", id);

export const getAdminLocais = () => getManagerCollection<ManagerLocalGeo>("admin-locais/");
export const saveAdminLocal = (values: ManagerLocalGeoInput, id?: number) =>
  saveManagerEntity<ManagerLocalGeo, ManagerLocalGeoInput>("admin-locais", values, id);
export const deleteAdminLocal = (id: number) => deleteManagerEntity("admin-locais", id);

// Coordenação Master: Solicitações de Credenciais
export async function getAdminSolicitacoes(params?: {
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<AdminSolicitacaoListResponse> {
  const qs = new URLSearchParams();
  if (params?.status && params.status !== "todas") qs.set("status", params.status);
  if (params?.search?.trim()) qs.set("search", params.search.trim());
  qs.set("page", String(params?.page || 1));
  qs.set("page_size", String(params?.page_size || 20));
  const response = await axios.get<AdminSolicitacaoListResponse>(
    managerUrl(`admin-solicitacoes/?${qs.toString()}`),
    { withCredentials: true, timeout: 15000 },
  );
  return response.data;
}

export const updateAdminSolicitacao = (id: number, values: AdminSolicitacaoUpdateInput) =>
  saveManagerEntity<AdminSolicitacaoRecord, AdminSolicitacaoUpdateInput>(
    "admin-solicitacoes",
    values,
    id,
  );

export async function approveAdminSolicitacao(
  id: number,
  values: AdminSolicitacaoAprovarInput,
): Promise<AdminSolicitacaoAprovarResponse> {
  return managerRequest<AdminSolicitacaoAprovarResponse>({
    method: "POST",
    url: managerUrl(`admin-solicitacoes/${id}/aprovar/`),
    data: values,
  });
}

export async function denyAdminSolicitacao(
  id: number,
  values: { observacao_analise?: string; notificar_solicitante?: boolean },
): Promise<AdminSolicitacaoRecusarResponse> {
  return managerRequest<AdminSolicitacaoRecusarResponse>({
    method: "POST",
    url: managerUrl(`admin-solicitacoes/${id}/recusar/`),
    data: values,
  });
}

export const deleteAdminSolicitacao = (id: number) => deleteManagerEntity("admin-solicitacoes", id);

export function getAdminSolicitacaoDocumentoUrl(id: number, download = false): string {
  return managerUrl(`admin-solicitacoes/${id}/documento/${download ? "?download=1" : ""}`);
}

export async function getAdminTasks(): Promise<AdminTaskRecord[]> {
  const response = await axios.get<AdminTaskRecord[]>(managerUrl("admin-tasks/"), {
    withCredentials: true,
    timeout: 15000,
  });
  return response.data;
}

export async function updateAdminTaskSchedule(
  id: number,
  values: AdminTaskUpdateInput,
): Promise<AdminTaskRecord> {
  return managerRequest<AdminTaskRecord>({
    method: "PATCH",
    url: managerUrl(`admin-tasks/${id}/`),
    data: values,
  });
}

export async function runAdminTaskNow(
  id: number,
  params?: AdminTaskRunInput,
): Promise<AdminTaskRunResponse> {
  return managerRequest<AdminTaskRunResponse>({
    method: "POST",
    url: managerUrl(`admin-tasks/${id}/executar/`),
    data: params || {},
  });
}

export async function getAdminTaskLogs(): Promise<AdminTaskLogsResponse> {
  const response = await axios.get<AdminTaskLogsResponse>(managerUrl("admin-tasks/logs/"), {
    withCredentials: true,
    timeout: 15000,
  });
  return response.data;
}
