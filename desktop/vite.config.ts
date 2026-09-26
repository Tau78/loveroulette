import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;
/** Target del proxy browser → evita CORS in `npm run dev`. */
const apiProxyTarget =
  process.env.VITE_API_PROXY_TARGET || "https://loveroulette.vercel.app";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
    proxy: {
      // Browser MVP: GET/POST /api/* → host Love Roulette (no CORS).
      // In Tauri il client usa @tauri-apps/plugin-http con URL assoluto.
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: true,
      },
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});
