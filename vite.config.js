import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://52.79.119.232:8080/", // 백엔드 주소
        changeOrigin: true,
      },
    },
  },
});
