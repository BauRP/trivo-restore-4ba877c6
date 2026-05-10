// Cloudflare Worker entry. Делегируем стандартному обработчику TanStack Start.
// SSR/RPC сохраняются полностью; в APK используется только статический клиент.
export { default } from "@tanstack/react-start/server-entry";
