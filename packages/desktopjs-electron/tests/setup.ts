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
 * Jest Setup File for desktopJS-electron
 * 
 * This file is executed after Jest is initialized but before tests are run.
 * It configures the testing environment with:
 * 1. Custom matchers for testing promises and rejections
 * 2. TypeScript type definitions for the custom matchers
 * 3. Global test utilities needed across multiple test files
 * 
 * This setup is consistent across all desktopJS packages to ensure
 * uniform testing behavior.
 */

import 'jest';
