import axios, { AxiosResponse } from "axios";
import { getWebsiteApiBaseUrl } from "@/lib/website-api";

export async function fetchNoticias(): Promise<ApiNoticia[]> {
  const baseUrl = getWebsiteApiBaseUrl();
  let nextUrl: string | null = `${baseUrl}/noticias/`;
  const noticias: ApiNoticia[] = [];

  while (nextUrl) {
    const response: AxiosResponse<ApiPagination<ApiNoticia> | ApiNoticia[]> =
      await axios.get(nextUrl, { timeout: 12000 });

    if (Array.isArray(response.data)) {
      noticias.push(...response.data);
      break;
    }

    const page = response.data as ApiPagination<ApiNoticia>;
    if (!Array.isArray(page.results)) {
      throw new Error("A API retornou uma resposta de notícias inválida.");
    }
    noticias.push(...page.results);
    nextUrl = page.next ? new URL(page.next, `${baseUrl}/`).toString() : null;
  }

  return noticias.sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

export function getNoticiasDestaque(noticias: ApiNoticia[]): ApiNoticia[] {
  return noticias.filter((noticia) => noticia.is_featured);
}
