import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import rollupReplace from '@rollup/plugin-replace';
import { version } from './package.json';

// Shared config for all builds
const sharedConfig = {
  plugins: [
    dts({
      include: ['src'],
      exclude: ['**/*.spec.ts', '**/*.test.ts'],
      rollupTypes: true
    }),
    rollupReplace({
      preventAssignment: true,
      'PACKAGE_VERSION': version
    })
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/desktop.ts'),
      name: 'desktopJS',
    },
    rollupOptions: {
      output: {
        globals: {}
      }
    }
  }
};

// Config for different build modes
export default defineConfig(({ mode }) => {
  if (mode === 'iife') {
    return {
      ...sharedConfig,
      build: {
        ...sharedConfig.build,
        lib: {
          ...sharedConfig.build.lib,
          formats: ['iife'],
          fileName: () => 'desktopjs.js'
        },
        outDir: 'dist/iife',
        minify: 'esbuild'
      }
    };
  }

  return {
    ...sharedConfig,
    build: {
      ...sharedConfig.build,
      lib: {
        ...sharedConfig.build.lib,
        formats: ['umd'],
        fileName: (format) => `desktop.${format}.js`
      },
      minify: false,
      outDir: 'dist'
    }
  };
});
