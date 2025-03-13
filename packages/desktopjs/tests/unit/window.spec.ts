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
    });

    it("isVerticallyAligned", () => {
        const mgr = new SnapAssistWindowManager(null);
        const r1 = new Rectangle(100, 100, 50, 50);
        const r2 = new Rectangle(100, 200, 50, 50);
        expect(mgr.isVerticallyAligned(r1, r2)).toBe(true);
    });
});
