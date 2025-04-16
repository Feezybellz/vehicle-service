import { defineConfig, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    {
      name: "treat-js-files-as-jsx",
      async transform(code, id) {
        if (!id.match(/src\/.*\.js$/)) return null;

        // Use the exposed transform from vite, instead of directly
        // transforming with esbuild
        return transformWithEsbuild(code, id, {
          loader: "jsx",
          jsx: "automatic",
        });
      },
    },
    react(),
  ],

  env: {
    VITE_API_URL: process.env.VITE_API_URL || "http://localhost:5000/api",
  },

  // If your app uses absolute imports or custom paths
  resolve: {
    alias: {
      // Add any path aliases your project uses
      // '@': '/src',
    },
  },
  optimizeDeps: {
    force: true,
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
  server: {
    port: process.env.VITE_PORT || 3000,
    allowedHosts: ["localhost", "127.0.0.1", process.env.VITE_APP_URL],
  },
});
