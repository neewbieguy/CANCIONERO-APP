import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // "server-only" lanza error fuera de Next; en tests lo reemplazamos por un módulo vacío
      "server-only": path.resolve(__dirname, "tests/server-only-stub.ts"),
    },
  },
});
