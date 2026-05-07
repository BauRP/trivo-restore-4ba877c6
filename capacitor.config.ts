import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.trivochat",
  appName: "Trivo Chat",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
