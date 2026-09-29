import axios from "axios";
import { type Cidade } from "@/data/cidades";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL;
const cleanUrl = rawBaseUrl ? rawBaseUrl.trim().replace(/\/$/, "") : undefined;
const CIDADES_API_BASE_URL = cleanUrl?.endsWith("/cidades") ? cleanUrl.replace(/\/cidades$/, "") : cleanUrl;
const CIDADES_API_PATH = "/cidades/";

type CidadesApiResponse =
  | Cidade[]
  | {
    data?: Cidade[];
    cidades?: Cidade[];
  };

const cidadesApi = axios.create({
  baseURL: CIDADES_API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

function getCidadesFromResponse(response: CidadesApiResponse): Cidade[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.cidades)) return response.cidades;
  if (Array.isArray(response.data)) return response.data;
  return [];
}

export async function fetchCidades(): Promise<Cidade[]> {
  if (!CIDADES_API_BASE_URL) return [];

  try {
    const response = await cidadesApi.get<CidadesApiResponse>(CIDADES_API_PATH);
    const cidades = getCidadesFromResponse(response.data);

    return cidades;
  } catch (error) {
    console.warn("Não foi possível carregar as cidades da API.", error);
    return [];
  }
}