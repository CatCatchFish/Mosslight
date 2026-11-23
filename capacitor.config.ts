import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mosslight.expedition",
  appName: "微光防线",
  webDir: "dist",
  backgroundColor: "#191d16",
  plugins: {
    SystemBars: {
      hidden: true,
      initialViewportFitValueHint: "cover",
    },
  },
};
export default config;
