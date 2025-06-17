/** @type {import('next').NextConfig} */
const nextConfig = {
  // appDir is now stable in Next.js 14, no need for experimental flag
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  typescript: {
    // 暂时跳过类型检查以加快构建
    ignoreBuildErrors: true,
  },
  eslint: {
    // 暂时跳过ESLint检查以加快构建
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.extensions = ['.tsx', '.ts', '.js', '.jsx', '.json']
    return config
  }
}

module.exports = nextConfig
