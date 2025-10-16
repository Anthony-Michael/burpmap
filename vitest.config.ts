import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    globals: true,
    coverage: {
      reporter: ["text", "html"],
    },
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
