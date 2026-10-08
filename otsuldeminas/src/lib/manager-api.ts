import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
export interface ManagerScope {
  type: "cidade" | "igr";
  id: number;
  name: string;
  slug: string;
}

export interface ManagerSession {
  username: string;
  scopes: ManagerScope[];
}

export interface ManagerCity {
  id: number;
  name: string;
  slug: string;
  description: string;
  state: number;
  state_name: string;
}

export interface ManagerIGR {
  id: number;
  name: string;
  slug: string;
  description: string;
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
}

export type ManagerNewsInput = Omit<ManagerNews, "id" | "cidade" | "igr">
  & Partial<Pick<ManagerNews, "cidade" | "igr">>;

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

export async function saveManagerNews(
  values: ManagerNewsInput,
  id?: number,
): Promise<ManagerNews> {
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
