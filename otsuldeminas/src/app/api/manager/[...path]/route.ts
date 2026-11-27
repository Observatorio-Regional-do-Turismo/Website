import { NextRequest, NextResponse } from "next/server";
import { getServerWebsiteApiBaseUrl } from "@/lib/website-api";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const ALLOWED_PATH =
  /^(auth\/(csrf|login|logout|session)|gestao\/(cidades(\/(igrs-disponiveis|\d+\/(vincular-igr|desvincular-igr))?)?|igrs(\/(cidades-disponiveis|\d+\/(vincular-cidade|desvincular-cidade))?)?|(noticias|eventos|pontos-turisticos|locais|imagens)(\/\d+)?|admin-gestores(\/\d+(\/alterar-senha)?)?|admin-cidades(\/\d+)?|admin-igrs(\/\d+)?|admin-eventos(\/\d+)?|admin-noticias(\/\d+)?|admin-pontos-turisticos(\/\d+)?|admin-locais(\/\d+)?|admin-solicitacoes(\/\d+(\/(aprovar|recusar|documento))?)?|admin-estados|admin-tasks(\/(\d+(\/executar)?|logs))?))\/?$/;
const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);
const MAX_BODY_BYTES = 12 * 1024 * 1024;

async function proxyManagerRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const pathString = path.join("/");

  if (!ALLOWED_PATH.test(pathString) || !ALLOWED_METHODS.has(request.method)) {
    return NextResponse.json({ detail: "Rota de gestão não encontrada." }, { status: 404 });
  }

  let bodyBuffer: ArrayBuffer | undefined;
  if (!["GET", "HEAD"].includes(request.method)) {
    bodyBuffer = await request.arrayBuffer();
    if (bodyBuffer.byteLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { detail: "Tamanho máximo da requisição excedido." },
        { status: 413 },
      );
    }
  }

  const upstreamUrl = new URL(
    `${pathString}/${request.nextUrl.search}`,
    `${getServerWebsiteApiBaseUrl()}/`,
  );
  const headers = new Headers();
  for (const name of ["cookie", "content-type", "origin", "referer", "x-csrftoken"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: bodyBuffer,
    cache: "no-store",
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  for (const name of [
    "content-type",
    "content-disposition",
    "cache-control",
    "vary",
    "x-content-type-options",
  ]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookie);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = proxyManagerRequest;
export const POST = proxyManagerRequest;
export const PATCH = proxyManagerRequest;
export const DELETE = proxyManagerRequest;
