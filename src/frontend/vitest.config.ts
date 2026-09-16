import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      clean: true,
      exclude: ["src/**/*.test.{ts,tsx}", "src/test/**", "src/main.tsx"],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "lcov", "cobertura"],
      reportsDirectory: "./coverage",
      reportOnFailure: true,
    },
    environment: "jsdom",
    restoreMocks: true,
    setupFiles: "./src/test/setup.ts",
  },
});
