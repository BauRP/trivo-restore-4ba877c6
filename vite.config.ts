// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    // Господин, переносим base сюда. Это гарантирует, что в index.html 
    // пути будут ./assets/..., и Android сможет их прочитать.
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      // Собираем всё в один файл, чтобы избежать проблем с путями в мессенджере
      assetsInlineLimit: 0, 
    },
    // Настройка для стабильной работы серверной части и P2P (Trivo Chat)
    ssr: {
      noExternal: true,
    }
  }
});
