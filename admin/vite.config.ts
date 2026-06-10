import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { cloudinaryAdminApi } from "./vite-plugin-cloudinary-admin";

const cloudinaryUploadProxy = {
  "/cloudinary-upload": {
    target: "https://api.cloudinary.com",
    changeOrigin: true,
    secure: true,
    rewrite: (path: string) => path.replace(/^\/cloudinary-upload/, ""),
  },
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base =
    process.env.GITHUB_PAGES === "true" ? "/ShortiGo/" : "/";
  return {
    base,
    plugins: [react(), cloudinaryAdminApi(env)],
    server: { proxy: cloudinaryUploadProxy },
    preview: { proxy: cloudinaryUploadProxy },
  };
});
