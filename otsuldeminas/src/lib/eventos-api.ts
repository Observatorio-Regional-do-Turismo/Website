import { fetchAllPaginated } from "@/lib/website-api";

export async function fetchEventos(): Promise<ApiEventos[]> {
  const eventos = await fetchAllPaginated<ApiEventos>("eventos/");
  return eventos.sort(
    (a, b) => new Date(a.start_date || "").getTime() - new Date(b.start_date || "").getTime(),
  );
}
