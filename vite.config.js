import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" so the built site works from any path (GitHub Pages, a subfolder, or file hosting).
export default defineConfig({
  plugins: [react()],
  base: "./",
});
