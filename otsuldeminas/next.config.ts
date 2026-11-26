import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
    ];
  },
  async rewrites() {
    const internalBackend = process.env.INTERNAL_BACKEND_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/externo/estabelecimentos",
        destination:
          `${internalBackend}/api/estabelecimentos/`,
      },
      {
        source: "/api/externo/funcionarios",
        destination:
          `${internalBackend}/api/funcionarios/`,
      },
      {
        source: "/api/externo/estoque_acumulado",
        destination:
          `${internalBackend}/api/estoque_acumulado/`,
      },
      {
        source: "/api/externo/postos_de_trabalho",
        destination:
          `${internalBackend}/api/postos_de_trabalho/`,
      },
    ];
  },
};

export default nextConfig;
