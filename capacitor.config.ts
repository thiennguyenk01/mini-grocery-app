import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.taphoamini.app",
  appName: "Tạp Hóa Mini",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
