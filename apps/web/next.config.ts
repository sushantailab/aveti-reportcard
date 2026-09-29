import path from "node:path";
import type { NextConfig } from "next";

// Kept intentionally small. Add config here only when a real need shows up —
// see docs/ARCHITECTURE.md at the repo root for the reasoning behind this app's
// structure.
const nextConfig: NextConfig = {
  turbopack: {
    // This app deliberately keeps its own package.json/lockfile (see
    // docs/ARCHITECTURE.md § "No monorepo tool") alongside the legacy static
    // site's package.json at the repo root. Two lockfiles otherwise leaves
    // Next.js guessing which directory is the project root.
    root: path.join(__dirname),
  },
};

export default nextConfig;
