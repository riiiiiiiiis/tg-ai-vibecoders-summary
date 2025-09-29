/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  },
  serverExternalPackages: ["pg"],
};

export default nextConfig;
