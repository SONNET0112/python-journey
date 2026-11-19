import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  // only the Pages build needs a subpath; dev/preview/tests stay at root
  base: process.env.PAGES_BASE || "/",
  plugins: [react(), tailwindcss()],
  server: { port: 5188 },
  preview: { port: 4188 },
});
