import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: "./src/tests/setup.ts",
    exclude: ["dist/**", "node_modules/**"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
