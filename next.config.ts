import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lint is skipped during builds because eslint-config-next hangs at
  // config-load on this machine (verified: the untouched repo hangs the
  // same way; `npx eslint src` never lints a file). Types are still
  // checked — `tsc --noEmit` runs in the build and passes. Run lint in CI
  // or revisit when the eslint-config-next/FlatCompat combo moves.
  eslint: { ignoreDuringBuilds: true },
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
