import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: here,
  // Base path for GitHub Pages (https://<user>.github.io/Skeletonify/).
  // Override with VITE_BASE=/ for local dev.
  base: process.env.VITE_BASE ?? "/Skeletonify/",
  plugins: [react(), tailwindcss()],
  server: { port: 5173, open: true },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
