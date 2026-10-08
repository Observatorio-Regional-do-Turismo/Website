import axios, { AxiosResponse } from "axios";
import { getWebsiteApiBaseUrl } from "@/lib/website-api";

export async function fetchEventos(): Promise<ApiEventos[]> {
  const baseUrl = getWebsiteApiBaseUrl();
  let nextUrl: string | null = `${baseUrl}/eventos/`;
  const eventos: ApiEventos[] = [];

  while (nextUrl) {
    const response: AxiosResponse<ApiPagination<ApiEventos> | ApiEventos[]> =
      await axios.get(nextUrl, { timeout: 12000 });

    if (Array.isArray(response.data)) {
      eventos.push(...response.data);
      break;
    }

    const page = response.data as ApiPagination<ApiEventos>;
    if (!Array.isArray(page.results)) {
      throw new Error("A API retornou uma resposta de eventos inválida.");
    }
    eventos.push(...page.results);
    nextUrl = page.next ? new URL(page.next, `${baseUrl}/`).toString() : null;
  }

  return eventos.sort(
    (a, b) => new Date(a.start_date || "").getTime() - new Date(b.start_date || "").getTime()
  );
}
