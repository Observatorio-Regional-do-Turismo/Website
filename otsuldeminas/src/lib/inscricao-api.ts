import axios from "axios";
import { getWebsiteApiBaseUrl } from "@/lib/website-api";

export type TipoVinculo = "cidade" | "igr" | "ambas";
export type ModuloGestao = "eventos" | "noticias";

export interface InscricaoInput {
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  orgao: string;
  tipoVinculo: TipoVinculo;
  cidadeId?: string | number;
  cidadeNome?: string;
  igrId?: string | number;
  igrNome?: string;
  modulos: ModuloGestao[];
  emailCadastro?: string;
  senha?: string;
  justificativa?: string;
}

export interface InscricaoResponse {
  success: boolean;
  message: string;
  protocolo?: string;
  dataRecebimento?: string;
  detalhes?: Record<string, unknown>;
}

/**
 * Envia o formulário de inscrição do gestor para ser aceito/analisado pela equipe do Observatório.
 * Tenta primeiro a rota interna Next.js /api/inscricao (que faz proxy e fallback inteligente),
 * ou diretamente o endpoint do backend Django se configurado.
 */
export async function submitInscricao(data: InscricaoInput): Promise<InscricaoResponse> {
  try {
    const response = await axios.post<InscricaoResponse>("/api/inscricao", data, {
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (err) {
    // Se a rota local não responder, tenta diretamente a URL base da API se disponível
    try {
      const baseUrl = getWebsiteApiBaseUrl();
      const directResponse = await axios.post<InscricaoResponse>(
        `${baseUrl}/solicitacoes-gestor/`,
        data,
        { timeout: 15000 }
      );
      return directResponse.data;
    } catch {
      // Se ambas falharem por falta de endpoint no backend, retorna erro tratado
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error("Não foi possível enviar a solicitação. Verifique sua conexão e tente novamente.");
    }
  }
}
