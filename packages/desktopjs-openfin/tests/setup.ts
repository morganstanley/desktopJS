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

// Silence console logs during tests
// eslint-disable-next-line no-console
console.log = jest.fn();
// eslint-disable-next-line no-console
console.error = jest.fn();
// eslint-disable-next-line no-console
console.warn = jest.fn();
// eslint-disable-next-line no-console
console.debug = jest.fn();

// Mock the window.fin object that OpenFin expects
Object.defineProperty(window, 'fin', {
    value: {
        desktop: {}
    },
    writable: true
});

// Mock base classes to avoid constructor issues
jest.mock('@morgan-stanley/desktopjs', () => {
    const original = jest.requireActual('@morgan-stanley/desktopjs');
    return {
        ...original,
        WebContainerBase: class MockWebContainerBase {
            constructor() {}
            log() {}
        },
        GlobalShortcutManager: class MockGlobalShortcutManager {
            constructor() {}
        },
        ContainerWindow: class MockContainerWindow {
            innerWindow: any;
            constructor(win?: any) {
                this.innerWindow = win;
            }
        }
    };
});

// Mock for OpenFin Window.getNativeWindow
if (!window.fin) {
    window.fin = {} as any;
}

// Add a mock implementation for contextMenu
const mockContextMenuWindow = {
    document: {
        open: jest.fn(),
        write: jest.fn(),
        close: jest.fn(),
        getElementById: jest.fn().mockReturnValue({
            innerHTML: "",
            offsetWidth: 100,
            offsetHeight: 100
        })
    }
};

// Mock the Window.getNativeWindow method
jest.spyOn(window, 'Window').mockImplementation(() => {
    return {
        getNativeWindow: jest.fn().mockReturnValue(mockContextMenuWindow)
    } as any;
});

// Mock classes for event handling
export class EventEmitterMock {
    private eventListeners: { [eventName: string]: Array<(...args: any[]) => void> } = {};

    addListener(eventName: string, listener: (...args: any[]) => void): this {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(listener);
        return this;
    }

    removeListener(eventName: string, listener: (...args: any[]) => void): this {
        if (this.eventListeners[eventName]) {
            const index = this.eventListeners[eventName].indexOf(listener);
            if (index !== -1) {
                this.eventListeners[eventName].splice(index, 1);
            }
        }
        return this;
    }

    emit(eventName: string, ...args: any[]): boolean {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName].forEach(listener => listener(...args));
            return true;
        }
        return false;
    }

    listeners(eventName: string): Array<(...args: any[]) => void> {
        return this.eventListeners[eventName] || [];
    }
}

// Mock window for event handling tests
export class EventableWindowMock {
    public name: string;
    private eventListeners: { [eventName: string]: Array<(...args: any[]) => void> } = {};

    constructor(name: string) {
        this.name = name;
    }

    addEventListener(eventName: string, listener: (...args: any[]) => void): void {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(listener);
    }

    removeEventListener(eventName: string, listener: (...args: any[]) => void): void {
        if (this.eventListeners[eventName]) {
            const index = this.eventListeners[eventName].indexOf(listener);
            if (index !== -1) {
                this.eventListeners[eventName].splice(index, 1);
            }
        }
    }

    triggerEvent(eventName: string, eventData: any): void {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName].forEach(listener => listener(eventData));
        }
    }

    getListeners(eventName: string): Array<(...args: any[]) => void> {
        return this.eventListeners[eventName] || [];
    }
}

// Mock for setState tests
export class StateableWindowMock {
    public name: string;
    private state: any = {};
    private eventListeners: { [eventName: string]: Array<(...args: any[]) => void> } = {};

    constructor(name: string) {
        this.name = name;
    }

    getNativeWindow(): any {
        return {
            getState: () => this.state,
            setState: (newState: any) => {
                this.state = { ...this.state, ...newState };
                return Promise.resolve();
            }
        };
    }

    addEventListener(eventName: string, listener: (...args: any[]) => void): void {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(listener);
    }

    removeEventListener(eventName: string, listener: (...args: any[]) => void): void {
        if (this.eventListeners[eventName]) {
            const index = this.eventListeners[eventName].indexOf(listener);
            if (index !== -1) {
                this.eventListeners[eventName].splice(index, 1);
            }
        }
    }

    triggerEvent(eventName: string, eventData: any): void {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName].forEach(listener => listener(eventData));
        }
    }
}

// Mock for group layout tests
export class GroupableWindowMock {
    public name: string;
    private group: GroupableWindowMock[] = [];

    constructor(name: string) {
        this.name = name;
    }

    joinGroup(targetWindow: GroupableWindowMock): Promise<void> {
        return new Promise((resolve) => {
            this.group.push(targetWindow);
            resolve();
        });
    }

    leaveGroup(): Promise<void> {
        return new Promise((resolve) => {
            this.group = [];
            resolve();
        });
    }

    getGroup(callback: (windows: GroupableWindowMock[]) => void): void {
        callback(this.group);
    }
}

// Mock for notification tests
export class NotifiableContainerMock {
    private notificationConstructor: any;

    constructor() {
        this.notificationConstructor = function(title: string, options: any) {
            return { title, options };
        };
    }

    registerNotificationsApi(): void {
        // Simulate registering the notifications API
    }

    createNotification(title: string, options?: any): any {
        return new this.notificationConstructor(title, options);
    }

    getNotificationConstructor(): any {
        return this.notificationConstructor;
    }
}
