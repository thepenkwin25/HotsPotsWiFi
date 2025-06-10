import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist"), // Separate build output directory
    emptyOutDir: true, // Ensures the output directory is cleaned before building
  },
  publicDir: path.resolve(__dirname, "client", "public"), // Separate public directory
  server: {
    fs: {
      strict: false,
      allow: [".."],
    },
    host: '127.0.0.1',
    port: 5000,
    strictPort: true,
    watch: {
      usePolling: true,
    },
    hmr: {
      protocol: 'ws',
      host: '127.0.0.1',
    },
  },
});
