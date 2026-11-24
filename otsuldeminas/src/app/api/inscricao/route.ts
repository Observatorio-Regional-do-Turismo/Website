import { NextRequest, NextResponse } from "next/server";
import { getWebsiteApiBaseUrl } from "@/lib/website-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      nome,
      email,
      telefone,
      cargo,
      orgao,
      tipoVinculo,
      cidadeNome,
      igrNome,
      modulos,
      emailCadastro,
      senha,
      justificativa,
    } = body;

    // Validação básica dos campos obrigatórios
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

    // Validação de senha se preenchida
    if (senha && senha.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "A senha desejada para cadastro deve conter no mínimo 6 caracteres.",
        },
        { status: 400 },
      );
    }

    const finalModulos = Array.isArray(modulos) ? modulos : [];
    const protocolo = `SOL-${new Date().getFullYear()}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;
    const dataRecebimento = new Date().toISOString();

    // Tentar encaminhar para o backend Django upstream se disponível
    let upstreamSuccess = false;
    let upstreamData: unknown = null;

    const upstreamPayload = {
      nome: String(nome).trim(),
      email: String(email).trim(),
      telefone: String(telefone).trim(),
      cargo: String(cargo).trim(),
      orgao: orgao ? String(orgao).trim() : "",
      tipoVinculo: String(tipoVinculo).trim(),
      cidadeNome: cidadeNome ? String(cidadeNome).trim() : "",
      igrNome: igrNome ? String(igrNome).trim() : "",
      modulos: finalModulos.map((m) => String(m)),
      emailCadastro: emailCadastro ? String(emailCadastro).trim() : String(email).trim(),
      justificativa: justificativa ? String(justificativa).trim() : "",
      protocolo,
      data_solicitacao: dataRecebimento,
      status: "pendente",
    };

    try {
      const baseUrl = getWebsiteApiBaseUrl();
      const upstreamUrl = `${baseUrl}/solicitacoes-gestor/`;

      const upstreamRes = await fetch(upstreamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(upstreamPayload),
        cache: "no-store",
      });

      upstreamData = await upstreamRes.json().catch(() => null);
      if (upstreamRes.ok) {
        upstreamSuccess = true;
      } else {
        const upstreamErr =
          typeof upstreamData === "object" &&
          upstreamData !== null &&
          "detail" in upstreamData &&
          typeof (upstreamData as { detail?: unknown }).detail === "string"
            ? (upstreamData as { detail: string }).detail
            : "Não foi possível enviar o e-mail de solicitação no momento. Verifique os dados e tente novamente.";

        return NextResponse.json(
          {
            success: false,
            message: upstreamErr,
          },
          { status: upstreamRes.status >= 400 ? upstreamRes.status : 502 },
        );
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível conectar ao servidor para enviar o e-mail da solicitação. Tente novamente em instantes.",
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

    console.info(`[INSCRIÇÃO DE GESTOR REGISTRADA - Protocolo: ${finalProtocolo}]`, {
      tipoVinculo: upstreamPayload.tipoVinculo,
      senhaDefinida: Boolean(senha),
      dataRecebimento,
      upstreamSuccess,
    });

    return NextResponse.json(
      {
        success: true,
        protocolo: finalProtocolo,
        dataRecebimento,
        message:
          "Sua solicitação foi enviada por e-mail para a equipe do Observatório (observatoriodoturismomg@gmail.com) e registrada com sucesso para análise.",
        detalhes: {
          nome,
          email,
          emailCadastro: emailCadastro || email,
          tipoVinculo,
          cidadeNome: cidadeNome || null,
          igrNome: igrNome || null,
          modulos: finalModulos,
          upstreamIntegrado: upstreamSuccess,
          ...(typeof upstreamData === "object" && upstreamData !== null ? upstreamData : {}),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao processar formulário de inscrição:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Ocorreu um erro interno ao processar a inscrição. Tente novamente mais tarde.",
      },
      { status: 500 },
    );
  }
}
