import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  base: "./",
  tanstackStart: {
    spa: {
      enabled: true,
      maskPath: "/",
      prerender: {
        outputPath: "/index",
        crawlLinks: false,
        retryCount: 0,
      },
    },
    prerender: {
      enabled: true,
      crawlLinks: false,
      failOnError: true,
    },
  },
});
