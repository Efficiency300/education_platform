import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Allow tunneled dev hosts (ngrok, cloudflared, etc.) to reach the Vite
    // dev server. ``true`` disables the strict Host header check; safe for
    // dev only — production builds are served by the Nginx container.
    host: true,
    allowedHosts: true,
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true },
      "/health": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
