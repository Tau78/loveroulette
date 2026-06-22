import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Local dev only: parent folder is repo root (Love Game/), not web/.
  // On Vercel (rootDirectory=web) this breaks post-build (.next/package.json ENOENT).
  ...(process.env.VERCEL !== "1" && {
    turbopack: {
      root: appRoot,
    },
    outputFileTracingRoot: appRoot,
  }),
};

export default nextConfig;
