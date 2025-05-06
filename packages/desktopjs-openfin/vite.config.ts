/*
 * Morgan Stanley makes this available to you under the Apache License,
 * Version 2.0 (the "License"). You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0.
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Unless required by applicable law or agreed
 * to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

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
