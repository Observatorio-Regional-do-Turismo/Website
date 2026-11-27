import { NextRequest, NextResponse } from "next/server";
import { getServerWebsiteApiBaseUrl } from "@/lib/website-api";

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg", ".webp"]);

function extractErrorMessage(data: unknown): string {
  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    const firstValue = Object.values(record)[0];
    if (Array.isArray(firstValue) && typeof firstValue[0] === "string") return firstValue[0];
    if (typeof firstValue === "string") return firstValue;
  }
  return "Não foi possível registrar sua solicitação no momento. Verifique os dados e tente novamente.";
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    let nome = "";
    let email = "";
    let telefone = "";
    let cargo = "";
    let orgao = "";
    let tipoVinculo = "cidade";
    let cidadeNome = "";
    let igrNome = "";
    let modulos: string[] = [];
    let usernameSugerido = "";
    let emailCadastro = "";
    let justificativa = "";
    let documentoFile: File | null = null;

    if (isMultipart) {
      const incoming = await request.formData();
      nome = String(incoming.get("nome") ?? "").trim();
      email = String(incoming.get("email") ?? "").trim();
      telefone = String(incoming.get("telefone") ?? "").trim();
      cargo = String(incoming.get("cargo") ?? "").trim();
      orgao = String(incoming.get("orgao") ?? "").trim();
      tipoVinculo = String(incoming.get("tipoVinculo") ?? "cidade").trim();
      cidadeNome = String(incoming.get("cidadeNome") ?? "").trim();
      igrNome = String(incoming.get("igrNome") ?? "").trim();
      usernameSugerido = String(incoming.get("usernameSugerido") ?? "").trim();
      emailCadastro = String(incoming.get("emailCadastro") ?? "").trim();
      justificativa = String(incoming.get("justificativa") ?? "").trim();

      const rawModulos = incoming.get("modulos");
      if (typeof rawModulos === "string" && rawModulos.trim()) {
        try {
          const parsed = JSON.parse(rawModulos);
          modulos = Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
          modulos = rawModulos
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean);
        }
      }

      const rawDoc =
        incoming.get("documentoComprobatorio") ?? incoming.get("documento_comprobatorio");
      if (rawDoc instanceof File && rawDoc.size > 0) {
        documentoFile = rawDoc;
      }
    } else {
      const body = await request.json();
      nome = String(body.nome ?? "").trim();
      email = String(body.email ?? "").trim();
      telefone = String(body.telefone ?? "").trim();
      cargo = String(body.cargo ?? "").trim();
      orgao = String(body.orgao ?? "").trim();
      tipoVinculo = String(body.tipoVinculo ?? "cidade").trim();
      cidadeNome = String(body.cidadeNome ?? "").trim();
      igrNome = String(body.igrNome ?? "").trim();
      usernameSugerido = String(body.usernameSugerido ?? "").trim();
      emailCadastro = String(body.emailCadastro ?? "").trim();
      justificativa = String(body.justificativa ?? "").trim();
      modulos = Array.isArray(body.modulos) ? body.modulos.map(String) : [];
    }

    if (!nome || !email || !telefone || !cargo || !tipoVinculo) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Preencha todos os campos obrigatórios (Nome, E-mail, Telefone, Cargo e Vínculo).",
        },
        { status: 400 },
      );
    }

    if (!documentoFile) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anexe um documento comprobatório (PDF ou imagem) que ateste sua representação institucional.",
        },
        { status: 400 },
      );
    }

    if (documentoFile.size > MAX_DOCUMENT_BYTES) {
      return NextResponse.json(
        {
          success: false,
          message: "O documento comprobatório deve ter no máximo 10 MB.",
        },
        { status: 400 },
      );
    }

    const dotIdx = documentoFile.name.lastIndexOf(".");
    const ext = dotIdx >= 0 ? documentoFile.name.slice(dotIdx).toLowerCase() : "";
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          success: false,
          message: "Formato de documento não permitido. Envie PDF, PNG, JPG ou WEBP.",
        },
        { status: 400 },
      );
    }

    const protocolo = `SOL-${new Date().getFullYear()}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;
    const dataRecebimento = new Date().toISOString();

    const upstreamForm = new FormData();
    upstreamForm.append("nome", nome);
    upstreamForm.append("email", email);
    upstreamForm.append("telefone", telefone);
    upstreamForm.append("cargo", cargo);
    upstreamForm.append("orgao", orgao);
    upstreamForm.append("tipo_vinculo", tipoVinculo);
    upstreamForm.append("cidade_nome", cidadeNome);
    upstreamForm.append("igr_nome", igrNome);
    upstreamForm.append("modulos", JSON.stringify(modulos));
    upstreamForm.append("username_sugerido", usernameSugerido);
    upstreamForm.append("email_cadastro", emailCadastro || email);
    upstreamForm.append("justificativa", justificativa);
    upstreamForm.append("protocolo", protocolo);
    upstreamForm.append("documento_comprobatorio", documentoFile, documentoFile.name);

    let upstreamData: unknown = null;
    try {
      const baseUrl = getServerWebsiteApiBaseUrl();
      const upstreamRes = await fetch(`${baseUrl}/solicitacoes-gestor/`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: upstreamForm,
        cache: "no-store",
      });

      upstreamData = await upstreamRes.json().catch(() => null);
      if (!upstreamRes.ok) {
        return NextResponse.json(
          {
            success: false,
            message: extractErrorMessage(upstreamData),
          },
          { status: upstreamRes.status >= 400 ? upstreamRes.status : 502 },
        );
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível conectar ao servidor para enviar sua solicitação. Tente novamente em instantes.",
        },
        { status: 502 },
      );
    }

    const finalProtocolo =
      typeof upstreamData === "object" &&
      upstreamData !== null &&
      "protocolo" in upstreamData &&
      typeof (upstreamData as { protocolo?: unknown }).protocolo === "string"
        ? (upstreamData as { protocolo: string }).protocolo
        : protocolo;

    return NextResponse.json(
      {
        success: true,
        protocolo: finalProtocolo,
        dataRecebimento,
        message:
          "Sua solicitação e o documento comprobatório foram registrados e encaminhados à coordenação do Observatório para análise.",
        detalhes: {
          nome,
          email,
          emailCadastro: emailCadastro || email,
          usernameSugerido: usernameSugerido || null,
          tipoVinculo,
          cidadeNome: cidadeNome || null,
          igrNome: igrNome || null,
          modulos,
          documentoNome: documentoFile.name,
          ...(typeof upstreamData === "object" && upstreamData !== null ? upstreamData : {}),
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Ocorreu um erro interno ao processar a inscrição. Tente novamente mais tarde.",
      },
      { status: 500 },
    );
  }
}
