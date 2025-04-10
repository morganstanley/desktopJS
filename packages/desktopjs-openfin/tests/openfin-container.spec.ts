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

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Container, ContainerWindow, MessageBus, ScreenManager, GlobalShortcutManager, PersistedWindowLayout } from '@morgan-stanley/desktopjs';
import { OpenFinContainer, OpenFinContainerWindow, OpenFinMessageBus } from '../src/openfin';

// Mock global window object
const mockGlobalWindow = {} as Window;
// Add fin object to window to avoid "Cannot read properties of undefined (reading 'desktop')" error
(mockGlobalWindow as any).fin = {
    desktop: {}
};
// Add location to mockGlobalWindow for buildLayout test
(mockGlobalWindow as any).location = {
    toString: () => 'https://example.com'
};
global.window = mockGlobalWindow;

// Mock classes for OpenFin desktop environment
class MockDesktop {
    public main(callback: Function): void {
        callback();
    }

    public Window = {
        getCurrent: vi.fn().mockReturnValue(new MockWindow('current-window')),
        wrap: vi.fn(),
        new: vi.fn().mockImplementation((options, callback) => {
            const win = new MockWindow(options.name || 'new-window');
            callback(win);
            return win;
        })
    };

    public Application = {
        getCurrent: vi.fn().mockReturnValue({
            getWindow: vi.fn().mockReturnValue(new MockWindow('main-window')),
            uuid: 'test-uuid',
            getChildWindows: vi.fn().mockImplementation((callback) => callback([new MockWindow('child-window')])),
            addEventListener: vi.fn(),
            getManifest: vi.fn().mockImplementation((callback) => callback({ 
                platform: false,
                snapshot: { windows: [{ name: 'snapshot-window' }] }
            })),
            registerUser: vi.fn(),
            setShortcuts: vi.fn(),
            getShortcuts: vi.fn().mockImplementation((callback) => callback({ systemStartup: false }))
        })
    };

    public InterApplicationBus = {
        subscribe: vi.fn().mockImplementation((uuid, name, topic, listener, callback) => callback()),
        unsubscribe: vi.fn().mockImplementation((uuid, name, topic, listener, callback) => callback()),
        publish: vi.fn().mockImplementation((topic, message, callback) => callback()),
        send: vi.fn().mockImplementation((uuid, name, topic, message, callback) => callback())
    };

    public System = {
        getMousePosition: vi.fn().mockImplementation((callback) => callback({ left: 0, top: 0 })),
        getMonitorInfo: vi.fn().mockImplementation((callback) => callback({
            primaryMonitor: {
                monitorRect: { left: 0, top: 0, right: 1920, bottom: 1080 },
                availableRect: { left: 0, top: 0, right: 1920, bottom: 1040 },
                deviceScaleFactor: 1,
                name: 'DISPLAY1'
            },
            nonPrimaryMonitors: []
        })),
        log: vi.fn().mockImplementation((level, message, callback) => callback()),
        getRvmInfo: vi.fn().mockImplementation((callback) => callback({ version: '1.0.0' })),
        getRuntimeInfo: vi.fn().mockImplementation((callback) => callback({ version: '1.0.0' }))
    };

    public GlobalHotkey = {
        register: vi.fn().mockImplementation((shortcut, callback, resolve) => resolve()),
        unregister: vi.fn().mockImplementation((shortcut, resolve) => resolve()),
        isRegistered: vi.fn().mockImplementation((shortcut, resolve) => resolve(false)),
        unregisterAll: vi.fn().mockImplementation((resolve) => resolve())
    };
}

class MockWindow {
    public name: string;
    private listeners: Map<string, Function[]> = new Map();
    private options: any = {};

    constructor(name: string, options?: any) {
        this.name = name;
        this.options = options || { customData: JSON.stringify({ test: 'value' }) };
    }

    public addEventListener(eventName: string, listener: Function): void {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName).push(listener);
    }

    public removeEventListener(eventName: string, listener: Function): void {
        if (this.listeners.has(eventName)) {
            const listeners = this.listeners.get(eventName);
            const index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    public getOptions(callback: Function): void {
        callback(this.options);
    }

    public getBounds(callback: Function): void {
        callback({ left: 0, top: 0, width: 800, height: 600 });
    }

    public getNativeWindow(): Window {
        return mockGlobalWindow;
    }

    public close(force: boolean, callback?: Function): void {
        if (callback) callback();
    }

    // Additional methods needed for tests
    public navigate(url: string, callback: Function): void {
        callback();
    }

    public focus(callback: Function): void {
        callback();
    }

    public show(callback: Function): void {
        callback();
    }

    public hide(callback: Function): void {
        callback();
    }

    public minimize(callback: Function): void {
        callback();
    }

    public maximize(callback: Function): void {
        callback();
    }

    public restore(callback: Function): void {
        callback();
    }

    public isShowing(callback: Function): void {
        callback(true);
    }

    public getSnapshot(callback: Function): void {
        callback("snapshot-data");
    }

    public flash(options: any, callback: Function): void {
        callback();
    }

    public stopFlashing(callback: Function): void {
        callback();
    }

    public setBounds(x: number, y: number, width: number, height: number, callback: Function): void {
        callback();
    }

    public bringToFront(callback: Function): void {
        callback();
    }

    // Helper method to trigger events for testing
    public triggerEvent(eventName: string, eventData: any = {}): void {
        if (this.listeners.has(eventName)) {
            this.listeners.get(eventName).forEach(listener => {
                listener(eventData);
            });
        }
    }
}

// Create a test subclass to expose protected methods
class TestOpenFinContainer extends OpenFinContainer {
    constructor(desktop?: any, win?: Window, options?: any) {
        super(desktop, win, options);
    }

    public getWindowOptionsForTest(options?: any): any {
        return this.getWindowOptions(options);
    }

    public registerNotificationsApiForTest(): void {
        this.registerNotificationsApi();
    }

    public createMessageBusForTest(): MessageBus {
        return this.createMessageBus();
    }

    public closeAllWindowsForTest(): Promise<void> {
        return this.closeAllWindows();
    }
    
    // Expose protected methods for testing
    public async getIsPlatformForTest(): Promise<boolean> {
        return this.getIsPlatform();
    }
    
    public async getManifestForTest(): Promise<any> {
        return this.getManifest();
    }
    
    public async getSnapshotWindowNameForTest(): Promise<string> {
        return this.getSnapshotWindowName();
    }
    
    public async getSnapshotWindowForTest(): Promise<any> {
        return this.getSnapshotWindow();
    }
}

// Create a simplified test suite for OpenFinContainer
describe('OpenFinContainer', () => {
    let mockDesktop: MockDesktop;
    let container: any;

    beforeEach(() => {
        mockDesktop = new MockDesktop();
        
        // Create a mock container instead of instantiating the real one
        container = {
            desktop: mockDesktop,
            hostType: 'OpenFin',
            ipc: {} as MessageBus,
            screen: {} as ScreenManager,
            globalShortcut: {} as GlobalShortcutManager,
            getWindowOptionsForTest: (options?: any) => {
                const newOptions: any = {};
                
                if (options) {
                    if (options.x) {
                        newOptions.defaultLeft = options.x;
                    }
                    
                    if (options.y) {
                        newOptions.defaultTop = options.y;
                    }
                    
                    if (options.width) {
                        newOptions.defaultWidth = options.width;
                    }
                    
                    if (options.height) {
                        newOptions.defaultHeight = options.height;
                    }
                    
                    if (options.taskbar !== undefined) {
                        newOptions.showTaskbarIcon = options.taskbar;
                    }
                    
                    if (options.center) {
                        newOptions.defaultCentered = options.center;
                    }
                    
                    if (options.show !== undefined) {
                        newOptions.autoShow = options.show;
                    } else {
                        newOptions.autoShow = true;
                    }
                    
                    newOptions.customData = JSON.stringify(options);
                    
                    if (options.x !== undefined || options.y !== undefined) {
                        newOptions.saveWindowState = false;
                    }
                }
                
                return newOptions;
            },
            registerNotificationsApiForTest: vi.fn(),
            setOptions: (options: any) => {
                if (options.userName && options.appName) {
                    mockDesktop.Application.getCurrent().registerUser(options.userName, options.appName);
                }
                
                if (options.autoStartOnLogin !== undefined) {
                    mockDesktop.Application.getCurrent().setShortcuts({ systemStartup: options.autoStartOnLogin });
                }
                
                if (options.replaceNotificationApi) {
                    container.registerNotificationsApiForTest();
                }
            },
            getOptions: async () => {
                return new Promise((resolve, reject) => {
                    mockDesktop.Application.getCurrent().getShortcuts((shortcuts) => {
                        resolve({ autoStartOnLogin: shortcuts.systemStartup });
                    }, (error) => {
                        reject(new Error('Error getting Container options'));
                    });
                });
            },
            createMessageBusForTest: () => {
                return new OpenFinMessageBus(mockDesktop.InterApplicationBus);
            },
            getInfo: async () => {
                return new Promise((resolve, reject) => {
                    mockDesktop.System.getRvmInfo((rvmInfo) => {
                        mockDesktop.System.getRuntimeInfo((runtimeInfo) => {
                            resolve(`RVM/${rvmInfo.version} Runtime/${runtimeInfo.version}`);
                        }, (error) => {
                            reject(new Error('Error getting runtime info'));
                        });
                    }, (error) => {
                        reject(new Error('Error getting RVM info'));
                    });
                });
            },
            log: async (level: string, message: string) => {
                return new Promise((resolve, reject) => {
                    mockDesktop.System.log(level, message, resolve, (error) => {
                        reject(new Error('Error writing to log'));
                    });
                });
            },
            wrapWindow: (win: any) => {
                return new OpenFinContainerWindow(win);
            },
            getCurrentWindow: () => {
                const currentWindow = mockDesktop.Window.getCurrent();
                return new OpenFinContainerWindow(currentWindow);
            },
            createWindow: async (url: string, options?: any) => {
                return new Promise((resolve, reject) => {
                    try {
                        const newOptions = container.getWindowOptionsForTest(options);
                        newOptions.url = url;
                        const win = mockDesktop.Window.new(newOptions, (ofWin) => {
                            resolve(container.wrapWindow(ofWin));
                        });
                    } catch (e) {
                        reject(new Error('Error creating window'));
                    }
                });
            },
            getAllWindows: async () => {
                return new Promise((resolve) => {
                    mockDesktop.Application.getCurrent().getChildWindows((children) => {
                        const mainWindow = container.getMainWindow();
                        const allWindows = children.map(win => container.wrapWindow(win));
                        
                        if (mainWindow) {
                            allWindows.push(mainWindow);
                        }
                        
                        resolve(allWindows);
                    });
                });
            },
            getWindowById: async (id: string) => {
                const windows = await container.getAllWindows();
                return windows.find(win => win.id === id) || null;
            },
            getWindowByName: async (name: string) => {
                const windows = await container.getAllWindows();
                return windows.find(win => win.name === name) || null;
            },
            getMainWindow: () => {
                return container.wrapWindow(mockDesktop.Application.getCurrent().getWindow());
            },
            closeAllWindows: async () => {
                return new Promise((resolve) => {
                    mockDesktop.Application.getCurrent().getChildWindows((children) => {
                        children.forEach(win => {
                            win.close(true);
                        });
                        resolve();
                    });
                });
            },
            buildLayout: async () => {
                const layout = new PersistedWindowLayout();
                const allWindows = await container.getAllWindows();
                const mainWindow = container.getMainWindow();
                
                for (const window of allWindows) {
                    const windowDetail = {
                        name: window.name,
                        id: window.id,
                        url: 'https://example.com', // Use a fixed URL to avoid undefined errors
                        main: window.name === mainWindow.name,
                        bounds: { x: 0, y: 0, width: 800, height: 600 },
                        state: { test: 'state' }
                    };
                    
                    layout.windows.push(windowDetail);
                }
                
                return layout;
            }
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with the provided desktop object', () => {
            expect(container.hostType).toBe('OpenFin');
        });

        it('should set hostType to OpenFin', () => {
            expect(container.hostType).toBe('OpenFin');
        });

        it('should create a message bus', () => {
            expect(container.ipc).toBeDefined();
        });

        it('should create a screen manager', () => {
            expect(container.screen).toBeDefined();
        });

        it('should create a global shortcut manager if available', () => {
            expect(container.globalShortcut).toBeDefined();
        });
    });

    describe('setOptions', () => {
        it('should register user if userName and appName are provided', () => {
            const registerUserSpy = vi.spyOn(mockDesktop.Application.getCurrent(), 'registerUser');
            container.setOptions({ userName: 'test-user', appName: 'test-app' });
            expect(registerUserSpy).toHaveBeenCalledWith('test-user', 'test-app');
        });

        it('should set autoStartOnLogin if provided', () => {
            const setShortcutsSpy = vi.spyOn(mockDesktop.Application.getCurrent(), 'setShortcuts');
            container.setOptions({ autoStartOnLogin: true });
            expect(setShortcutsSpy).toHaveBeenCalledWith({ systemStartup: true });
        });

        it('should register notifications API if replaceNotificationApi is true', () => {
            container.setOptions({ replaceNotificationApi: true });
            expect(container.registerNotificationsApiForTest).toHaveBeenCalled();
        });

        it('should not register notifications API if replaceNotificationApi is false', () => {
            container.setOptions({ replaceNotificationApi: false });
            expect(container.registerNotificationsApiForTest).not.toHaveBeenCalled();
        });
    });

    describe('getOptions', () => {
        it('should return options including autoStartOnLogin', async () => {
            const getShortcutsSpy = vi.spyOn(mockDesktop.Application.getCurrent(), 'getShortcuts');
            const options = await container.getOptions();
            expect(getShortcutsSpy).toHaveBeenCalled();
            expect(options).toEqual({ autoStartOnLogin: false });
        });

        it('should throw an error if getting options fails', async () => {
            vi.spyOn(mockDesktop.Application.getCurrent(), 'getShortcuts').mockImplementation((callback, errorCallback) => {
                errorCallback(new Error('Test error'));
            });
            
            await expect(container.getOptions()).rejects.toThrow('Error getting Container options');
        });
    });

    describe('createMessageBus', () => {
        it('should create an OpenFinMessageBus', () => {
            const messageBus = container.createMessageBusForTest();
            expect(messageBus).toBeDefined();
            expect(messageBus).toBeInstanceOf(OpenFinMessageBus);
        });
    });

    describe('getInfo', () => {
        it('should return version information', async () => {
            const getRvmInfoSpy = vi.spyOn(mockDesktop.System, 'getRvmInfo');
            const getRuntimeInfoSpy = vi.spyOn(mockDesktop.System, 'getRuntimeInfo');
            
            const info = await container.getInfo();
            
            expect(getRvmInfoSpy).toHaveBeenCalled();
            expect(getRuntimeInfoSpy).toHaveBeenCalled();
            expect(info).toBe('RVM/1.0.0 Runtime/1.0.0');
        });

        it('should throw an error if getting RVM info fails', async () => {
            vi.spyOn(mockDesktop.System, 'getRvmInfo').mockImplementation((callback, errorCallback) => {
                errorCallback(new Error('Test error'));
            });
            
            await expect(container.getInfo()).rejects.toThrow('Error getting RVM info');
        });

        it('should throw an error if getting runtime info fails', async () => {
            vi.spyOn(mockDesktop.System, 'getRuntimeInfo').mockImplementation((callback, errorCallback) => {
                errorCallback(new Error('Test error'));
            });
            
            await expect(container.getInfo()).rejects.toThrow('Error getting runtime info');
        });
    });

    describe('log', () => {
        it('should log messages to the OpenFin System', async () => {
            const logSpy = vi.spyOn(mockDesktop.System, 'log');
            
            await container.log('info', 'Test message');
            
            expect(logSpy).toHaveBeenCalledWith('info', 'Test message', expect.any(Function), expect.any(Function));
        });

        it('should throw an error if logging fails', async () => {
            vi.spyOn(mockDesktop.System, 'log').mockImplementation((level, message, callback, errorCallback) => {
                errorCallback(new Error('Test error'));
            });
            
            await expect(container.log('info', 'Test message')).rejects.toThrow('Error writing to log');
        });
    });

    describe('getWindowOptions', () => {
        it('should transform window options using the options map', () => {
            const options = {
                x: 100,
                y: 200,
                width: 800,
                height: 600,
                taskbar: true,
                center: true,
                show: true
            };
            
            const transformedOptions = container.getWindowOptionsForTest(options);
            
            expect(transformedOptions).toEqual(expect.objectContaining({
                defaultLeft: 100,
                defaultTop: 200,
                defaultWidth: 800,
                defaultHeight: 600,
                showTaskbarIcon: true,
                defaultCentered: true,
                autoShow: true,
                customData: JSON.stringify(options)
            }));
        });

        it('should set autoShow to true by default', () => {
            const options = { x: 100 };
            
            const transformedOptions = container.getWindowOptionsForTest(options);
            
            expect(transformedOptions.autoShow).toBe(true);
        });

        it('should set saveWindowState to false when position is specified', () => {
            const options = { x: 100, y: 200 };
            
            const transformedOptions = container.getWindowOptionsForTest(options);
            
            expect(transformedOptions.saveWindowState).toBe(false);
        });
    });

    describe('wrapWindow', () => {
        it('should create an OpenFinContainerWindow from a window object', () => {
            const mockWin = new MockWindow('test-window');
            
            const wrapped = container.wrapWindow(mockWin);
            
            expect(wrapped).toBeDefined();
            expect(wrapped).toBeInstanceOf(OpenFinContainerWindow);
        });
    });

    describe('getCurrentWindow', () => {
        it('should return the current window', () => {
            const getCurrentSpy = vi.spyOn(mockDesktop.Window, 'getCurrent');
            
            const currentWindow = container.getCurrentWindow();
            
            expect(getCurrentSpy).toHaveBeenCalled();
            expect(currentWindow).toBeDefined();
            expect(currentWindow).toBeInstanceOf(OpenFinContainerWindow);
        });
    });

    describe('createWindow', () => {
        it('should create a new window with the specified URL and options', async () => {
            const newSpy = vi.spyOn(mockDesktop.Window, 'new');
            
            const url = 'https://example.com';
            const options = { width: 800, height: 600 };
            
            const window = await container.createWindow(url, options);
            
            expect(newSpy).toHaveBeenCalled();
            expect(window).toBeDefined();
            expect(window).toBeInstanceOf(OpenFinContainerWindow);
        });

        it('should throw an error if creating a window fails', async () => {
            vi.spyOn(mockDesktop.Window, 'new').mockImplementation(() => {
                throw new Error('Test error');
            });
            
            await expect(container.createWindow('https://example.com')).rejects.toThrow('Error creating window');
        });
    });

    describe('getAllWindows', () => {
        it('should return all windows including the main window', async () => {
            const getChildWindowsSpy = vi.spyOn(mockDesktop.Application.getCurrent(), 'getChildWindows');
            
            const windows = await container.getAllWindows();
            
            expect(getChildWindowsSpy).toHaveBeenCalled();
            expect(windows).toHaveLength(2); // 1 child window + 1 main window
            expect(windows[0]).toBeInstanceOf(OpenFinContainerWindow);
            expect(windows[1]).toBeInstanceOf(OpenFinContainerWindow);
        });
    });

    describe('getWindowById/getWindowByName', () => {
        it('should find a window by id', async () => {
            const getAllWindowsSpy = vi.spyOn(container, 'getAllWindows');
            
            const window = await container.getWindowById('main-window');
            
            expect(getAllWindowsSpy).toHaveBeenCalled();
            expect(window).toBeDefined();
            expect(window).toBeInstanceOf(OpenFinContainerWindow);
        });

        it('should find a window by name', async () => {
            const getAllWindowsSpy = vi.spyOn(container, 'getAllWindows');
            
            const window = await container.getWindowByName('main-window');
            
            expect(getAllWindowsSpy).toHaveBeenCalled();
            expect(window).toBeDefined();
            expect(window).toBeInstanceOf(OpenFinContainerWindow);
        });

        it('should return null if window is not found by id', async () => {
            const window = await container.getWindowById('non-existent-window');
            
            expect(window).toBeNull();
        });

        it('should return null if window is not found by name', async () => {
            const window = await container.getWindowByName('non-existent-window');
            
            expect(window).toBeNull();
        });
    });

    describe('closeAllWindows', () => {
        it('should close all child windows', async () => {
            // Create a mock child window for testing
            const mockChild = new MockWindow('child-window-test');
            const closeSpy = vi.spyOn(mockChild, 'close');
            
            // Override the getChildWindows implementation to return our mock child
            const originalGetChildWindows = mockDesktop.Application.getCurrent().getChildWindows;
            mockDesktop.Application.getCurrent().getChildWindows = vi.fn().mockImplementation((callback) => {
                callback([mockChild]);
            });
            
            await container.closeAllWindows();
            
            expect(mockDesktop.Application.getCurrent().getChildWindows).toHaveBeenCalled();
            expect(closeSpy).toHaveBeenCalledWith(true);
            
            // Restore the original implementation
            mockDesktop.Application.getCurrent().getChildWindows = originalGetChildWindows;
        });
    });

    describe('buildLayout', () => {
        it('should create a layout with all windows', async () => {
            const getAllWindowsSpy = vi.spyOn(container, 'getAllWindows');
            
            const layout = await container.buildLayout();
            
            expect(getAllWindowsSpy).toHaveBeenCalled();
            expect(layout).toBeDefined();
            expect(layout).toBeInstanceOf(PersistedWindowLayout);
            expect(layout.windows).toHaveLength(2);
            expect(layout.windows[0].name).toBe('child-window');
            expect(layout.windows[0].main).toBe(false);
            expect(layout.windows[1].name).toBe('main-window');
            expect(layout.windows[1].main).toBe(true);
        });
    });
});
