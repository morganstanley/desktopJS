import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

const sharedConfig = {
  plugins: [
    dts({
      include: ['src'],
      exclude: ['**/*.spec.ts', '**/*.test.ts'],
      rollupTypes: true
    })
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/openfin.ts'),
      name: 'desktopJSOpenFin',
    },
    rollupOptions: {
      external: ['@morgan-stanley/desktopjs'],
      output: {
        globals: {
          '@morgan-stanley/desktopjs': 'desktopJS'
        }
      }
    }
  }
};

export default defineConfig(({ mode }) => {
  return {
    ...sharedConfig,
    build: {
      ...sharedConfig.build,
      lib: {
        ...sharedConfig.build.lib,
        formats: ['umd'],
        fileName: (format) => `desktopjs-openfin.${format}.js`
      },
      minify: false,
      outDir: 'dist'
    }
  };
});
