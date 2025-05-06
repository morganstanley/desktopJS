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

/**
 * Jest Setup File for desktopJS
 * 
 * This file is executed after Jest is initialized but before tests are run.
 * It configures the testing environment with:
 * 1. Custom matchers for testing promises and rejections
 * 2. TypeScript type definitions for the custom matchers
 * 3. Global test utilities needed across multiple test files
 */

import 'jest';

// Declare the custom matcher types for TypeScript
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeRejectedWithError(message?: string): Promise<R>;
    }
  }
}

// Add custom Jest matcher for rejected promises with specific error messages
beforeAll(() => {
  expect.extend({
    async toBeRejectedWithError(received: Promise<any>, message?: string) {
      try {
        await received;
        return {
          message: () => `Expected promise to be rejected with error: ${message}, but it was resolved`,
          pass: false,
        };
      } catch (error) {
        const pass = message ? error.message === message : true;
        return {
          message: () => 
            pass 
              ? `Expected promise not to be rejected with error: ${message}`
              : `Expected promise to be rejected with error: ${message}, but got: ${error.message}`,
          pass,
        };
      }
    },
  });
});
