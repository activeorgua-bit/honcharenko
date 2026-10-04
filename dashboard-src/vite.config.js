import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

// БАЗА '/' (v2): новий дашборд живе на корені. Архів v1 збирається з
// VITE_BASE=/v1/ VITE_API_BASE=/v1 — та сама збірка, інший префікс; тому
// база береться зі змінної середовища, а не зашивається.
export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  base: process.env.VITE_BASE || "/",
  resolve: {
    // Шлях від файла конфігу, а не від cwd: dev-сервер запускається з іншого каталогу.
    alias: { $lib: fileURLToPath(new URL("./src/lib", import.meta.url)) },
  },
  build: {
    outDir: process.env.VITE_OUTDIR || "dist",
    emptyOutDir: true,
    // Вміст у назвах файлів робить версіонування непотрібним: старий
    // index.html не може випадково потягнути новий скрипт, бо адреса інша.
    // Саме через це в попередній збірці довелося вручну дописувати ?v=mtime.
    rollupOptions: {
      output: {
        manualChunks: {
          plot: ["svelteplot"],
        },
      },
    },
  },
  server: { port: 5177 },
});
