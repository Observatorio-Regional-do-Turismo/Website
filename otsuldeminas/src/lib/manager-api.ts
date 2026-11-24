import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
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

export type ManagerTargetType = "cidade" | "igr" | "evento" | "ponto_turistico" | "noticia";

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
}

export type ManagerLocalGeoInput = Omit<ManagerLocalGeo, "id" | "cidade_name">;

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
  return response.data;
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
  let nextUrl: string | null = managerUrl(path);
  const items: T[] = [];

  while (nextUrl) {
    const response: AxiosResponse<ApiPage<T> | T[]> = await axios.get<ApiPage<T> | T[]>(nextUrl, {
      withCredentials: true,
      timeout: 15000,
    });
    if (Array.isArray(response.data)) {
      items.push(...response.data);
      break;
    }
    if (!Array.isArray(response.data.results)) {
      throw new Error("A API de gestão retornou uma resposta inválida.");
    }
    items.push(...response.data.results);
    if (response.data.next) {
      const next = new URL(response.data.next, window.location.origin);
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
