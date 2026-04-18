import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const BACKEND_URL = process.env.VITE_BACKEND_URL || "http://localhost:8787";

const PROXIED_PATHS = [
  "/api",
  "/health",
  "/fetch-site",
  "/generate",
  "/patch",
  "/multi-patch",
  "/regenerate-subtree",
  "/parse-html",
];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: PROXIED_PATHS.reduce<Record<string, { target: string; changeOrigin: boolean }>>(
      (acc, p) => {
        acc[p] = { target: BACKEND_URL, changeOrigin: true };
        return acc;
      },
      {},
    ),
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
