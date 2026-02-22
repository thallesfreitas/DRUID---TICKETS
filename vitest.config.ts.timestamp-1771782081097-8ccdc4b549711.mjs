// vitest.config.ts
import { defineConfig } from "file:///sessions/modest-optimistic-lamport/mnt/DRUID---TICKETS/node_modules/vitest/dist/config.js";
import react from "file:///sessions/modest-optimistic-lamport/mnt/DRUID---TICKETS/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "/sessions/modest-optimistic-lamport/mnt/DRUID---TICKETS";
var vitest_config_default = defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "tests/",
        "dist/",
        "**/*.test.*",
        "**/index.ts",
        "**/*.config.ts",
        "server.ts"
      ],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
      all: false
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./"),
      "@api": path.resolve(__vite_injected_original_dirname, "./api"),
      "@src": path.resolve(__vite_injected_original_dirname, "./src"),
      "@tests": path.resolve(__vite_injected_original_dirname, "./tests")
    }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9zZXNzaW9ucy9tb2Rlc3Qtb3B0aW1pc3RpYy1sYW1wb3J0L21udC9EUlVJRC0tLVRJQ0tFVFNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9zZXNzaW9ucy9tb2Rlc3Qtb3B0aW1pc3RpYy1sYW1wb3J0L21udC9EUlVJRC0tLVRJQ0tFVFMvdml0ZXN0LmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vc2Vzc2lvbnMvbW9kZXN0LW9wdGltaXN0aWMtbGFtcG9ydC9tbnQvRFJVSUQtLS1USUNLRVRTL3ZpdGVzdC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICB0ZXN0OiB7XG4gICAgZ2xvYmFsczogdHJ1ZSxcbiAgICBlbnZpcm9ubWVudDogJ2hhcHB5LWRvbScsXG4gICAgc2V0dXBGaWxlczogWycuL3Rlc3RzL3NldHVwLnRzJ10sXG4gICAgaW5jbHVkZTogWyd0ZXN0cy8qKi8qLnRlc3Que3RzLHRzeH0nXSxcbiAgICBleGNsdWRlOiBbJ25vZGVfbW9kdWxlcycsICdkaXN0J10sXG4gICAgY292ZXJhZ2U6IHtcbiAgICAgIHByb3ZpZGVyOiAndjgnLFxuICAgICAgcmVwb3J0ZXI6IFsndGV4dCcsICdqc29uJywgJ2h0bWwnLCAnbGNvdiddLFxuICAgICAgZXhjbHVkZTogW1xuICAgICAgICAnbm9kZV9tb2R1bGVzLycsXG4gICAgICAgICd0ZXN0cy8nLFxuICAgICAgICAnZGlzdC8nLFxuICAgICAgICAnKiovKi50ZXN0LionLFxuICAgICAgICAnKiovaW5kZXgudHMnLFxuICAgICAgICAnKiovKi5jb25maWcudHMnLFxuICAgICAgICAnc2VydmVyLnRzJ1xuICAgICAgXSxcbiAgICAgIGxpbmVzOiA4MCxcbiAgICAgIGZ1bmN0aW9uczogODAsXG4gICAgICBicmFuY2hlczogNzUsXG4gICAgICBzdGF0ZW1lbnRzOiA4MCxcbiAgICAgIGFsbDogZmFsc2VcbiAgICB9XG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi8nKSxcbiAgICAgICdAYXBpJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vYXBpJyksXG4gICAgICAnQHNyYyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgICAgJ0B0ZXN0cyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3Rlc3RzJylcbiAgICB9XG4gIH1cbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEyVixTQUFTLG9CQUFvQjtBQUN4WCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBRmpCLElBQU0sbUNBQW1DO0FBSXpDLElBQU8sd0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixNQUFNO0FBQUEsSUFDSixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixZQUFZLENBQUMsa0JBQWtCO0FBQUEsSUFDL0IsU0FBUyxDQUFDLDBCQUEwQjtBQUFBLElBQ3BDLFNBQVMsQ0FBQyxnQkFBZ0IsTUFBTTtBQUFBLElBQ2hDLFVBQVU7QUFBQSxNQUNSLFVBQVU7QUFBQSxNQUNWLFVBQVUsQ0FBQyxRQUFRLFFBQVEsUUFBUSxNQUFNO0FBQUEsTUFDekMsU0FBUztBQUFBLFFBQ1A7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSxPQUFPO0FBQUEsTUFDUCxXQUFXO0FBQUEsTUFDWCxVQUFVO0FBQUEsTUFDVixZQUFZO0FBQUEsTUFDWixLQUFLO0FBQUEsSUFDUDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLElBQUk7QUFBQSxNQUNqQyxRQUFRLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdkMsUUFBUSxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3ZDLFVBQVUsS0FBSyxRQUFRLGtDQUFXLFNBQVM7QUFBQSxJQUM3QztBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
