import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: {
    entry: "src/index.ts",
  },
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: "es2020",
  external: ["react", "react-dom"],
});
