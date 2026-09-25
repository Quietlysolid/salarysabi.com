import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([".next/**", ".next-*/**", ".open-next/**", ".open-next-*/**", "dist/**", "supabase/.temp/**", "test-results/**", "next-env.d.ts", "worker-configuration.d.ts"]),
]);
