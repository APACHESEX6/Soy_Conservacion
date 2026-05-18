/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "mapbox-gl"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  ...(process.env.NODE_ENV === "production" && {
    async headers() {
      return [
        {
          source: "/api/:path*",
          headers: [
            {
              key: "Cache-Control",
              value: "no-store",
            },
          ],
        },
      ];
    },
  }),
};

export default nextConfig;
