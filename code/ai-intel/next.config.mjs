/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // better-sqlite3 是原生模块，需要让 Next 把它当外部依赖处理
  // Next 14 用 experimental.serverComponentsExternalPackages；Next 15 改名为 serverExternalPackages
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
  // @mi/ai-core 直接发 TS 源码，需要让 Next 用 SWC 编译它
  transpilePackages: ["@mi/ai-core"],
};

export default nextConfig;
