import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

// Hybrid mount: the original Vite SPA App lives entirely on the client.
// TanStack Start owns the SSR shell; React Router DOM handles in-app routing
// inside <App />. This preserves the ZIP source verbatim — no logic rewrites.
// Cache-busting version pin forces ClientOnly to remount on hot reload.
const LEGACY_APP_VERSION = "supabase-realtime-v1";
const LegacyApp = lazy(() => import("@/App"));

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  return (
    <ClientOnly fallback={<div style={{ minHeight: "100vh", background: "#000" }} />}>
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "#000" }} />}>
        <LegacyApp key={LEGACY_APP_VERSION} />
      </Suspense>
    </ClientOnly>
  );
}
