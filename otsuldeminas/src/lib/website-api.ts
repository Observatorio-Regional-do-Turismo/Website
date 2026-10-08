export function getWebsiteApiBaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!rawUrl) {
    throw new Error("NEXT_PUBLIC_API_URL não está configurada.");
  }

  const baseUrl = rawUrl.trim().replace(/\/+$/, "");
  return baseUrl.endsWith("/backend") ? baseUrl : `${baseUrl}/backend`;
}
