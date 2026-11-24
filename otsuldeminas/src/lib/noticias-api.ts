import { fetchAllPaginated } from "@/lib/website-api";

export async function fetchNoticias(): Promise<ApiNoticia[]> {
  try {
    const noticias = await fetchAllPaginated<ApiNoticia>("noticias/");
    return noticias.sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes("HTTP 404")) {
      return [];
    }
    throw err;
  }
}

export function getNoticiasDestaque(noticias: ApiNoticia[]): ApiNoticia[] {
  return noticias.filter((noticia) => noticia.is_featured);
}
