import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: { entry: "src/index.ts", tsconfig: "./tsconfig.json" },
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["@ag-ui/client"],
});

