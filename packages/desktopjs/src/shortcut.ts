/**
 * @module @morgan-stanley/desktopjs
 */

/** Register/unregister a glboal keyboard shortcut with the operating system so that you
 *  can customize the operations for various shortcuts.
 */
export abstract class GlobalShortcutManager { // tslint:disable-line
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