import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import legacyCss from "../index.css?url";

export const Route = createRootRoute({
  ssr: false,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0, viewport-fit=cover",
      },
      { title: "Trivo Chat" },
      { name: "description", content: "Защищенный мессенджер нового поколения" },
      { name: "author", content: "Lovable" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Trivo Chat" },
      { property: "og:description", content: "Защищенный мессенджер нового поколения" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Trivo Chat" },
      { name: "twitter:description", content: "Защищенный мессенджер нового поколения" },
    ],
    links: [
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: legacyCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => null,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
