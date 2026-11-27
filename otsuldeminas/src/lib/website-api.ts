export interface PaginatedResult<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  page: number;
  pageSize: number;
  totalPages: number;
}

function normalizeBackendBase(rawUrl: string): string {
  const baseUrl = rawUrl.trim().replace(/\/+$/, "");
  return baseUrl.endsWith("/backend") ? baseUrl : `${baseUrl}/backend`;
}

export function getWebsiteApiBaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!rawUrl) {
    throw new Error("NEXT_PUBLIC_API_URL não está configurada.");
  }

  return normalizeBackendBase(rawUrl);
}

export function getServerWebsiteApiBaseUrl(): string {
  if (typeof window === "undefined") {
    const internalUrl = process.env.INTERNAL_BACKEND_URL?.trim();
    if (internalUrl) {
      return normalizeBackendBase(internalUrl);
    }
  }
  return getWebsiteApiBaseUrl();
}

function getPublicMediaOrigin(): string | null {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!rawUrl) return null;
  try {
    return new URL(rawUrl).origin;
  } catch {
    return null;
  }
}

export function normalizeMediaUrl(value: string): string {
  const publicOrigin = getPublicMediaOrigin();
  if (!publicOrigin) return value;

  if (value.startsWith("/_media/")) {
    return `${publicOrigin}${value}`;
  }

  if (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/_media\//i.test(value)) {
    return value.replace(/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i, publicOrigin);
  }

  return value;
}

export function normalizeMediaUrls<T>(payload: T): T {
  if (typeof payload === "string") {
    return normalizeMediaUrl(payload) as unknown as T;
  }
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeMediaUrls(item)) as unknown as T;
  }
  if (payload && typeof payload === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(payload as Record<string, unknown>)) {
      if (
        typeof val === "string" &&
        (key === "image" || key === "cover_image" || val.includes("/_media/"))
      ) {
        out[key] = normalizeMediaUrl(val);
      } else if (val && typeof val === "object") {
        out[key] = normalizeMediaUrls(val);
      } else {
        out[key] = val;
      }
    }
    return out as T;
  }
  return payload;
}

function buildEndpointUrl(
  baseUrl: string,
  endpoint: string,
  params?: Record<string, string | number | boolean | null | undefined>,
): string {
  const cleanEndpoint = endpoint.replace(/^\/+/, "");
  const url = new URL(cleanEndpoint, `${baseUrl}/`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function fetchPaginatedPage<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | null | undefined>,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<PaginatedResult<T>> {
  const baseUrl = getServerWebsiteApiBaseUrl();
  const page = Math.max(1, Number(params?.page) || 1);
  const pageSize = Math.max(1, Number(params?.page_size) || 20);
  const requestUrl = buildEndpointUrl(baseUrl, endpoint, {
    ...params,
    page,
    page_size: pageSize,
  });

  const response = await fetch(requestUrl, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
    signal: init?.signal ?? AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    throw new Error(`Falha ao consultar ${requestUrl}: HTTP ${response.status}`);
  }

  const raw = (await response.json()) as ApiPagination<T> | T[];
  const data = normalizeMediaUrls(raw);

  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data.slice(0, pageSize),
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(data.length / pageSize)),
    };
  }

  const results = Array.isArray(data?.results) ? data.results : [];
  const count = typeof data?.count === "number" ? data.count : results.length;
  return {
    count,
    next: data.next ?? null,
    previous: data.previous ?? null,
    results,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(count / pageSize)),
  };
}

export async function fetchServerPageSafe<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | null | undefined>,
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, Number(params?.page) || 1);
  const pageSize = Math.max(1, Number(params?.page_size) || 20);
  try {
    return await fetchPaginatedPage<T>(endpoint, params, { cache: "no-store" });
  } catch {
    return {
      count: 0,
      next: null,
      previous: null,
      results: [],
      page,
      pageSize,
      totalPages: 1,
    };
  }
}

export async function fetchAllPaginated<T>(
  endpoint: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<T[]> {
  const baseUrl = getServerWebsiteApiBaseUrl();
  const cleanEndpoint = endpoint.replace(/^\/+/, "");
  const initialUrl = new URL(cleanEndpoint, `${baseUrl}/`);
  if (!initialUrl.searchParams.has("page_size")) {
    initialUrl.searchParams.set("page_size", "200");
  }
  let nextUrl: string | null = initialUrl.toString();
  const results: T[] = [];

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.headers || {}),
      },
      signal: init?.signal ?? AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      throw new Error(`Falha ao consultar ${nextUrl}: HTTP ${response.status}`);
    }

    const raw = (await response.json()) as ApiPagination<T> | T[];
    const data = normalizeMediaUrls(raw);
    if (Array.isArray(data)) {
      results.push(...data);
      break;
    }

    if (!Array.isArray(data?.results)) {
      throw new Error(`Resposta paginada inválida para ${cleanEndpoint}.`);
    }

    results.push(...data.results);
    if (data.next) {
      const nextPageUrl = new URL(data.next, `${baseUrl}/`);
      if (nextUrl.startsWith("https://")) {
        nextPageUrl.protocol = "https:";
      } else if (nextUrl.startsWith("http://127.0.0.1") || nextUrl.startsWith("http://localhost")) {
        const parsedBase = new URL(baseUrl);
        nextPageUrl.protocol = parsedBase.protocol;
        nextPageUrl.host = parsedBase.host;
      }
      nextUrl = nextPageUrl.toString();
    } else {
      nextUrl = null;
    }
  }

  return results;
}

export async function fetchServerListSafe<T>(endpoint: string): Promise<T[]> {
  try {
    return await fetchAllPaginated<T>(endpoint, { cache: "no-store" });
  } catch {
    return [];
  }
}

export async function fetchServerEntityBySlugOrId<T>(
  resource: string,
  slugOrId: string,
): Promise<T | null> {
  try {
    const baseUrl = getServerWebsiteApiBaseUrl();
    const cleanResource = resource.replace(/^\/+|\/+$/g, "");
    const cleanTarget = decodeURIComponent(slugOrId).trim();
    if (!cleanTarget) return null;

    if (/^\d+$/.test(cleanTarget)) {
      const byIdRes = await fetch(`${baseUrl}/${cleanResource}/${cleanTarget}/`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(12000),
      });
      if (byIdRes.ok) {
        return normalizeMediaUrls((await byIdRes.json()) as T);
      }
    }

    const bySlugList = await fetchAllPaginated<T>(
      `/${cleanResource}/?slug=${encodeURIComponent(cleanTarget)}`,
      { cache: "no-store" },
    );
    return bySlugList[0] ?? null;
  } catch {
    return null;
  }
}

export async function fetchServerMapaOverview(): Promise<ApiMapaOverview> {
  try {
    const baseUrl = getServerWebsiteApiBaseUrl();
    const response = await fetch(`${baseUrl}/mapa/`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      return { cidades: [], pontos_turisticos: [], eventos: [], estabelecimentos: [] };
    }
    return normalizeMediaUrls((await response.json()) as ApiMapaOverview);
  } catch {
    return { cidades: [], pontos_turisticos: [], eventos: [], estabelecimentos: [] };
  }
}
