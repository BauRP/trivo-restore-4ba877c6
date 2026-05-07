import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const LegacyApp = lazy(() => import("@/App"));

export const Route = createFileRoute("/$")({
  component: SplatRoute,
});

function SplatRoute() {
  return (
    <ClientOnly fallback={<div style={{ minHeight: "100vh", background: "#000" }} />}>
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "#000" }} />}>
        <LegacyApp />
      </Suspense>
    </ClientOnly>
  );
}
