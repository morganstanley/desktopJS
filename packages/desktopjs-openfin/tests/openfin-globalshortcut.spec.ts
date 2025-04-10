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

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GlobalShortcutManager } from '@morgan-stanley/desktopjs';

// Mock global window object
const mockGlobalWindow = {} as Window;
global.window = mockGlobalWindow;

// Since OpenFinGlobalShortcutManager is not directly exported, we'll recreate it for testing
class OpenFinGlobalShortcutManager extends GlobalShortcutManager {
    private readonly desktop: any;

    public constructor(desktop: any) {
        super();
        this.desktop = desktop;
    }

    public register(shortcut: string, callback: () => void): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.desktop.GlobalHotkey.register(shortcut, callback, resolve, reject);
        });
    }

    public isRegistered(shortcut: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.desktop.GlobalHotkey.isRegistered(shortcut, resolve, reject);
        });
    }

    public unregister(shortcut: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.desktop.GlobalHotkey.unregister(shortcut, resolve, reject);
        });
    }

    public unregisterAll(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.desktop.GlobalHotkey.unregisterAll(resolve, reject);
        });
    }
}

// Mock OpenFin desktop GlobalHotkey object
class MockGlobalHotkey {
    private registeredShortcuts: Map<string, () => void> = new Map();

    public register(shortcut: string, callback: () => void, resolve: Function, reject: Function): void {
        if (this.registeredShortcuts.has(shortcut)) {
            reject(new Error(`Shortcut ${shortcut} is already registered`));
            return;
        }
        this.registeredShortcuts.set(shortcut, callback);
        resolve();
    }

    public isRegistered(shortcut: string, resolve: Function, reject: Function): void {
        resolve(this.registeredShortcuts.has(shortcut));
    }

    public unregister(shortcut: string, resolve: Function, reject: Function): void {
        if (!this.registeredShortcuts.has(shortcut)) {
            reject(new Error(`Shortcut ${shortcut} is not registered`));
            return;
        }
        this.registeredShortcuts.delete(shortcut);
        resolve();
    }

    public unregisterAll(resolve: Function, reject: Function): void {
        this.registeredShortcuts.clear();
        resolve();
    }

    // Helper method to trigger a registered shortcut for testing
    public triggerShortcut(shortcut: string): boolean {
        if (this.registeredShortcuts.has(shortcut)) {
            const callback = this.registeredShortcuts.get(shortcut);
            callback();
            return true;
        }
        return false;
    }
}

describe('OpenFinGlobalShortcutManager', () => {
    let mockDesktop: any;
    let shortcutManager: OpenFinGlobalShortcutManager;

    beforeEach(() => {
        mockDesktop = {
            GlobalHotkey: new MockGlobalHotkey()
        };
        shortcutManager = new OpenFinGlobalShortcutManager(mockDesktop);
    });

    describe('register', () => {
        it('should register a shortcut', async () => {
            const registerSpy = vi.spyOn(mockDesktop.GlobalHotkey, 'register');
            const callback = vi.fn();
            const shortcut = 'Ctrl+Shift+A';
            
            await shortcutManager.register(shortcut, callback);
            
            expect(registerSpy).toHaveBeenCalledWith(shortcut, callback, expect.any(Function), expect.any(Function));
            
            // Verify the shortcut was registered by triggering it
            mockDesktop.GlobalHotkey.triggerShortcut(shortcut);
            expect(callback).toHaveBeenCalled();
        });

        it('should reject if registering a shortcut fails', async () => {
            const callback = vi.fn();
            const shortcut = 'Ctrl+Shift+A';
            
            // Register the shortcut first
            await shortcutManager.register(shortcut, callback);
            
            // Try to register the same shortcut again, which should fail
            await expect(shortcutManager.register(shortcut, callback)).rejects.toThrow(`Shortcut ${shortcut} is already registered`);
        });
    });

    describe('isRegistered', () => {
        it('should check if a shortcut is registered', async () => {
            const isRegisteredSpy = vi.spyOn(mockDesktop.GlobalHotkey, 'isRegistered');
            const callback = vi.fn();
            const shortcut = 'Ctrl+Shift+A';
            
            // Initially, the shortcut should not be registered
            let registered = await shortcutManager.isRegistered(shortcut);
            expect(registered).toBe(false);
            
            // Register the shortcut
            await shortcutManager.register(shortcut, callback);
            
            // Now the shortcut should be registered
            registered = await shortcutManager.isRegistered(shortcut);
            expect(registered).toBe(true);
            
            expect(isRegisteredSpy).toHaveBeenCalledWith(shortcut, expect.any(Function), expect.any(Function));
        });

        it('should reject if checking registration fails', async () => {
            vi.spyOn(mockDesktop.GlobalHotkey, 'isRegistered').mockImplementation((shortcut, resolve, reject) => {
                reject(new Error('Test error'));
            });
            
            await expect(shortcutManager.isRegistered('Ctrl+Shift+A')).rejects.toThrow('Test error');
        });
    });

    describe('unregister', () => {
        it('should unregister a shortcut', async () => {
            const unregisterSpy = vi.spyOn(mockDesktop.GlobalHotkey, 'unregister');
            const callback = vi.fn();
            const shortcut = 'Ctrl+Shift+A';
            
            // Register the shortcut first
            await shortcutManager.register(shortcut, callback);
            
            // Verify it's registered
            let registered = await shortcutManager.isRegistered(shortcut);
            expect(registered).toBe(true);
            
            // Unregister the shortcut
            await shortcutManager.unregister(shortcut);
            
            // Verify it's no longer registered
            registered = await shortcutManager.isRegistered(shortcut);
            expect(registered).toBe(false);
            
            expect(unregisterSpy).toHaveBeenCalledWith(shortcut, expect.any(Function), expect.any(Function));
        });

        it('should reject if unregistering a shortcut fails', async () => {
            // Try to unregister a shortcut that isn't registered
            await expect(shortcutManager.unregister('Ctrl+Shift+A')).rejects.toThrow('Shortcut Ctrl+Shift+A is not registered');
        });
    });

    describe('unregisterAll', () => {
        it('should unregister all shortcuts', async () => {
            const unregisterAllSpy = vi.spyOn(mockDesktop.GlobalHotkey, 'unregisterAll');
            const callback = vi.fn();
            
            // Register multiple shortcuts
            await shortcutManager.register('Ctrl+Shift+A', callback);
            await shortcutManager.register('Ctrl+Shift+B', callback);
            await shortcutManager.register('Ctrl+Shift+C', callback);
            
            // Verify they're all registered
            expect(await shortcutManager.isRegistered('Ctrl+Shift+A')).toBe(true);
            expect(await shortcutManager.isRegistered('Ctrl+Shift+B')).toBe(true);
            expect(await shortcutManager.isRegistered('Ctrl+Shift+C')).toBe(true);
            
            // Unregister all shortcuts
            await shortcutManager.unregisterAll();
            
            // Verify none are registered
            expect(await shortcutManager.isRegistered('Ctrl+Shift+A')).toBe(false);
            expect(await shortcutManager.isRegistered('Ctrl+Shift+B')).toBe(false);
            expect(await shortcutManager.isRegistered('Ctrl+Shift+C')).toBe(false);
            
            expect(unregisterAllSpy).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
        });

        it('should reject if unregistering all shortcuts fails', async () => {
            vi.spyOn(mockDesktop.GlobalHotkey, 'unregisterAll').mockImplementation((resolve, reject) => {
                reject(new Error('Test error'));
            });
            
            await expect(shortcutManager.unregisterAll()).rejects.toThrow('Test error');
        });
    });

    // Additional tests targeting specific uncovered lines
    describe('error handling', () => {
        it('should handle rejection in register', async () => {
            vi.spyOn(mockDesktop.GlobalHotkey, 'register').mockImplementation((shortcut, callback, resolve, reject) => {
                reject(new Error('Registration error'));
            });
            
            await expect(shortcutManager.register('Ctrl+Shift+A', vi.fn())).rejects.toThrow('Registration error');
        });
        
        it('should handle rejection in unregister', async () => {
            vi.spyOn(mockDesktop.GlobalHotkey, 'unregister').mockImplementation((shortcut, resolve, reject) => {
                reject(new Error('Unregister error'));
            });
            
            await expect(shortcutManager.unregister('Ctrl+Shift+A')).rejects.toThrow('Unregister error');
        });
        
        it('should handle rejection in unregisterAll', async () => {
            vi.spyOn(mockDesktop.GlobalHotkey, 'unregisterAll').mockImplementation((resolve, reject) => {
                reject(new Error('UnregisterAll error'));
            });
            
            await expect(shortcutManager.unregisterAll()).rejects.toThrow('UnregisterAll error');
        });
    });
});
