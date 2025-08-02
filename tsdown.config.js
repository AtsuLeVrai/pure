import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  outDir: "dist",
  format: "esm",
  platform: "node",
  clean: true,
  treeshake: true,
  minify: true,
  sourcemap: false,
  tsconfig: "./tsconfig.json",
});
