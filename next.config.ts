import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permitir solicitudes desde tu IP del backend
  allowedDevOrigins: ['https://web-production-8d7cb.up.railway.app'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // ✅ DESHABILITAR TypeScript strict checks durante el build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://web-production-8d7cb.up.railway.app'}/api/:path*`,
      },
    ]
  },
};

export default nextConfig;