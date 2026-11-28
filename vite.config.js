import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Three entry pages: the portal chooser, the Kunta Content admin portal and the client portal.
// base "./" keeps asset paths relative so the build works from any path (GitHub Pages included).
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "admin/index.html"),
        client: resolve(__dirname, "client/index.html"),
      },
    },
  },
});
