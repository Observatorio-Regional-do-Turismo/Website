import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/externo/estabelecimentos',
        destination: 'https://though-ages-complicated-ipaq.trycloudflare.com/api/estabelecimentos/',
      },
      {
        source: '/api/externo/funcionarios',
        destination: 'https://though-ages-complicated-ipaq.trycloudflare.com/api/funcionarios/',
      },
      {
        source: '/api/externo/estoque_acumulado',
        destination: 'https://though-ages-complicated-ipaq.trycloudflare.com/api/estoque_acumulado/',
      },
      {
        source: '/api/externo/postos_de_trabalho',
        destination: 'https://though-ages-complicated-ipaq.trycloudflare.com/api/postos_de_trabalho/',
      },
    ]
  },
};

export default nextConfig;
