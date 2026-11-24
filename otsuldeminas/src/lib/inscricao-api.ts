import axios from "axios";

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
      timeout: 20000,
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw new Error(
      "Não foi possível enviar a solicitação. Verifique sua conexão e tente novamente.",
    );
  }
}
