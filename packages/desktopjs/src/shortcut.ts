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
 * @module @morgan-stanley/desktopjs
 */

/** Register/unregister a glboal keyboard shortcut with the operating system so that you
 *  can customize the operations for various shortcuts.
 */
export abstract class GlobalShortcutManager { 
    /** Registers a global shortcut.
     * @param shortcut {string} [Accelerator]{@link https://electronjs.org/docs/api/accelerator}
     */
    public abstract register(shortcut: string, callback: () => void): Promise<void>;

    /** Checks if a given shortcut has been registered.
     * @param shortcut {string} [Accelerator]{@link https://electronjs.org/docs/api/accelerator}
     * @returns {Promise<boolean>} A Promise that resolves to a boolean whether the shortcut is already registered.
     */
    public abstract isRegistered(shortcut: string): Promise<boolean>;

    /** Removes a previously registered shortcut.
     * @param shortcut {string} [Accelerator]{@link https://electronjs.org/docs/api/accelerator}
     */
    public abstract unregister(shortcut: string): Promise<void>;

    /** Removes all registered shortcuts for the current application. */
    public abstract unregisterAll(): Promise<void>;
}