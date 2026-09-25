import { defineConfig } from 'tsup';

// Doble formato: CommonJS para NestJS y ESM para Vite.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
});
