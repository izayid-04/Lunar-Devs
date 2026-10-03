import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Baked in once, at `next build` time (not at request time), so the
  // /status page can show exactly which build is currently deployed.
  env: {
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString(),
  },
  images: {
    // next/image optimization needs `sharp` at runtime ; pnpm-workspace.yaml
    // désactive volontairement son build natif (ERR_PNPM_BUILD_THREAD_POOL
    // sur Hodifly, voir docs/DEPLOIEMENT.md). On optimise donc les images
    // nous-mêmes en amont (WebP compressé dans public/) plutôt que de
    // dépendre d'un sharp potentiellement absent en production.
    unoptimized: true,
  },
};

export default nextConfig;
