import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Capacitor mobile builds
  // output: 'export', // Uncomment for mobile static export

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'uploadthing.com' },
      { protocol: 'https', hostname: 'utfs.io' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
    unoptimized: false,
  },

  // TypeScript strict
  typescript: {
    ignoreBuildErrors: false,
  },

  // Server external packages (Node.js native modules)
  serverExternalPackages: ['better-sqlite3', 'bcryptjs'],

  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};

export default nextConfig;
