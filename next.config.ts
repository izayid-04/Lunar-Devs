import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Baked in once, at `next build` time (not at request time), so the
  // /status page can show exactly which build is currently deployed.
  env: {
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString(),
  },
};

export default nextConfig;
