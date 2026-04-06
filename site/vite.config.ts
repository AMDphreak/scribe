import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

// GitHub Pages project site: https://amdphreak.github.io/scribe/
export default defineConfig({
  plugins: [solid()],
  base: "/scribe/",
  build: {
    outDir: "dist",
    // Antora output can be copied to dist/docs/ for /scribe/docs/ subpath
    emptyOutDir: true,
  },
});
