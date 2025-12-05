import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://theservrforthechuns.com/", // 백엔??주소
        changeOrigin: true,
      },
    },
  },
});
