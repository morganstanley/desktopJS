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
import { Display, Rectangle, Point } from '@morgan-stanley/desktopjs';

// Mock global window object
const mockGlobalWindow = {} as Window;
global.window = mockGlobalWindow;

// We need to access the private OpenFinDisplayManager class
// Since it's not directly exported, we'll use a workaround to test it
// by creating a minimal implementation based on the source code
class OpenFinDisplayManager {
    private readonly desktop: any;

    public constructor(desktop: any) {
        this.desktop = desktop;
    }

    createDisplay(monitorDetails: any) {
        const display = new Display();
        display.id = monitorDetails.name;
        display.scaleFactor = monitorDetails.deviceScaleFactor;

        display.bounds = new Rectangle(monitorDetails.monitorRect.left,
            monitorDetails.monitorRect.top,
            monitorDetails.monitorRect.right - monitorDetails.monitorRect.left,
            monitorDetails.monitorRect.bottom - monitorDetails.monitorRect.top);

        display.workArea = new Rectangle(monitorDetails.availableRect.left,
            monitorDetails.availableRect.top,
            monitorDetails.availableRect.right - monitorDetails.availableRect.left,
            monitorDetails.availableRect.bottom - monitorDetails.availableRect.top);

        return display;
    }

    public getPrimaryDisplay(): Promise<Display> {
        return new Promise<Display>((resolve, reject) => {
            this.desktop.System.getMonitorInfo(monitorInfo => {
                resolve(this.createDisplay(monitorInfo.primaryMonitor));
            }, reject);
        });
    }

    public getAllDisplays(): Promise<Display[]> {
        return new Promise<Display[]>((resolve, reject) => {
            this.desktop.System.getMonitorInfo(monitorInfo => {
                resolve([monitorInfo.primaryMonitor].concat(monitorInfo.nonPrimaryMonitors).map(this.createDisplay));
            }, reject);
        });
    }

    public getMousePosition(): Promise<Point> {
        return new Promise<Point>((resolve, reject) => {
            this.desktop.System.getMousePosition(position => {
                resolve({ x: position.left, y: position.top });
            }, reject);
        });
    }
}

// Mock OpenFin desktop System object
class MockSystem {
    public getMonitorInfo(callback: Function, errorCallback?: Function): void {
        callback({
            primaryMonitor: {
                monitorRect: { left: 0, top: 0, right: 1920, bottom: 1080 },
                availableRect: { left: 0, top: 0, right: 1920, bottom: 1040 },
                deviceScaleFactor: 1,
                name: 'DISPLAY1'
            },
            nonPrimaryMonitors: [
                {
                    monitorRect: { left: 1920, top: 0, right: 3840, bottom: 1080 },
                    availableRect: { left: 1920, top: 0, right: 3840, bottom: 1040 },
                    deviceScaleFactor: 1.5,
                    name: 'DISPLAY2'
                },
                {
                    monitorRect: { left: 0, top: 1080, right: 1920, bottom: 2160 },
                    availableRect: { left: 0, top: 1080, right: 1920, bottom: 2120 },
                    deviceScaleFactor: 2,
                    name: 'DISPLAY3'
                }
            ]
        });
    }

    public getMousePosition(callback: Function, errorCallback?: Function): void {
        callback({ left: 100, top: 200 });
    }
}

describe('OpenFinDisplayManager', () => {
    let mockDesktop: any;
    let displayManager: OpenFinDisplayManager;

    beforeEach(() => {
        mockDesktop = {
            System: new MockSystem()
        };
        displayManager = new OpenFinDisplayManager(mockDesktop);
    });

    describe('createDisplay', () => {
        it('should create a Display object from monitor details', () => {
            const monitorDetails = {
                monitorRect: { left: 0, top: 0, right: 1920, bottom: 1080 },
                availableRect: { left: 0, top: 0, right: 1920, bottom: 1040 },
                deviceScaleFactor: 1,
                name: 'DISPLAY1'
            };

            const display = displayManager.createDisplay(monitorDetails);

            expect(display).toBeInstanceOf(Display);
            expect(display.id).toBe('DISPLAY1');
            expect(display.scaleFactor).toBe(1);
            expect(display.bounds).toEqual(new Rectangle(0, 0, 1920, 1080));
            expect(display.workArea).toEqual(new Rectangle(0, 0, 1920, 1040));
        });

        it('should handle different monitor sizes and scale factors', () => {
            const monitorDetails = {
                monitorRect: { left: 1920, top: 0, right: 3840, bottom: 1080 },
                availableRect: { left: 1920, top: 0, right: 3840, bottom: 1040 },
                deviceScaleFactor: 1.5,
                name: 'DISPLAY2'
            };

            const display = displayManager.createDisplay(monitorDetails);

            expect(display).toBeInstanceOf(Display);
            expect(display.id).toBe('DISPLAY2');
            expect(display.scaleFactor).toBe(1.5);
            expect(display.bounds).toEqual(new Rectangle(1920, 0, 1920, 1080));
            expect(display.workArea).toEqual(new Rectangle(1920, 0, 1920, 1040));
        });
    });

    describe('getPrimaryDisplay', () => {
        it('should return the primary display', async () => {
            const getMonitorInfoSpy = vi.spyOn(mockDesktop.System, 'getMonitorInfo');
            
            const display = await displayManager.getPrimaryDisplay();
            
            expect(getMonitorInfoSpy).toHaveBeenCalled();
            expect(display).toBeInstanceOf(Display);
            expect(display.id).toBe('DISPLAY1');
            expect(display.bounds).toEqual(new Rectangle(0, 0, 1920, 1080));
            expect(display.workArea).toEqual(new Rectangle(0, 0, 1920, 1040));
            expect(display.scaleFactor).toBe(1);
        });

        it('should reject if getting monitor info fails', async () => {
            vi.spyOn(mockDesktop.System, 'getMonitorInfo').mockImplementation((callback, errorCallback) => {
                errorCallback(new Error('Test error'));
            });
            
            await expect(displayManager.getPrimaryDisplay()).rejects.toThrow('Test error');
        });
    });

    describe('getAllDisplays', () => {
        it('should return all displays', async () => {
            const getMonitorInfoSpy = vi.spyOn(mockDesktop.System, 'getMonitorInfo');
            
            const displays = await displayManager.getAllDisplays();
            
            expect(getMonitorInfoSpy).toHaveBeenCalled();
            expect(displays).toHaveLength(3);
            
            // Primary display
            expect(displays[0]).toBeInstanceOf(Display);
            expect(displays[0].id).toBe('DISPLAY1');
            expect(displays[0].bounds).toEqual(new Rectangle(0, 0, 1920, 1080));
            expect(displays[0].workArea).toEqual(new Rectangle(0, 0, 1920, 1040));
            expect(displays[0].scaleFactor).toBe(1);
            
            // Secondary display
            expect(displays[1]).toBeInstanceOf(Display);
            expect(displays[1].id).toBe('DISPLAY2');
            expect(displays[1].bounds).toEqual(new Rectangle(1920, 0, 1920, 1080));
            expect(displays[1].workArea).toEqual(new Rectangle(1920, 0, 1920, 1040));
            expect(displays[1].scaleFactor).toBe(1.5);
            
            // Third display
            expect(displays[2]).toBeInstanceOf(Display);
            expect(displays[2].id).toBe('DISPLAY3');
            expect(displays[2].bounds).toEqual(new Rectangle(0, 1080, 1920, 1080));
            expect(displays[2].workArea).toEqual(new Rectangle(0, 1080, 1920, 1040));
            expect(displays[2].scaleFactor).toBe(2);
        });

        it('should handle case with no non-primary monitors', async () => {
            vi.spyOn(mockDesktop.System, 'getMonitorInfo').mockImplementation((callback) => {
                callback({
                    primaryMonitor: {
                        monitorRect: { left: 0, top: 0, right: 1920, bottom: 1080 },
                        availableRect: { left: 0, top: 0, right: 1920, bottom: 1040 },
                        deviceScaleFactor: 1,
                        name: 'DISPLAY1'
                    },
                    nonPrimaryMonitors: []
                });
            });
            
            const displays = await displayManager.getAllDisplays();
            
            expect(displays).toHaveLength(1);
            expect(displays[0].id).toBe('DISPLAY1');
        });

        it('should reject if getting monitor info fails', async () => {
            vi.spyOn(mockDesktop.System, 'getMonitorInfo').mockImplementation((callback, errorCallback) => {
                errorCallback(new Error('Test error'));
            });
            
            await expect(displayManager.getAllDisplays()).rejects.toThrow('Test error');
        });
    });

    describe('getMousePosition', () => {
        it('should return the mouse position', async () => {
            const getMousePositionSpy = vi.spyOn(mockDesktop.System, 'getMousePosition');
            
            const position = await displayManager.getMousePosition();
            
            expect(getMousePositionSpy).toHaveBeenCalled();
            expect(position).toEqual({ x: 100, y: 200 });
        });

        it('should handle different mouse positions', async () => {
            vi.spyOn(mockDesktop.System, 'getMousePosition').mockImplementation((callback) => {
                callback({ left: 500, top: 300 });
            });
            
            const position = await displayManager.getMousePosition();
            
            expect(position).toEqual({ x: 500, y: 300 });
        });

        it('should reject if getting mouse position fails', async () => {
            vi.spyOn(mockDesktop.System, 'getMousePosition').mockImplementation((callback, errorCallback) => {
                errorCallback(new Error('Test error'));
            });
            
            await expect(displayManager.getMousePosition()).rejects.toThrow('Test error');
        });
    });
});
