import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: '/api/externo/estabelecimentos',
        destination: 'https://landscape-evaluating-twist-midnight.trycloudflare.com/api/estabelecimentos/',
      },
      {
        source: '/api/externo/funcionarios',
        destination: 'https://landscape-evaluating-twist-midnight.trycloudflare.com/api/funcionarios/',
      },
      {
        source: '/api/externo/estoque_acumulado',
        destination: 'https://landscape-evaluating-twist-midnight.trycloudflare.com/api/estoque_acumulado/',
      },
      {
        source: '/api/externo/postos_de_trabalho',
        destination: 'https://landscape-evaluating-twist-midnight.trycloudflare.com/api/postos_de_trabalho/',
      },
    ]
  },
};

export default nextConfig;
