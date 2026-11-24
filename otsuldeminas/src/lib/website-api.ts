export function getWebsiteApiBaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!rawUrl) {
    throw new Error("NEXT_PUBLIC_API_URL não está configurada.");
  }

  const baseUrl = rawUrl.trim().replace(/\/+$/, "");
  return baseUrl.endsWith("/backend") ? baseUrl : `${baseUrl}/backend`;
}

export async function fetchAllPaginated<T>(
  endpoint: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<T[]> {
  const baseUrl = getWebsiteApiBaseUrl();
  const cleanEndpoint = endpoint.replace(/^\/+/, "");
  let nextUrl: string | null = `${baseUrl}/${cleanEndpoint}`;
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

    const data = (await response.json()) as ApiPagination<T> | T[];
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
    const baseUrl = getWebsiteApiBaseUrl();
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
        return (await byIdRes.json()) as T;
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
    const baseUrl = getWebsiteApiBaseUrl();
    const response = await fetch(`${baseUrl}/mapa/`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      return { cidades: [], pontos_turisticos: [], eventos: [], estabelecimentos: [] };
    }
    return (await response.json()) as ApiMapaOverview;
  } catch {
    return { cidades: [], pontos_turisticos: [], eventos: [], estabelecimentos: [] };
  }
}
