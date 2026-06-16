import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: path.resolve(import.meta.dirname, "src/dashboard"),
  base: "/",
  publicDir: false,
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    outDir: path.resolve(import.meta.dirname, "dashboard"),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(import.meta.dirname, "src/dashboard/index.html")
    }
  }
});
