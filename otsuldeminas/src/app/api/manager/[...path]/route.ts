import { NextRequest, NextResponse } from "next/server";
import { getWebsiteApiBaseUrl } from "@/lib/website-api";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const ALLOWED_PATH = /^(auth\/(csrf|login|logout|session)|gestao\/(cidades|igrs|noticias)(\/\d+)?)\/?$/;
const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);

async function proxyManagerRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const pathString = path.join("/");

  if (!ALLOWED_PATH.test(pathString) || !ALLOWED_METHODS.has(request.method)) {
    return NextResponse.json({ detail: "Rota de gestão não encontrada." }, { status: 404 });
  }

  const upstreamUrl = new URL(`${pathString}/${request.nextUrl.search}`, `${getWebsiteApiBaseUrl()}/`);
  const headers = new Headers();
  for (const name of ["cookie", "content-type", "origin", "referer", "x-csrftoken"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
    cache: "no-store",
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  for (const name of ["content-type", "cache-control", "vary"]) {
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
