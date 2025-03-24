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
import { ContainerWindow } from '@morgan-stanley/desktopjs';
import { OpenFinContainer, OpenFinContainerWindow } from '../src/openfin';

// Mock global window object
const mockGlobalWindow = {} as Window;
// Add fin object to window to avoid "Cannot read properties of undefined (reading 'desktop')" error
(mockGlobalWindow as any).fin = {
    desktop: {}
};
// Add location to mockGlobalWindow for tests
(mockGlobalWindow as any).location = {
    toString: () => 'https://example.com'
};
global.window = mockGlobalWindow;

// Mock desktop implementation for platform and snapshot tests
class MockDesktop {
    constructor(options?: { isPlatform?: boolean, snapshotWindow?: string | null }) {
        if (options) {
            this.isPlatformValue = options.isPlatform || false;
            this.snapshotWindowName = options.snapshotWindow ?? 'snapshot-window';
        }
    }

    private isPlatformValue: boolean = false;
    private snapshotWindowName: string | null = 'snapshot-window';

    public Window = {
        getCurrent: vi.fn().mockReturnValue({
            name: 'current-window',
            getNativeWindow: vi.fn().mockReturnValue(mockGlobalWindow)
        }),
        wrap: vi.fn().mockImplementation((name) => ({
            name: name,
            getNativeWindow: vi.fn().mockReturnValue(mockGlobalWindow)
        })),
        new: vi.fn().mockImplementation((options, callback) => {
            const win = {
                name: options.name || 'new-window',
                getNativeWindow: vi.fn().mockReturnValue(mockGlobalWindow)
            };
            callback(win);
            return win;
        })
    };

    public Application = {
        getCurrent: vi.fn().mockReturnValue({
            getWindow: vi.fn().mockReturnValue({
                name: 'main-window',
                getNativeWindow: vi.fn().mockReturnValue(mockGlobalWindow)
            }),
            uuid: 'test-uuid',
            getChildWindows: vi.fn().mockImplementation((callback) => {
                callback([{
                    name: 'child-window',
                    getNativeWindow: vi.fn().mockReturnValue(mockGlobalWindow)
                }]);
            }),
            addEventListener: vi.fn(),
            getManifest: vi.fn().mockImplementation((callback, errorCallback) => {
                if (errorCallback && this.throwManifestError) {
                    errorCallback(new Error('Manifest error'));
                    return;
                }
                callback({ 
                    platform: this.isPlatformValue,
                    snapshot: this.snapshotWindowName 
                        ? { windows: [{ name: this.snapshotWindowName }] } 
                        : { windows: [] }
                });
            })
        })
    };

    public System = {
        getMonitorInfo: vi.fn().mockImplementation((callback) => {
            callback({
                primaryMonitor: {
                    monitorRect: { left: 0, top: 0, right: 1920, bottom: 1080 },
                    availableRect: { left: 0, top: 0, right: 1920, bottom: 1040 },
                    deviceScaleFactor: 1,
                    name: 'DISPLAY1'
                },
                nonPrimaryMonitors: []
            });
        }),
        log: vi.fn().mockImplementation((level, message, callback) => callback())
    };

    public InterApplicationBus = {
        subscribe: vi.fn().mockImplementation((uuid, name, topic, listener, callback) => callback()),
        unsubscribe: vi.fn().mockImplementation((uuid, name, topic, listener, callback) => callback()),
        publish: vi.fn().mockImplementation((topic, message, callback) => callback())
    };

    // Helper for testing error paths
    public throwManifestError: boolean = false;
    public setThrowManifestError(value: boolean): void {
        this.throwManifestError = value;
    }
}

// Create a test subclass to expose protected methods
class TestOpenFinContainer extends OpenFinContainer {
    constructor(desktop?: any) {
        super(desktop || new MockDesktop(), mockGlobalWindow as any);
    }
}

describe('OpenFinContainer Platform Features', () => {
    let mockDesktop: MockDesktop;
    let container: TestOpenFinContainer;

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('isPlatform', () => {
        it('should return false when not running in OpenFin Platform', async () => {
            mockDesktop = new MockDesktop({ isPlatform: false });
            container = new TestOpenFinContainer(mockDesktop);
            
            const isPlatform = await container.getIsPlatform();
            expect(isPlatform).toBe(false);
        });

        it('should return true when running in OpenFin Platform', async () => {
            mockDesktop = new MockDesktop({ isPlatform: true });
            container = new TestOpenFinContainer(mockDesktop);
            
            const isPlatform = await container.getIsPlatform();
            expect(isPlatform).toBe(true);
        });
    });

    describe('getManifest', () => {
        it('should return the manifest object', async () => {
            mockDesktop = new MockDesktop({ isPlatform: true });
            container = new TestOpenFinContainer(mockDesktop);
            
            const manifest = await container.getManifest();
            expect(manifest).toEqual({
                platform: true,
                snapshot: { windows: [{ name: 'snapshot-window' }] }
            });
        });

        it('should handle error when getting manifest fails', async () => {
            mockDesktop = new MockDesktop();
            mockDesktop.setThrowManifestError(true);
            container = new TestOpenFinContainer(mockDesktop);
            
            await expect(container.getManifest()).rejects.toThrow('Manifest error');
        });
    });

    describe('snapshot window functionality', () => {
        it('should return snapshot window name when available', async () => {
            mockDesktop = new MockDesktop({ snapshotWindow: 'custom-snapshot' });
            container = new TestOpenFinContainer(mockDesktop);
            
            const windowName = await container.getSnapshotWindowName();
            expect(windowName).toBe('custom-snapshot');
        });
    });
});
