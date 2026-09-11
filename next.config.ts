import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg'],
  transpilePackages: ['@electric-sql/pglite'],
};

export default nextConfig;
