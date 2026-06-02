import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const cloudinaryUploadProxy = {
  "/cloudinary-upload": {
    target: "https://api.cloudinary.com",
    changeOrigin: true,
    secure: true,
    rewrite: (path: string) => path.replace(/^\/cloudinary-upload/, ""),
  },
};

export default defineConfig({
  plugins: [react()],
  server: { proxy: cloudinaryUploadProxy },
  preview: { proxy: cloudinaryUploadProxy },
});
