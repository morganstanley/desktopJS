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
import { Default } from "../../../src/Default/default";
import { ContainerWindow } from "../../../src/window";
import { Container } from "../../../src/container";

class MockWindow {
    public listener: any;
    public name: string = "Name";
    public focus = vi.fn();
    public show = vi.fn();
    public close = vi.fn().mockResolvedValue(undefined);
    public open = vi.fn(() => new MockWindow());
    public addEventListener = vi.fn((type: string, listener: any) => { this.listener = listener; });
    public removeEventListener = vi.fn();
    public postMessage = vi.fn();
    public moveTo = vi.fn();
    public resizeTo = vi.fn();
    public getState = vi.fn().mockResolvedValue(undefined);
    public setState = vi.fn().mockResolvedValue(undefined);
    public screenX: any = 0;
    public screenY: any = 1;
    public outerWidth: any = 2;
    public outerHeight: any = 3;
    location: any = {
        origin: "origin",
        replace: vi.fn()
    };
}

describe("DefaultContainerWindow", () => {
    const mockWindow = new MockWindow();
    let win: Default.DefaultContainerWindow;

    beforeEach(() => {
        win = new Default.DefaultContainerWindow(mockWindow);
    });

    describe("focus", () => {
        it("Invokes underlying window focus and resolves promise", () => {
            win.focus();
            expect(mockWindow.focus).toHaveBeenCalled();
        });
    });

    it("load invokes underlying location.replace", async () => {
        await win.load("url");
        expect(mockWindow.location.replace).toHaveBeenCalledWith("url");
    });

    it("id returns underlying id", () => {
        mockWindow[Default.DefaultContainer.windowUuidPropertyKey] = "UUID";
        expect(win.id).toBe("UUID");
    });

    it("name returns underlying name", () => {
        mockWindow[Default.DefaultContainer.windowNamePropertyKey] = "NAME";
        expect(win.name).toBe("NAME");
    });

    it("show throws no errors", () => {
        expect(win.show()).toBeDefined();
    });

    it("hide throws no errors", () => {
        expect(win.hide()).toBeDefined();
    });

    it("isShowing throws no errors", () => {
        expect(win.isShowing()).toBeDefined();
    });

    describe("getState", () => {
        it("getState undefined", async () => {
            const mockWindow = {};
            const win = new Default.DefaultContainerWindow(mockWindow);
            const state = await win.getState();
            expect(state).toBeUndefined();
        });

        it("getState defined", async () => {
            const mockState = { value: "Foo" };
            vi.spyOn(win.innerWindow, "getState").mockResolvedValue(mockState);
            const state = await win.getState();
            expect(win.innerWindow.getState).toHaveBeenCalled();
            expect(state).toBe(mockState);
        });
    });

    describe("setState", () => {
        it("setState undefined", async () => {
            const mockWindow = {};
            const win = new Default.DefaultContainerWindow(mockWindow);
            await expect(win.setState({})).resolves.toBeUndefined();
        });

        it("setState defined", async () => {
            const mockState = { value: "Foo" };
            const setStateSpy = vi.spyOn(win.innerWindow, "setState").mockResolvedValue(undefined);
            await win.setState(mockState);
            expect(setStateSpy).toHaveBeenCalledWith(mockState);
        });
    });

    it("getSnapshot rejects", async () => {
        await expect(win.getSnapshot()).rejects.toThrow();
    });

    it("close", async () => {
        const closeSpy = vi.spyOn(win, "close");
        await win.close();
        expect(closeSpy).toHaveBeenCalled();
    });

    it("minimize", async () => {
        const innerWindow = { minimize: vi.fn() };
        await new Default.DefaultContainerWindow(innerWindow).minimize();
        expect(innerWindow.minimize).toHaveBeenCalledTimes(1);
    });

    it("maximize", async () => {
        const innerWindow = { maximize: vi.fn() };
        await new Default.DefaultContainerWindow(innerWindow).maximize();
        expect(innerWindow.maximize).toHaveBeenCalledTimes(1);
    });
    
    it("restore", async () => {
        const innerWindow = { restore: vi.fn() };
        await new Default.DefaultContainerWindow(innerWindow).restore();
        expect(innerWindow.restore).toHaveBeenCalledTimes(1);
    });    

    it("getBounds retrieves underlying window position", async () => {
        const bounds = await win.getBounds();
        expect(bounds).toBeDefined();
        expect(bounds.x).toBe(0);
        expect(bounds.y).toBe(1);
        expect(bounds.width).toBe(2);
        expect(bounds.height).toBe(3);
    });

    it("setBounds sets underlying window position", async () => {
        const moveToSpy = vi.spyOn(win.innerWindow, "moveTo");
        const resizeToSpy = vi.spyOn(win.innerWindow, "resizeTo");
        await win.setBounds({ x: 0, y: 1, width: 2, height: 3 } as any);
        expect(moveToSpy).toHaveBeenCalledWith(0, 1);
        expect(resizeToSpy).toHaveBeenCalledWith(2, 3);
    });

    it("flash resolves with not supported", async () => {
        await expect(win.flash(true)).rejects.toThrow("Not supported");
    });

    it("getParent throws no errors", async () => {
        await expect(win.getParent()).resolves.toBeNull();
    });

    it("setParent throws no errors", async () => {
        await expect(win.setParent(null)).resolves.toBeUndefined();
    });

    it("getOptions", async () => {
        const win = await new Default.DefaultContainer(new MockWindow() as any).createWindow("url", { a: "foo" });
        const options = await win.getOptions();
        expect(options).toBeDefined();
        expect(options).toEqual({ a: "foo"});
    });

    describe("addListener", () => {
        it("addListener calls underlying window addEventListener with mapped event name", () => {
            const addEventListenerSpy = vi.spyOn(win.innerWindow, "addEventListener");
            win.addListener("close", () => { });
            expect(addEventListenerSpy).toHaveBeenCalledWith("unload", expect.any(Function));
        });

        it("addListener calls underlying window addEventListener with unmapped event name", () => {
            const unmappedEvent = "resize";
            const addEventListenerSpy = vi.spyOn(win.innerWindow, "addEventListener");
            win.addListener(unmappedEvent, () => { });
            expect(addEventListenerSpy).toHaveBeenCalledWith(unmappedEvent, expect.any(Function));
        });
    });
});

describe("DefaultContainer", () => {
    let window: MockWindow;
    let container: Default.DefaultContainer;

    beforeEach(() => {
        window = new MockWindow();
        container = new Default.DefaultContainer(window as any);
    });

    it("hostType is Default", () => {
        expect(container.hostType).toBe("Default");
    });

    describe("window management", () => {
        it("getAllWindows returns wrapped native windows", async () => {
            window[Default.DefaultContainer.windowsPropertyKey] = {
                "1": new MockWindow(),
                "2": new MockWindow()
            };

            const windows = await container.getAllWindows();
            expect(windows).toBeDefined();
            expect(windows.length).toBe(2);
        });

        it("getWindow returns wrapped window", async () => {
            window[Default.DefaultContainer.windowsPropertyKey] = {
                "1": new MockWindow(),
                "2": new MockWindow()
            };

            const win = await container.getWindowById("1");
            expect(win).toBeDefined();
        });

        it("getWindow with unknown id returns null", async () => {
            const win = await container.getWindowById("1");
            expect(win).toBeNull();
        });

        it.skip("getWindowByName returns wrapped window", async () => {
            window[Default.DefaultContainer.windowsPropertyKey] = {
                "1": new MockWindow(),
                "2": new MockWindow()
            };

            const win = await container.getWindowByName("Name");
            expect(win).toBeDefined();
        });

        it("getWindowByName with unknown name returns null", async () => {
            const win = await container.getWindowByName("Name");
            expect(win).toBeNull();
        });

        it("createWindow adds window to windows", async () => {
            window[Default.DefaultContainer.windowsPropertyKey] = {};
            const newWin = await container.createWindow("url");
            expect(Object.keys(window[Default.DefaultContainer.windowsPropertyKey]).length).toBe(1);
        });

        it("createWindow fires window-created", async () => {
            const callback = vi.fn();
            container.addListener("window-created", callback);
            await container.createWindow("url");
            expect(callback).toHaveBeenCalled();
        });

        it("createWindow fires content-loaded", async () => {
            const callback = vi.fn();
            container.addListener("window-created", callback);
            await container.createWindow("url");
            expect(callback).toHaveBeenCalled();
        });

        it("buildLayout creates PersistedWindowLayout", async () => {
            window[Default.DefaultContainer.windowsPropertyKey] = {
                "1": new MockWindow(),
                "2": new MockWindow()
            };

            const layout = await container.buildLayout();
            expect(layout).toBeDefined();
            expect(layout.windows.length).toBe(2);
        });
    });

    describe("notifications", () => {
        it("showNotification warns about not being implemented", () => {
            const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
            container.showNotification("message");
            expect(consoleSpy).toHaveBeenCalledWith("Notifications not supported");
        });

        it.skip("showNotification warns about not being implemented with HTML5 Notification", () => {
            window.Notification = {
                requestPermission: vi.fn()
            } as any;

            const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
            container.showNotification("message");
            expect(consoleSpy).toHaveBeenCalledWith("Notifications not supported");
        });

        it.skip("showNotification with HTML5 Notification and granted permission invokes Notification", () => {
            window.Notification = {
                permission: "granted",
                requestPermission: vi.fn()
            } as any;

            const options = {};
            container.showNotification("message", options);
            expect(window.Notification).toHaveBeenCalledWith("message", options);
        });
    });

    describe("window messaging", () => {
        it.skip("addListener adds callback to listeners", () => {
            const callback = vi.fn();
            container.addListener("message", callback);
            window.listener({ data: { source: "desktopJS" } });
            expect(callback).toHaveBeenCalled();
        });

        it("removeListener removes callback from listeners", () => {
            const callback = vi.fn();
            container.addListener("message", callback);
            container.removeListener("message", callback);
            window.listener({ data: { source: "desktopJS" } });
            expect(callback).not.toHaveBeenCalled();
        });
    });
});
