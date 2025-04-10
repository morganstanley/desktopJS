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
      entry: resolve(__dirname, 'src/electron.ts'),
      name: 'desktopJSElectron',
    },
    rollupOptions: {
      external: ['electron', '@morgan-stanley/desktopjs'],
      output: {
        globals: {
          electron: 'electron',
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
        fileName: (format) => `desktopjs-electron.${format}.js`
      },
      minify: false,
      outDir: 'dist'
    },
    test: {
      include: ['tests/**/*.spec.ts'],
      coverage: {
        reporter: ['text', 'json', 'html'],
        reportsDirectory: './build/coverage'
      },
    }
  };
});
