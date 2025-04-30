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
