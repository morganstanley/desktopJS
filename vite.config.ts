import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

// Shared Vite configuration for all packages
export default defineConfig({
  plugins: [dts()],
  build: {
    sourcemap: true,
    minify: false,
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'packages/desktopjs/src/desktop.ts'),
      formats: ['umd'],
      fileName: (format, entryName) => `${entryName}.${format}.js`,
    },
    rollupOptions: {
      external: ['electron'],
      output: {
        globals: {
          electron: 'electron',
        },
      },
    },
  },
  test: {
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['packages/**/src/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.spec.ts'],
      reportsDirectory: './build/coverage'
    },
  }
});
