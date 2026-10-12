import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const apiProxyTarget =
    process.env.VITE_API_PROXY_TARGET ??
    (mode === "docker" ? "http://127.0.0.1:8081" : "http://127.0.0.1:5118");

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          cookiePathRewrite: {
            "/auth": "/api/auth",
          },
          rewrite: (path) => path.replace(/^\/api(?=\/|$)/, ""),
        },
      },
    },
  };
});
