import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-expect-error - Next.js types might not be up to date for this new config
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
    turbopack: false,
  },
};

export default nextConfig;
