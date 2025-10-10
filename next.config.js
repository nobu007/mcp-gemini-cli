/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@modelcontextprotocol/sdk"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("@modelcontextprotocol/sdk");
      // Exclude index.ts from the webpack build
      config.module.rules.push({
        test: /index\.ts$/,
        exclude: /index\.ts$/,
      });
    }
    return config;
  },
};

export default nextConfig;
