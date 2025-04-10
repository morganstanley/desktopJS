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
import { ContainerWindow, EventArgs, WindowEventArgs } from '@morgan-stanley/desktopjs';
import { OpenFinContainerWindow } from '../src/openfin';

// Mock global window object
const mockGlobalWindow = {} as Window;
global.window = mockGlobalWindow;

// Define the window event map for testing
const windowEventMap = {
    move: "bounds-changing",
    resize: "bounds-changing",
    close: "closing",
    focus: "focused",
    blur: "blurred",
    maximize: "maximized",
    minimize: "minimized",
    restore: "restored"
};

class MockWindow {
    public name: string;
    private listeners: Map<string, Function[]> = new Map();
    private options: any = {};

    constructor(name: string, options?: any) {
        this.name = name;
        this.options = options || {};
    }

    // Window operations
    public navigate(url: string, resolve: Function, reject: Function): void {
        resolve();
    }

    public focus(resolve: Function, reject: Function): void {
        resolve();
    }

    public show(resolve: Function, reject: Function): void {
        resolve();
    }

    public hide(resolve: Function, reject: Function): void {
        resolve();
    }

    public close(force: boolean, resolve?: Function, reject?: Function): void {
        if (resolve) resolve();
    }

    public minimize(resolve: Function, reject: Function): void {
        resolve();
    }

    public maximize(resolve: Function, reject: Function): void {
        resolve();
    }

    public restore(resolve: Function, reject: Function): void {
        resolve();
    }

    public isShowing(resolve: Function, reject: Function): void {
        resolve(true);
    }

    public getSnapshot(resolve: Function, reject: Function): void {
        resolve("snapshot-data");
    }

    public getBounds(resolve: Function, reject: Function): void {
        resolve({ left: 0, top: 0, width: 800, height: 600 });
    }

    public flash(options: any, resolve: Function, reject: Function): void {
        resolve();
    }

    public stopFlashing(resolve: Function, reject: Function): void {
        resolve();
    }

    public setBounds(x: number, y: number, width: number, height: number, resolve: Function, reject: Function): void {
        resolve();
    }

    public bringToFront(resolve: Function, reject: Function): void {
        resolve();
    }

    public getOptions(resolve: Function, reject: Function): void {
        resolve(this.options);
    }

    public getNativeWindow(): Window {
        return mockGlobalWindow;
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

    // Helper method to trigger events for testing
    public triggerEvent(eventName: string, eventData: any = {}): void {
        if (this.listeners.has(eventName)) {
            this.listeners.get(eventName).forEach(listener => {
                listener(eventData);
            });
        }
    }
}

// Create a custom OpenFinContainerWindow for testing
class TestOpenFinContainerWindow extends OpenFinContainerWindow {
    constructor(win: any) {
        super(win);
    }

    // Expose protected methods for testing
    public attachListenerForTest(eventName: string, listener: (...args: any[]) => void): void {
        this.attachListener(eventName, listener);
    }

    public wrapListenerForTest(eventName: string, listener: (event: EventArgs) => void): (event: EventArgs) => void {
        return this.wrapListener(eventName, listener);
    }

    public detachListenerForTest(eventName: string, listener: (...args: any[]) => void): void {
        this.detachListener(eventName, listener);
    }
}

describe('OpenFinContainerWindow', () => {
    let mockWindow: MockWindow;
    let containerWindow: TestOpenFinContainerWindow;

    beforeEach(() => {
        mockWindow = new MockWindow('test-window', { customData: JSON.stringify({ test: 'value' }) });
        containerWindow = new TestOpenFinContainerWindow(mockWindow);
    });

    it('should return the correct window id', () => {
        expect(containerWindow.id).toBe('test-window');
    });

    it('should return the correct window name', () => {
        expect(containerWindow.name).toBe('test-window');
    });

    it('should load a url', async () => {
        const navigateSpy = vi.spyOn(mockWindow, 'navigate');
        await containerWindow.load('https://example.com');
        expect(navigateSpy).toHaveBeenCalledWith('https://example.com', expect.any(Function), expect.any(Function));
    });

    it('should focus the window', async () => {
        const focusSpy = vi.spyOn(mockWindow, 'focus');
        await containerWindow.focus();
        expect(focusSpy).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
    });

    it('should show the window', async () => {
        const showSpy = vi.spyOn(mockWindow, 'show');
        await containerWindow.show();
        expect(showSpy).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
    });

    it('should hide the window', async () => {
        const hideSpy = vi.spyOn(mockWindow, 'hide');
        await containerWindow.hide();
        expect(hideSpy).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
    });

    it('should close the window', async () => {
        const closeSpy = vi.spyOn(mockWindow, 'close');
        await containerWindow.close();
        expect(closeSpy).toHaveBeenCalledWith(false, expect.any(Function), expect.any(Function));
    });

    it('should minimize the window', async () => {
        const minimizeSpy = vi.spyOn(mockWindow, 'minimize');
        await containerWindow.minimize();
        expect(minimizeSpy).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
    });

    it('should maximize the window', async () => {
        const maximizeSpy = vi.spyOn(mockWindow, 'maximize');
        await containerWindow.maximize();
        expect(maximizeSpy).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
    });

    it('should restore the window', async () => {
        const restoreSpy = vi.spyOn(mockWindow, 'restore');
        await containerWindow.restore();
        expect(restoreSpy).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
    });

    it('should check if window is showing', async () => {
        const isShowingSpy = vi.spyOn(mockWindow, 'isShowing');
        const showing = await containerWindow.isShowing();
        expect(isShowingSpy).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
        expect(showing).toBe(true);
    });

    it('should get window snapshot', async () => {
        const getSnapshotSpy = vi.spyOn(mockWindow, 'getSnapshot');
        const snapshot = await containerWindow.getSnapshot();
        expect(getSnapshotSpy).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
        expect(snapshot).toBe('data:image/png;base64,snapshot-data');
    });

    it('should get window bounds', async () => {
        const getBoundsSpy = vi.spyOn(mockWindow, 'getBounds');
        const bounds = await containerWindow.getBounds();
        expect(getBoundsSpy).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
        expect(bounds).toEqual({ x: 0, y: 0, width: 800, height: 600 });
    });

    it('should flash the window', async () => {
        const flashSpy = vi.spyOn(mockWindow, 'flash');
        await containerWindow.flash(true, { param: 'test' });
        expect(flashSpy).toHaveBeenCalledWith({ param: 'test' }, expect.any(Function), expect.any(Function));
    });

    it('should stop flashing the window', async () => {
        const stopFlashingSpy = vi.spyOn(mockWindow, 'stopFlashing');
        await containerWindow.flash(false);
        expect(stopFlashingSpy).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
    });

    it('should get parent window', async () => {
        const parent = await containerWindow.getParent();
        expect(parent).toBeNull();
    });

    it('should set parent window', async () => {
        const mockParent = new OpenFinContainerWindow(new MockWindow('parent-window'));
        await containerWindow.setParent(mockParent);
        // This is a no-op in OpenFin, so just verify it resolves
    });

    it('should set window bounds', async () => {
        const setBoundsSpy = vi.spyOn(mockWindow, 'setBounds');
        await containerWindow.setBounds({ x: 100, y: 100, width: 400, height: 300 });
        expect(setBoundsSpy).toHaveBeenCalledWith(100, 100, 400, 300, expect.any(Function), expect.any(Function));
    });

    it('should bring window to front', async () => {
        const bringToFrontSpy = vi.spyOn(mockWindow, 'bringToFront');
        await containerWindow.bringToFront();
        expect(bringToFrontSpy).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
    });

    it('should get window options', async () => {
        const getOptionsSpy = vi.spyOn(mockWindow, 'getOptions');
        const options = await containerWindow.getOptions();
        expect(getOptionsSpy).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
        expect(options).toEqual({ test: 'value' });
    });

    it('should get window state', async () => {
        // Mock the nativeWindow property
        Object.defineProperty(containerWindow, 'nativeWindow', {
            get: () => ({ getState: () => ({ test: 'state' }) })
        });
        
        const state = await containerWindow.getState();
        expect(state).toEqual({ test: 'state' });
    });

    it('should set window state', async () => {
        // Mock the nativeWindow property
        const setState = vi.fn();
        Object.defineProperty(containerWindow, 'nativeWindow', {
            get: () => ({ setState })
        });
        
        const emitSpy = vi.spyOn(containerWindow, 'emit');
        const staticEmitSpy = vi.spyOn(ContainerWindow, 'emit');
        
        await containerWindow.setState({ test: 'state' });
        
        expect(setState).toHaveBeenCalledWith({ test: 'state' });
        expect(emitSpy).toHaveBeenCalledWith('state-changed', expect.objectContaining({
            name: 'state-changed',
            sender: containerWindow,
            state: { test: 'state' }
        }));
        
        expect(staticEmitSpy).toHaveBeenCalledWith('state-changed', expect.objectContaining({
            name: 'state-changed',
            windowId: containerWindow.id,
            state: { test: 'state' }
        }));
    });

    describe('Event handling', () => {
        it('should attach event listener for standard events', () => {
            const listener = vi.fn();
            const addEventListenerSpy = vi.spyOn(mockWindow, 'addEventListener');
            
            containerWindow.attachListenerForTest('focus', listener);
            
            expect(addEventListenerSpy).toHaveBeenCalledWith('focused', expect.any(Function));
            
            // Trigger the event
            mockWindow.triggerEvent('focused', { data: 'test' });
            
            expect(listener).toHaveBeenCalled();
        });

        it('should handle beforeunload event specially', () => {
            const listener = vi.fn();
            const addEventListenerSpy = vi.spyOn(mockWindow, 'addEventListener');
            
            containerWindow.attachListenerForTest('beforeunload', listener);
            
            expect(addEventListenerSpy).toHaveBeenCalledWith('close-requested', expect.any(Function));
            
            // Get the close-requested listener
            const closeRequestedListener = mockWindow.listeners.get('close-requested')[0];
            
            // Directly call the listener instead of using triggerEvent
            closeRequestedListener({ data: 'test' });
            
            expect(listener).toHaveBeenCalled();
            
            // Test with returnValue set
            listener.mockImplementation((args) => {
                args.returnValue = false;
            });
            
            const closeSpy = vi.spyOn(mockWindow, 'close');
            closeRequestedListener({ data: 'test' });
            
            // Should not close if returnValue is set
            expect(closeSpy).not.toHaveBeenCalled();
            
            // Test without returnValue set
            listener.mockImplementation((args) => {
                // No returnValue set
            });
            
            closeRequestedListener({ data: 'test' });
            
            // Should close if returnValue is not set
            expect(closeSpy).toHaveBeenCalledWith(true);
        });

        it('should handle resize event specially', () => {
            const listener = vi.fn();
            const wrappedListener = containerWindow.wrapListenerForTest('resize', listener);
            
            // Call the wrapped listener with changeType 1 (should call listener)
            wrappedListener({ changeType: 1 } as any);
            expect(listener).toHaveBeenCalled();
            
            listener.mockClear();
            
            // Call the wrapped listener with changeType 0 (should not call listener)
            wrappedListener({ changeType: 0 } as any);
            expect(listener).not.toHaveBeenCalled();
        });

        it('should handle move event specially', () => {
            const listener = vi.fn();
            const wrappedListener = containerWindow.wrapListenerForTest('move', listener);
            
            // Call the wrapped listener with changeType 0 (should call listener)
            wrappedListener({ changeType: 0 } as any);
            expect(listener).toHaveBeenCalled();
            
            listener.mockClear();
            
            // Call the wrapped listener with changeType 1 (should not call listener)
            wrappedListener({ changeType: 1 } as any);
            expect(listener).not.toHaveBeenCalled();
        });

        it('should detach event listener', () => {
            const listener = vi.fn();
            const removeEventListenerSpy = vi.spyOn(mockWindow, 'removeEventListener');
            
            containerWindow.detachListenerForTest('focus', listener);
            
            expect(removeEventListenerSpy).toHaveBeenCalledWith('focused', listener);
        });
    });

    it('should get native window', () => {
        const getNativeWindowSpy = vi.spyOn(mockWindow, 'getNativeWindow');
        const nativeWindow = containerWindow.nativeWindow;
        expect(getNativeWindowSpy).toHaveBeenCalled();
        expect(nativeWindow).toBe(mockGlobalWindow);
    });
});
