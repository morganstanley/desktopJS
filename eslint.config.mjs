import eslint from '@eslint/js';
import * as tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginN from 'eslint-plugin-n';
import eslintPluginPromise from 'eslint-plugin-promise';
import licenseHeader from 'eslint-plugin-license-header'; // Import the license header plugin
import globals from 'globals'; // Import globals
import path from 'node:path'; // Import path module
import { fileURLToPath } from 'node:url'; // Import fileURLToPath

// Derive __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the license header as an array of strings
const LICENSE_HEADER = [
    "/*",
    " * Morgan Stanley makes this available to you under the Apache License,",
    " * Version 2.0 (the \"License\"). You may obtain a copy of the License at",
    " *",
    " *      http://www.apache.org/licenses/LICENSE-2.0.",
    " *",
    " * See the NOTICE file distributed with this work for additional information",
    " * regarding copyright ownership. Unless required by applicable law or agreed",
    " * to in writing, software distributed under the License is distributed on an",
    " * \"AS IS\" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express",
    " * or implied. See the License for the specific language governing permissions",
    " * and limitations under the License.",
    " */"
];

export default [
  {
    // Global ignores
    ignores: [
        "**/dist/**",
        "**/build/**",
        "**/coverage/**",
        "docs/**",
        "examples/**", // Ignore all examples for now
        "**/gulpfile.js",
        "*.config.js", // Ignore JS config files
        "*.config.mjs", // Ignore MJS config files
        "vite.config.ts" // Ignore root vite config
    ]
  },
  eslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        // Instead of 'tsconfig.eslint.json', point to the updated test config
        project: './tsconfig.test.json',
        tsconfigRootDir: __dirname, // Important for resolving paths correctly
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: eslintPluginImport,
      n: eslintPluginN,
      promise: eslintPluginPromise,
      'license-header': licenseHeader // Add the license header plugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-inferrable-types': ['error', { ignoreProperties: true, ignoreParameters: true }],
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'error',
      'no-undef': 'off',
      'no-redeclare': 'off', // Disable base rule
      '@typescript-eslint/no-redeclare': 'error', // Enable TS version (already included in recommended, but explicit)
      'license-header/header': ['error', LICENSE_HEADER] // Update the license header rule to use the array
    },
  },
  {
    // Override for Electron source file allowing require
    files: ['packages/desktopjs-electron/src/electron.ts'],
    rules: {
        '@typescript-eslint/no-require-imports': 'off'
    }
  },
  {
    // Override for spec files
    files: ['**/*.spec.ts'],
    // Exclude TS rules requiring type info for spec files if they cause issues
    // Alternatively, ensure tsconfig.test.json includes them correctly
    rules: {
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'no-console': 'warn',
    },
  },
  {
    // Override for JS files (if any are linted)
    files: ['**/*.js'],
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node
        }
    },
    rules: {
        'no-unused-vars': 'warn',
        'no-undef': 'warn'
    }
  }
];
