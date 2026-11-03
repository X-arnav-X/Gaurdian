import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Keep server-only secrets available to local server functions without exposing
  // them through Vite's client-side import.meta.env replacement.
  const serverEnv = loadEnv(mode, process.cwd(), "");
  for (const name of [
    "AI_API_KEY",
    "AI_API_URL",
    "AI_MODEL",
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SECRET_KEY",
    "SUPABASE_JWKS_URL",
  ]) {
    if (!process.env[name] && serverEnv[name]) process.env[name] = serverEnv[name];
  }

  return {
    plugins: [
      tanstackStart({ server: { entry: "server" } }),
      viteReact(),
      tailwindcss(),
    ],
    resolve: { tsconfigPaths: true },
  };
});
