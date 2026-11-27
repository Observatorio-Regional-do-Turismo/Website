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
  usernameSugerido?: string;
  emailCadastro?: string;
  justificativa?: string;
  documentoComprobatorio: File;
}

export interface InscricaoResponse {
  success: boolean;
  message: string;
  protocolo?: string;
  dataRecebimento?: string;
  detalhes?: Record<string, unknown>;
}

/**
 * Envia o formulário de inscrição de gestor (com documento comprobatório via multipart/form-data)
 * para a rota BFF /api/inscricao, que valida e encaminha ao backend Django.
 */
export async function submitInscricao(data: InscricaoInput): Promise<InscricaoResponse> {
  const formData = new FormData();
  formData.append("nome", data.nome);
  formData.append("email", data.email);
  formData.append("telefone", data.telefone);
  formData.append("cargo", data.cargo);
  formData.append("orgao", data.orgao);
  formData.append("tipoVinculo", data.tipoVinculo);
  if (data.cidadeNome) formData.append("cidadeNome", data.cidadeNome);
  if (data.igrNome) formData.append("igrNome", data.igrNome);
  formData.append("modulos", JSON.stringify(data.modulos));
  if (data.usernameSugerido) formData.append("usernameSugerido", data.usernameSugerido);
  if (data.emailCadastro) formData.append("emailCadastro", data.emailCadastro);
  if (data.justificativa) formData.append("justificativa", data.justificativa);
  formData.append("documentoComprobatorio", data.documentoComprobatorio);

  try {
    const response = await axios.post<InscricaoResponse>("/api/inscricao", formData, {
      timeout: 25000,
    });
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw new Error(
      "Não foi possível enviar sua solicitação no momento. Tente novamente em instantes.",
    );
  }
}
