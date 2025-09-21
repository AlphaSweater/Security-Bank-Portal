import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
import { fileURLToPath, URL } from "url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      components: fileURLToPath(new URL("./src/components", import.meta.url)),
      pages: fileURLToPath(new URL("./src/pages", import.meta.url)),
      assets: fileURLToPath(new URL("./src/assets", import.meta.url)),
      // Add more aliases as needed
    },
  },
  server: {
    https: {
      key: "../server/certs/server.key",
      cert: "../server/certs/server.crt",
    },
    proxy: {
      "/api": {
        target: "https://localhost:5000", // match backend HTTPS port
        changeOrigin: true,
        secure: false, // allow self-signed certs in dev
      },
    },
  },
});
