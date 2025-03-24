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
import { ContainerWindow, WindowEventType, WindowEventArgs, WindowStateTracking, GroupWindowManager, SnapAssistWindowManager, Rectangle } from "../../src/window";
import { EventArgs, EventEmitter } from "../../src/events";
import { TestContainer } from "./container.spec"

class MockWindow extends ContainerWindow {
    public id: string;
    public name: string;
    public load(url: string, options?: any): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public show(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public hide(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public close(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public maximize(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public isShowing(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    public getSnapshot(): Promise<string> {
        throw new Error("Method not implemented.");
    }
    public getBounds(): Promise<Rectangle> {
        throw new Error("Method not implemented.");
    }
    public flash(enable: boolean, options?: any): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public getParent(): Promise<ContainerWindow> {
        throw new Error("Method not implemented.");
    }
    public setParent(parent: ContainerWindow): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public setBounds(bounds: Rectangle): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public getOptions(): Promise<any> {
        throw new Error("Method not implemented.");
    }
    protected detachListener(eventName: WindowEventType, listener: (event: EventArgs) => void): void {
        throw new Error("Method not implemented.");
    }
 
    protected attachListener(eventName: WindowEventType, listener: (event: EventArgs) => void): void {
        return;
    }

    public async focus() { }
    public async minimize() { }
    public async restore() { }
}

describe("ContainerWindow", () => {
    it("nativeWindow returns undefined", () => {
        expect(new MockWindow(undefined).nativeWindow).toBeUndefined();
    });

    it("getState returns undefined", async () => {
        const state = await new MockWindow(undefined).getState();
        expect(state).toBeUndefined();
    });

    it("setState returns", async () => {
        await expect(new MockWindow(undefined).setState({})).resolves.toBeUndefined();
    });

    it("bringToFront invokes focus by default", async () => {
        const win = new MockWindow(undefined);
        const focusSpy = vi.spyOn(win, "focus");
        await win.bringToFront();
        expect(focusSpy).toHaveBeenCalled();
    });
});

describe("static events", () => {
    let container: TestContainer;

    beforeEach(() => {
        container = new TestContainer();
        (EventEmitter as any).staticEventListeners = new Map();
    });

    it("addListener adds callback to listeners", () => {
        expect(ContainerWindow.listeners("window-created").length).toBe(0);
        ContainerWindow.addListener("window-created", (event: EventArgs) => { /* empty */ });
        expect(ContainerWindow.listeners("window-created").length).toBe(1);
    });

    it("removeListener removes callback to listeners", () => {
        expect(ContainerWindow.listeners("window-created").length).toBe(0);
        const callback = (event: EventArgs) => { /* empty */ };
        ContainerWindow.addListener("window-created", callback);
        expect(ContainerWindow.listeners("window-created").length).toBe(1);
        ContainerWindow.removeListener("window-created", callback);
        expect(ContainerWindow.listeners("window-created").length).toBe(0);
    });

    it("emit invokes ipc publish", () => {
        const args = new EventArgs(undefined, "window-created", {});
        const publishSpy = vi.spyOn(container.ipc, "publish");
        ContainerWindow.emit(args.name as WindowEventType, args as WindowEventArgs);
        expect(publishSpy).toHaveBeenCalledWith("desktopJS.static-event", { eventName: "containerwindow-" + args.name, eventArgs: args });
    });
});

describe("window grouping", () => {
    it("allowGrouping is false", () => {
        expect(new MockWindow(null).allowGrouping).toBe(false);
    });

    it("getGroup returns empty array", async () => {
        const windows = await new MockWindow(null).getGroup();
        expect(windows).toBeDefined();
        expect(windows.length).toBe(0);
    });

    it("joinGroup not supported", async () => {
        await expect(new MockWindow(null).joinGroup(null)).rejects.toThrow("Not supported");
    });

    it("leaveGroup resolves", async () => {
        await expect(new MockWindow(null).leaveGroup()).resolves.toBeUndefined();
    });
});

describe("Rectangle", () => {
    let r: Rectangle;
    beforeEach(() => {
        r = new Rectangle(1, 2, 3, 4);
    });

    it("ctor sets properties", () => {
        expect(r.x).toBe(1);
        expect(r.y).toBe(2);
        expect(r.width).toBe(3);
        expect(r.height).toBe(4);
    });

    it("right is calculated as x + width", () => {
        expect(r.right).toBe(4);

        // check duck typing static method helper
        expect(Rectangle.getRight({ x: 1, y: 2, width: 3, height: 4 } as Rectangle)).toBe(4);
    });

    it("bottom is calculated as top + height", () => {
        expect(r.bottom).toBe(6);

        // check duck typing static method helper
        expect(Rectangle.getBottom({ x: 1, y: 2, width: 3, height: 4 } as Rectangle)).toBe(6);
    });
});

describe("GroupWindowManager", () => {
    it("default options", () => {
        const mgr = new GroupWindowManager(null);
        expect(mgr.windowStateTracking).toBe(0);
    });

    it("overrides read from options", () => {
        const mgr = new GroupWindowManager(null, { windowStateTracking: WindowStateTracking.Main });
        expect(mgr.windowStateTracking).toBe(WindowStateTracking.Main);
    });

    it("Minimize with Main", () => {
        const innerWin = {
            minimize: vi.fn(),
            addListener: vi.fn()
        };
        const container = {
            getAllWindows: vi.fn().mockResolvedValue([]),
            getMainWindow: vi.fn()
        };
        const win = new MockWindow(innerWin);
        vi.spyOn(win, "getGroup").mockResolvedValue([win]);
        container.getAllWindows.mockResolvedValue([win]);
        container.getMainWindow.mockReturnValue(win);
        const mgr = new GroupWindowManager(container as any, { windowStateTracking: WindowStateTracking.Main });
        mgr.attach(win);
        win.emit("minimize", { name: "minimize", sender: win });
        expect(container.getAllWindows).toHaveBeenCalledTimes(2); // Once for initial GroupWindowManager ctor
        expect(win.getGroup).toHaveBeenCalledTimes(0);
    });
});

describe("SnapAssistWindowManager", () => {
    it("default options", () => {
        const mgr = new SnapAssistWindowManager(null);
        expect(mgr.snapThreshold).toBe(15);
        expect(mgr.snapOffset).toBe(15);
        expect(mgr.autoGrouping).toBe(true);
    });
    
    it("overrides options from constructor", () => {
        const mgr = new SnapAssistWindowManager(null, {
            snapThreshold: 20,
            snapOffset: 25,
            autoGrouping: false
        });
        expect(mgr.snapThreshold).toBe(20);
        expect(mgr.snapOffset).toBe(25);
        expect(mgr.autoGrouping).toBe(false);
    });

    // Create a test class that exposes the protected/private methods
    class TestSnapAssistWindowManager extends SnapAssistWindowManager {
        public isHorizontallyAligned(r1: Rectangle, r2: Rectangle): boolean {
            return super["isHorizontallyAligned"](r1, r2);
        }
        
        public isVerticallyAligned(r1: Rectangle, r2: Rectangle): boolean {
            return super["isVerticallyAligned"](r1, r2);
        }
        
        public getSnapBounds(r1: Rectangle, r2: Rectangle): Rectangle | undefined {
            return super["getSnapBounds"](r1, r2);
        }
        
        public showGroupingHint(win: ContainerWindow): void {
            super["showGroupingHint"](win);
        }
        
        public hideGroupingHint(win: ContainerWindow): void {
            super["hideGroupingHint"](win);
        }
        
        public moveWindow(win: ContainerWindow, bounds: Rectangle): Promise<void> {
            return super["moveWindow"](win, bounds);
        }
        
        public onMoved(win: ContainerWindow): void {
            super["onMoved"](win);
        }
        
        public onAttached(win: ContainerWindow): void {
            super["onAttached"](win);
        }
        
        public get targetGroupMap(): Map<string, ContainerWindow> {
            return this["targetGroup"];
        }
        
        public set snappingWindowId(id: string | undefined) {
            this["snappingWindow"] = id;
        }
        
        public get snappingWindowId(): string | undefined {
            return this["snappingWindow"];
        }
        
        // Direct access to onMoving for testing
        public testOnMoving(e: any): Promise<void> {
            return this["onMoving"](e);
        }
    }

    it("isVerticallyAligned when windows are vertically aligned", () => {
        const mgr = new TestSnapAssistWindowManager(null);
        const r1 = new Rectangle(100, 100, 50, 50);
        const r2 = new Rectangle(100, 200, 50, 50);
        expect(mgr.isVerticallyAligned(r1, r2)).toBe(true);
    });
    
    it("isVerticallyAligned when windows are not vertically aligned", () => {
        const mgr = new TestSnapAssistWindowManager(null);
        const r1 = new Rectangle(100, 100, 50, 50);
        const r2 = new Rectangle(200, 200, 50, 50);
        expect(mgr.isVerticallyAligned(r1, r2)).toBe(false);
    });
    
    it("isHorizontallyAligned when windows are horizontally aligned", () => {
        const mgr = new TestSnapAssistWindowManager(null);
        const r1 = new Rectangle(100, 100, 50, 50);
        const r2 = new Rectangle(200, 100, 50, 50);
        expect(mgr.isHorizontallyAligned(r1, r2)).toBe(true);
    });
    
    it("isHorizontallyAligned when windows are not horizontally aligned", () => {
        const mgr = new TestSnapAssistWindowManager(null);
        const r1 = new Rectangle(100, 100, 50, 50);
        const r2 = new Rectangle(200, 200, 50, 50);
        expect(mgr.isHorizontallyAligned(r1, r2)).toBe(false);
    });
    
    it("getSnapBounds returns undefined when no snap condition is met", () => {
        const mgr = new TestSnapAssistWindowManager(null);
        const r1 = new Rectangle(100, 100, 50, 50);
        const r2 = new Rectangle(200, 200, 50, 50);
        expect(mgr.getSnapBounds(r1, r2)).toBeUndefined();
    });
    
    // Test for horizontal alignment with snap conditions
    it("getSnapBounds with horizontal alignment", () => {
        const mgr = new TestSnapAssistWindowManager(null);
        mgr.snapThreshold = 20;
        
        // Create rectangles that are horizontally aligned and within threshold
        const r1 = new Rectangle(100, 100, 50, 50);
        const r2 = new Rectangle(135, 100, 50, 50);
        
        // The rectangles are horizontally aligned and the right edge of r1 (150)
        // is within threshold of the left edge of r2 (135)
        const result = mgr.getSnapBounds(r1, r2);
        
        expect(result).toBeDefined();
        // The expected x position should be calculated based on the actual implementation
        expect(result.width).toBe(50);
        expect(result.height).toBe(50);
    });
    
    // Test for vertical alignment with snap conditions
    it("getSnapBounds with vertical alignment", () => {
        const mgr = new TestSnapAssistWindowManager(null);
        mgr.snapThreshold = 20;
        
        // Create rectangles that are vertically aligned and within threshold
        const r1 = new Rectangle(100, 100, 50, 50);
        const r2 = new Rectangle(100, 135, 50, 50);
        
        // The rectangles are vertically aligned and the bottom edge of r1 (150)
        // is within threshold of the top edge of r2 (135)
        const result = mgr.getSnapBounds(r1, r2);
        
        expect(result).toBeDefined();
        expect(result.width).toBe(50);
        expect(result.height).toBe(50);
    });
    
    // Window movement and grouping tests
    
    it("moveWindow sets and clears snappingWindow", async () => {
        const win = new MockWindow();
        win.id = "test-window";
        
        // Create a mock implementation of setBounds
        const setBoundsSpy = vi.fn().mockResolvedValue(undefined);
        vi.spyOn(win, "setBounds").mockImplementation(setBoundsSpy);
        
        const mgr = new TestSnapAssistWindowManager(null);
        const bounds = new Rectangle(100, 100, 50, 50);
        
        await mgr.moveWindow(win, bounds);
        
        expect(setBoundsSpy).toHaveBeenCalled();
        expect(mgr.snappingWindowId).toBeUndefined();
    });
    
    it("moveWindow handles errors", async () => {
        const win = new MockWindow();
        win.id = "test-window";
        
        // Create a mock implementation that throws an error
        const setBoundsSpy = vi.fn().mockRejectedValue(new Error("Test error"));
        vi.spyOn(win, "setBounds").mockImplementation(setBoundsSpy);
        
        const mgr = new TestSnapAssistWindowManager(null);
        const bounds = new Rectangle(100, 100, 50, 50);
        
        await mgr.moveWindow(win, bounds);
        
        expect(setBoundsSpy).toHaveBeenCalled();
        expect(mgr.snappingWindowId).toBeUndefined();
    });
    
    it("showGroupingHint adds window to targetGroup", () => {
        const win = new MockWindow();
        win.id = "test-window";
        
        const mgr = new TestSnapAssistWindowManager(null);
        mgr.showGroupingHint(win);
        
        expect(mgr.targetGroupMap.has("test-window")).toBe(true);
        expect(mgr.targetGroupMap.get("test-window")).toBe(win);
    });
    
    it("hideGroupingHint removes window from targetGroup", () => {
        const win = new MockWindow();
        win.id = "test-window";
        
        const mgr = new TestSnapAssistWindowManager(null);
        mgr.targetGroupMap.set("test-window", win);
        
        mgr.hideGroupingHint(win);
        
        expect(mgr.targetGroupMap.has("test-window")).toBe(false);
    });
    
    it("onMoved joins windows to group when autoGrouping is true", async () => {
        const win = new MockWindow();
        win.id = "test-window";
        
        const targetWin1 = new MockWindow();
        targetWin1.id = "target-window-1";
        const targetWin2 = new MockWindow();
        targetWin2.id = "target-window-2";
        
        // Mock joinGroup
        const joinGroupSpy1 = vi.fn().mockResolvedValue(undefined);
        const joinGroupSpy2 = vi.fn().mockResolvedValue(undefined);
        vi.spyOn(win, "joinGroup").mockImplementation(joinGroupSpy1);
        vi.spyOn(targetWin2, "joinGroup").mockImplementation(joinGroupSpy2);
        
        // Mock getGroup to simulate ungrouped windows
        vi.spyOn(targetWin1, "getGroup").mockResolvedValue([]);
        vi.spyOn(targetWin2, "getGroup").mockResolvedValue([]);
        
        const mgr = new TestSnapAssistWindowManager(null);
        mgr.targetGroupMap.set("target-window-1", targetWin1);
        mgr.targetGroupMap.set("target-window-2", targetWin2);
        
        mgr.onMoved(win);
        
        // Wait for promises to resolve
        await new Promise(resolve => setTimeout(resolve, 10));
        
        expect(joinGroupSpy1).toHaveBeenCalledWith(targetWin1);
        expect(joinGroupSpy2).toHaveBeenCalledWith(win);
        expect(mgr.targetGroupMap.size).toBe(0);
    });
    
    it("onMoved doesn't join windows when autoGrouping is false", async () => {
        const win = new MockWindow();
        win.id = "test-window";
        
        const targetWin = new MockWindow();
        targetWin.id = "target-window";
        
        // Mock joinGroup
        const joinGroupSpy = vi.fn().mockResolvedValue(undefined);
        vi.spyOn(win, "joinGroup").mockImplementation(joinGroupSpy);
        
        const mgr = new TestSnapAssistWindowManager(null, { autoGrouping: false });
        mgr.targetGroupMap.set("target-window", targetWin);
        
        mgr.onMoved(win);
        
        // Wait for promises to resolve
        await new Promise(resolve => setTimeout(resolve, 10));
        
        expect(joinGroupSpy).not.toHaveBeenCalled();
        expect(mgr.targetGroupMap.size).toBe(0);
    });
    
    it("attach calls super.attach", () => {
        const win = new MockWindow();
        
        // Mock getOptions to avoid "Method not implemented" error
        vi.spyOn(win, "getOptions").mockResolvedValue({});
        
        // Spy on super.attach
        const superAttachSpy = vi.spyOn(GroupWindowManager.prototype, "attach");
        
        const mgr = new TestSnapAssistWindowManager(null);
        mgr.attach(win);
        
        expect(superAttachSpy).toHaveBeenCalledWith(win);
        
        // Restore original implementation
        superAttachSpy.mockRestore();
    });
    
    it("onMoving returns early if window is already snapping", async () => {
        const win = new MockWindow();
        win.id = "test-window";
        
        // Create a spy for getOptions to verify it's not called
        const getOptionsSpy = vi.spyOn(win, "getOptions");
        
        const mgr = new TestSnapAssistWindowManager(null);
        mgr.snappingWindowId = "test-window";
        
        const event = { sender: win };
        await mgr.testOnMoving(event);
        
        // If it returns early, getOptions won't be called
        expect(getOptionsSpy).not.toHaveBeenCalled();
    });
    
    it("onMoving returns early if snap is disabled in options", async () => {
        const win = new MockWindow();
        win.id = "test-window";
        
        // Mock getOptions to return snap: false
        vi.spyOn(win, "getOptions").mockResolvedValue({ snap: false });
        
        // Create a spy for getGroup to verify it's not called
        const getGroupSpy = vi.spyOn(win, "getGroup");
        
        const mgr = new TestSnapAssistWindowManager(null);
        
        const event = { sender: win };
        await mgr.testOnMoving(event);
        
        // If it returns early, getGroup won't be called
        expect(getGroupSpy).not.toHaveBeenCalled();
    });
    
    it("onMoving returns early if window is already in a group", async () => {
        const win = new MockWindow();
        win.id = "test-window";
        
        // Mock getOptions to return empty object
        vi.spyOn(win, "getOptions").mockResolvedValue({});
        
        // Mock getGroup to return non-empty array (indicating window is in a group)
        vi.spyOn(win, "getGroup").mockResolvedValue([win, new MockWindow()]);
        
        // Mock getBounds to avoid "Method not implemented" error
        vi.spyOn(win, "getBounds").mockResolvedValue(new Rectangle(0, 0, 0, 0));
        
        // Create a mock container
        const container = {
            getAllWindows: vi.fn().mockResolvedValue([])
        };
        
        const mgr = new TestSnapAssistWindowManager(container as any);
        
        // Spy on moveWindow to verify it's not called
        const moveWindowSpy = vi.spyOn(mgr, "moveWindow").mockResolvedValue();
        
        const event = { sender: win };
        await mgr.testOnMoving(event);
        
        // If it returns early after checking the group, moveWindow won't be called
        expect(moveWindowSpy).not.toHaveBeenCalled();
    });
    
    it("onMoving handles OpenFin bounds", async () => {
        // Mock isOpenFin to return true
        const originalWindow = global.window;
        (global as any).window = { fin: {} };
        
        const win = new MockWindow();
        win.id = "test-window";
        
        // Mock methods
        vi.spyOn(win, "getOptions").mockResolvedValue({});
        vi.spyOn(win, "getGroup").mockResolvedValue([]);
        
        // Create a mock container with empty windows array
        const container = {
            getAllWindows: vi.fn().mockResolvedValue([])
        };
        
        const mgr = new TestSnapAssistWindowManager(container as any);
        
        // Mock moveWindow to verify it's called with the right bounds
        const moveWindowSpy = vi.spyOn(mgr, "moveWindow").mockResolvedValue();
        
        // Create an OpenFin-style event with innerEvent
        const event = { 
            sender: win,
            innerEvent: {
                left: 100,
                top: 200,
                width: 300,
                height: 400
            }
        };
        
        await mgr.testOnMoving(event);
        
        // Verify moveWindow was called with bounds from innerEvent
        expect(moveWindowSpy).toHaveBeenCalledWith(win, expect.objectContaining({
            x: 100,
            y: 200,
            width: 300,
            height: 400
        }));
        
        // Restore original window
        (global as any).window = originalWindow;
    });
    
    it("onMoving processes other windows for snapping", async () => {
        const win = new MockWindow();
        win.id = "test-window";
        
        const otherWin = new MockWindow();
        otherWin.id = "other-window";
        
        // Mock methods for the main window
        vi.spyOn(win, "getOptions").mockResolvedValue({});
        vi.spyOn(win, "getGroup").mockResolvedValue([]);
        vi.spyOn(win, "getBounds").mockResolvedValue(new Rectangle(100, 100, 50, 50));
        
        // Mock methods for the other window
        vi.spyOn(otherWin, "getOptions").mockResolvedValue({});
        vi.spyOn(otherWin, "getBounds").mockResolvedValue(new Rectangle(200, 100, 50, 50));
        
        // Create a mock container that returns the other window
        const container = {
            getAllWindows: vi.fn().mockResolvedValue([win, otherWin])
        };
        
        const mgr = new TestSnapAssistWindowManager(container as any);
        
        // Mock getSnapBounds to return a specific rectangle
        const snapBounds = new Rectangle(150, 100, 50, 50);
        vi.spyOn(mgr, "getSnapBounds").mockReturnValue(snapBounds);
        
        // Mock showGroupingHint and moveWindow
        const showGroupingHintSpy = vi.spyOn(mgr, "showGroupingHint");
        const moveWindowSpy = vi.spyOn(mgr, "moveWindow").mockResolvedValue();
        
        const event = { sender: win };
        await mgr.testOnMoving(event);
        
        // Verify the other window was processed
        expect(showGroupingHintSpy).toHaveBeenCalledWith(otherWin);
        expect(moveWindowSpy).toHaveBeenCalledWith(win, snapBounds);
    });
    
    it("onMoving handles non-snapped windows with OpenFin", async () => {
        // Mock isOpenFin to return true
        const originalWindow = global.window;
        (global as any).window = { fin: {} };
        
        const win = new MockWindow();
        win.id = "test-window";
        
        // Mock methods
        vi.spyOn(win, "getOptions").mockResolvedValue({});
        vi.spyOn(win, "getGroup").mockResolvedValue([]);
        
        // Create a mock container with empty windows array
        const container = {
            getAllWindows: vi.fn().mockResolvedValue([])
        };
        
        const mgr = new TestSnapAssistWindowManager(container as any);
        
        // Mock getSnapBounds to return undefined (no snap)
        vi.spyOn(mgr, "getSnapBounds").mockReturnValue(undefined);
        
        // Mock moveWindow to verify it's called with the original bounds
        const moveWindowSpy = vi.spyOn(mgr, "moveWindow").mockResolvedValue();
        
        // Create an OpenFin-style event with innerEvent
        const bounds = new Rectangle(100, 200, 300, 400);
        const event = { 
            sender: win,
            innerEvent: {
                left: bounds.x,
                top: bounds.y,
                width: bounds.width,
                height: bounds.height
            }
        };
        
        await mgr.testOnMoving(event);
        
        // Verify moveWindow was called with the original bounds
        expect(moveWindowSpy).toHaveBeenCalledWith(win, expect.objectContaining({
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height
        }));
        
        // Restore original window
        (global as any).window = originalWindow;
    });
});
