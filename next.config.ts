import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['whatsapp-web.js'],
  output: 'standalone',
};

export default nextConfig;
