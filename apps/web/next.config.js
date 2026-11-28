/** @type {import('next').NextConfig} */
const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
const apiOrigin = apiBaseUrl.replace(/\/api$/i, '');

const nextConfig = {
  transpilePackages: ['@enxamistas/shared'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
}

module.exports = nextConfig
