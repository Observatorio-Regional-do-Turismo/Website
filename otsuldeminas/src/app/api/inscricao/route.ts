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
          message: "Preencha todos os campos obrigatórios (Nome, E-mail, Telefone, Cargo e Vínculo).",
        },
        { status: 400 }
      );
    }

    // Validação de senha se preenchida
    if (senha && senha.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "A senha desejada para cadastro deve conter no mínimo 6 caracteres.",
        },
        { status: 400 }
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

    try {
      const baseUrl = getWebsiteApiBaseUrl();
      const upstreamUrl = `${baseUrl}/solicitacoes-gestor/`;

      const upstreamRes = await fetch(upstreamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...body,
          modulos: finalModulos,
          protocolo,
          data_solicitacao: dataRecebimento,
          status: "pendente",
        }),
        cache: "no-store",
      });

      if (upstreamRes.ok) {
        upstreamSuccess = true;
        upstreamData = await upstreamRes.json().catch(() => null);
      }
    } catch (upstreamErr) {
      // Backend ainda não implementou o endpoint ou está indisponível
      console.warn("Aviso: backend upstream /solicitacoes-gestor/ não respondeu:", upstreamErr);
    }

    // Registra no console do servidor para auditoria/integração (sem expor a senha em claro)
    console.info(`[INSCRIÇÃO DE GESTOR REGISTRADA - Protocolo: ${protocolo}]`, {
      nome,
      email,
      emailCadastro: emailCadastro || email,
      senhaDefinida: Boolean(senha),
      telefone,
      cargo,
      orgao,
      tipoVinculo,
      cidadeNome,
      igrNome,
      modulos: finalModulos,
      justificativa,
      dataRecebimento,
      upstreamSuccess,
    });

    return NextResponse.json(
      {
        success: true,
        protocolo,
        dataRecebimento,
        message:
          "Sua solicitação de inscrição foi enviada com sucesso! Os dados foram encaminhados para a equipe do Observatório para análise e aprovação. Suas credenciais serão validadas e ativadas após a moderação.",
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
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao processar formulário de inscrição:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Ocorreu um erro interno ao processar a inscrição. Tente novamente mais tarde.",
      },
      { status: 500 }
    );
  }
}
