// @lovable.dev/vite-tanstack-config already includes the TanStack Start plugin
// and sane defaults. Do NOT override `base`, `outDir`, `ssr.noExternal`, or
// `assetsInlineLimit` here — those break SSR (React bundling pulls in
// CommonJS `module` references and Vite's ESM evaluator throws
// "ReferenceError: module is not defined").
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({});
