// @lovable.dev/vite-tanstack-config already includes the TanStack Start plugin
// and sane defaults. Keep assets relative for Capacitor's Android WebView, but
// do not override `outDir`, `ssr.noExternal`, or `assetsInlineLimit` because
// those break SSR and the Lovable preview.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  base: "./",
});
