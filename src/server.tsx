import { createRequestHandler } from "@tanstack/react-start/server";
import { getRouter } from "./router";

// Cloudflare Worker entry. TanStack Start выполняет SSR здесь,
// а статический клиент используется в Capacitor APK.
export default {
  async fetch(request: Request) {
    const handler = createRequestHandler({ request, createRouter: getRouter });
    return handler();
  },
};
