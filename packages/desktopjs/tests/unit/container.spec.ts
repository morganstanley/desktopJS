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
import { Container, ContainerBase, WebContainerBase } from "../../src/container";
import { ContainerWindow, PersistedWindowLayout } from "../../src/window";
import { NotificationOptions } from "../../src/notification";
import { MessageBus, MessageBusSubscription, MessageBusOptions } from "../../src/ipc";
import { EventArgs, EventEmitter } from "../../src/events";

class MockContainer extends ContainerBase {
    protected closeAllWindows(excludeSelf?: boolean): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public buildLayout(): Promise<PersistedWindowLayout> {
        throw new Error("Method not implemented.");
    }
    public getMainWindow(): ContainerWindow {
        throw new Error("Method not implemented.");
    }
    public getCurrentWindow(): ContainerWindow {
        throw new Error("Method not implemented.");
    }
    public createWindow(url: string, options?: any): Promise<ContainerWindow> {
        throw new Error("Method not implemented.");
    }
    public getAllWindows(): Promise<ContainerWindow[]> {
        throw new Error("Method not implemented.");
    }
    public getWindowById(id: string): Promise<ContainerWindow> {
        throw new Error("Method not implemented.");
    }
    public getWindowByName(name: string): Promise<ContainerWindow> {
        throw new Error("Method not implemented.");
    }

    public getOptions(): Promise<any> {
        throw new Error("Method not implemented.");
    }

    public setOptions(options: any) {
        throw new Error("Method not implemented.");
    }
}

export class MockMessageBus implements MessageBus { 
    private listener: any;

    async subscribe<T>(topic: string, listener: (event: any, message: T) => void, options?: MessageBusOptions): Promise<MessageBusSubscription> {
        this.listener = listener;
        return undefined;
    }

    async unsubscribe(subscription: MessageBusSubscription) {
        this.listener = undefined;
    }

    async publish<T>(topic: string, message: T, options?: MessageBusOptions) {
        this.listener?.({ topic: topic }, message);
    }
}

export class TestContainer extends ContainerBase {
    public getItemSpy: any;
    public setItemSpy: any;
    public removeItemSpy: any;
    public emitSpy: any;
    public closeAllWindowsSpy: any;
    public createWindowSpy: any;
    public getWindowByNameSpy: any;
    public getMainWindowSpy: any;
    public getAllWindowsSpy: any;

    getMainWindow(): ContainerWindow {
        const win = {
            setBounds: vi.fn(),
            getState: vi.fn().mockResolvedValue({}),
            setState: vi.fn().mockResolvedValue(undefined),
            name: "1"
        };
        return win as unknown as ContainerWindow;
    }

    async getWindowByName(name: string): Promise<ContainerWindow> {
        if (this.getWindowByNameSpy) {
            return this.getWindowByNameSpy(name);
        }
        
        const win = {
            setBounds: vi.fn(),
            joinGroup: vi.fn(),
            id: "1",
            name: name
        };
        return win as unknown as ContainerWindow;
    }

    async createWindow(url: string, options?: any): Promise<ContainerWindow> {
        if (this.createWindowSpy) {
            return this.createWindowSpy(url, options);
        }
        
        const win = {
            id: options?.name || "1",
            name: options?.name || "1",
            getState: vi.fn().mockResolvedValue({}),
            setState: vi.fn().mockResolvedValue(undefined)
        };
        return win as unknown as ContainerWindow;
    }

    constructor() {
        super();
        this.ipc = new MockMessageBus();
        
        // Create spies for storage methods
        this.getItemSpy = vi.fn().mockImplementation((key) => {
            if (key === ContainerBase.layoutsPropertyKey) {
                const layout: PersistedWindowLayout = new PersistedWindowLayout();
                layout.windows.push({ name: "1", id: "1", url: "url", bounds: {}, state: { "value": "foo" }, group: ["1", "2", "3"]});
                layout.windows.push({ name: "2", id: "2", main: true, url: "url", bounds: {}, group: ["1", "2", "3"]});
                layout.windows.push({ name: "3", id: "3", url: "url", bounds: {}, group: ["1", "2", "3"]});
                layout.name = "Test";
                return JSON.stringify({ "Test": layout });
            }
            return null;
        });
        
        this.setItemSpy = vi.fn();
        this.removeItemSpy = vi.fn();
        
        this.storage = {
            getItem: this.getItemSpy,
            setItem: this.setItemSpy,
            removeItem: this.removeItemSpy
        } as any;
        
        // Create spies for other methods
        this.emitSpy = vi.spyOn(this, 'emit');
        this.closeAllWindowsSpy = vi.fn().mockResolvedValue(undefined);
        this.getMainWindowSpy = vi.spyOn(this, 'getMainWindow');
        this.createWindowSpy = vi.fn().mockImplementation((url, options) => {
            const win = {
                id: options?.name || "new-window",
                name: options?.name || "new-window",
                url: url,
                getState: vi.fn().mockResolvedValue({}),
                setState: vi.fn().mockResolvedValue(undefined),
                setBounds: vi.fn().mockResolvedValue(undefined),
                joinGroup: vi.fn().mockResolvedValue(undefined)
            };
            return win as unknown as ContainerWindow;
        });
        this.getWindowByNameSpy = vi.fn().mockImplementation((name) => {
            const win = {
                id: name,
                name: name,
                joinGroup: vi.fn().mockResolvedValue(undefined)
            };
            return win as unknown as ContainerWindow;
        });
        this.getAllWindowsSpy = vi.fn().mockResolvedValue([]);
    }

    public async closeAllWindows(excludeSelf?: boolean) { 
        return this.closeAllWindowsSpy(excludeSelf);
    }
    
    public async getAllWindows(): Promise<ContainerWindow[]> { 
        return this.getAllWindowsSpy(); 
    }
    
    public getCurrentWindow(): ContainerWindow { return undefined; }
    
    public async getWindowById(): Promise<ContainerWindow> { return undefined; }
    
    public async buildLayout(): Promise<PersistedWindowLayout> { 
        const layout = new PersistedWindowLayout();
        layout.name = "Test";
        layout.windows.push({ 
            name: "1", 
            id: "1", 
            url: "url", 
            bounds: {}, 
            state: { "value": "foo" }, 
            group: ["1", "2", "3"]
        });
        return layout;
    }
    
    public setOptions(options: any) { }
    public async getOptions(): Promise<any> { return {}; }
}

// Mock implementation of WebContainerBase for testing
class TestWebContainer extends WebContainerBase {
    public wrapWindowSpy: any;
    
    constructor(win?: Window) {
        super(win);
        this.wrapWindowSpy = vi.fn().mockImplementation((window) => {
            return {
                id: "wrapped-window",
                name: "wrapped-window"
            } as unknown as ContainerWindow;
        });
    }
    
    public wrapWindow(window: any): ContainerWindow {
        return this.wrapWindowSpy(window);
    }
    
    protected closeAllWindows(): Promise<void> {
        return Promise.resolve();
    }
    
    public getMainWindow(): ContainerWindow {
        return {
            id: "main-window",
            name: "main-window"
        } as unknown as ContainerWindow;
    }
    
    public getCurrentWindow(): ContainerWindow {
        return this.getMainWindow();
    }
    
    public async createWindow(): Promise<ContainerWindow> {
        return {
            id: "new-window",
            name: "new-window"
        } as unknown as ContainerWindow;
    }
    
    public async getAllWindows(): Promise<ContainerWindow[]> {
        return [this.getMainWindow()];
    }
    
    public async getWindowById(): Promise<ContainerWindow> {
        return this.getMainWindow();
    }
    
    public async getWindowByName(): Promise<ContainerWindow> {
        return this.getMainWindow();
    }
    
    public setOptions(options: any) {}
    
    public async getOptions(): Promise<any> {
        return {};
    }
    
    public async buildLayout(): Promise<PersistedWindowLayout> {
        return new PersistedWindowLayout();
    }
}

describe("container", () => {
    let container: TestContainer;

    beforeEach(() => {
        container = new TestContainer();
        (EventEmitter as any).staticEventListeners = new Map();
    });

    it("ipc is defined", () => {
        expect(container.ipc).toBeDefined();
    });

    it("ready resolves", () => container.ready());

    it("getInfo returns undefined", async () => {
        const info = await container.getInfo();
        expect(info).toBeUndefined();
    });

    describe("Static events", () => {
        it("addListener adds callback to listeners", () => {
            expect(Container.listeners("TestEvent").length).toBe(0);
            Container.addListener("TestEvent" as any, () => { });
            expect(Container.listeners("TestEvent").length).toBe(1);
        });

        it("removeListener removes callback to listeners", () => {
            expect(Container.listeners("TestEvent").length).toBe(0);
            const callback = () => { };
            Container.addListener("TestEvent" as any, callback);
            expect(Container.listeners("TestEvent").length).toBe(1);
            Container.removeListener("TestEvent" as any, callback);
            expect(Container.listeners("TestEvent").length).toBe(0);
        });

        it("emit invokes ipc publish", () => {
            const args = new EventArgs(undefined, "TestEvent", {});
            const publishSpy = vi.spyOn(container.ipc, "publish");
            Container.emit(args.name as any, args);
            expect(publishSpy).toHaveBeenCalledWith("desktopJS.static-event", { eventName: "container-" + args.name, eventArgs: args });
        });
    });

    describe("logging", () => {
        it("debug", () => {
            const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
            container.log("debug", "message");
            expect(consoleSpy).toHaveBeenCalledWith("message");
        });

        it("warn", () => {
            const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
            container.log("warn", "message");
            expect(consoleSpy).toHaveBeenCalledWith("message");
        });

        it("error", () => {
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            container.log("error", "message");
            expect(consoleSpy).toHaveBeenCalledWith("message");
        });

        it("info", () => {
            const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
            container.log("info", "message");
            expect(consoleSpy).toHaveBeenCalledWith("message");
        });
    });

    describe("ContainerBase", () => {
        describe("addTrayIcon", () => {
            it("Throws Not implemented", () => {
                expect(() => container.addTrayIcon(null)).toThrow(TypeError);
            });
        });

        describe("showNotification", () => {
            it("Throws Not implemented", () => {
                expect(() => container.showNotification("title", new NotificationOptions())).toThrow(TypeError);
            });
        });

        describe("window management", () => {
            it("window-created fires on EventEmitter", () => {
                const callback = vi.fn();
                container.addListener("window-created", callback);
                container.emit("window-created", { sender: container, name: "window-created", windowId: "2" });
                expect(callback).toHaveBeenCalled();
            });

            it.skip("window-created fires on Container", () => {
                const callback = vi.fn();
                Container.addListener("window-created", callback);
                container.emit("window-created", { sender: container, name: "window-created", windowId: "2" });
                expect(callback).toHaveBeenCalled();
            });

            it("window-created subscription is removed", () => {
                const callback = vi.fn();
                container.addListener("window-created", callback);
                container.removeListener("window-created", callback);
                container.emit("window-created", { sender: container, name: "window-created", windowId: "2" });
                expect(callback).not.toHaveBeenCalled();
            });
        });

        describe("Events", () => {
            it("addListener", async () => {
                const callback = vi.fn();
                container.addListener("window-created", callback);
                container.emit("window-created", { sender: container, name: "window-created", windowId: "2" });
                expect(callback).toHaveBeenCalled();
            });

            it("removeListener", () => {
                const callback = vi.fn();
                container.addListener("window-created", callback);
                container.removeListener("window-created", callback);
                container.emit("window-created", { sender: container, name: "window-created", windowId: "2" });
                expect(callback).not.toHaveBeenCalled();
            });
        });
        
        describe("Layout Management", () => {
            it("getLayoutFromStorage returns layout from storage", () => {
                const layout = (container as any).getLayoutFromStorage("Test");
                expect(layout).toBeDefined();
                expect(layout.name).toBe("Test");
                expect(layout.windows.length).toBe(3);
                expect(container.getItemSpy).toHaveBeenCalledWith(ContainerBase.layoutsPropertyKey);
            });
            
            it("saveLayoutToStorage saves layout to storage", () => {
                const layout = new PersistedWindowLayout();
                layout.name = "NewTest";
                layout.windows.push({ name: "1", id: "1", url: "url", bounds: {} });
                
                (container as any).saveLayoutToStorage("NewTest", layout);
                
                expect(container.setItemSpy).toHaveBeenCalled();
                expect(container.emitSpy).toHaveBeenCalledWith("layout-saved", expect.objectContaining({
                    name: "layout-saved",
                    layout: layout,
                    layoutName: "NewTest"
                }));
            });
            
            it("deleteLayoutFromStorage deletes layout from storage", () => {
                (container as any).deleteLayoutFromStorage("Test");
                
                expect(container.setItemSpy).toHaveBeenCalled();
                expect(container.emitSpy).toHaveBeenCalledWith("layout-deleted", expect.objectContaining({
                    name: "layout-deleted",
                    layoutName: "Test"
                }));
            });
            
            it("deleteLayoutFromStorage does nothing if layout doesn't exist", () => {
                container.getItemSpy.mockReturnValueOnce(JSON.stringify({}));
                (container as any).deleteLayoutFromStorage("NonExistentLayout");
                
                expect(container.setItemSpy).not.toHaveBeenCalled();
                expect(container.emitSpy).not.toHaveBeenCalledWith("layout-deleted", expect.anything());
            });
            
            it("loadLayout closes all windows and loads layout", async () => {
                const result = await container.loadLayout("Test");
                
                expect(container.closeAllWindowsSpy).toHaveBeenCalledWith(true);
                expect(result).toBeDefined();
                expect(result.name).toBe("Test");
                expect(result.windows.length).toBe(3);
            });
            
            it("loadLayout loads layout from object", async () => {
                const layoutObj = new PersistedWindowLayout();
                layoutObj.name = "ObjectLayout";
                layoutObj.windows.push({ name: "obj1", id: "obj1", url: "url", bounds: {} });
                
                const result = await container.loadLayout(layoutObj);
                
                expect(container.closeAllWindowsSpy).toHaveBeenCalledWith(true);
                expect(result).toBe(layoutObj);
            });
            
            it("loadLayout handles main window", async () => {
                // Create a mock main window with a setBounds spy
                const setBoundsSpy = vi.fn().mockResolvedValue(undefined);
                const mainWindow = {
                    setBounds: setBoundsSpy,
                    name: "2" // This matches the main window in our test layout
                };
                
                // Override getMainWindow to return our mock
                vi.spyOn(container, 'getMainWindow').mockReturnValue(mainWindow as unknown as ContainerWindow);
                
                await container.loadLayout("Test");
                
                // Verify setBounds was called on the main window
                expect(setBoundsSpy).toHaveBeenCalled();
            });
            
            it("loadLayout creates new windows", async () => {
                await container.loadLayout("Test");
                
                // Two non-main windows should be created
                expect(container.createWindowSpy).toHaveBeenCalledTimes(2);
            });
            
            it("loadLayout handles window states", async () => {
                const setStateSpy = vi.fn().mockResolvedValue(undefined);
                container.createWindowSpy.mockImplementationOnce((url, options) => {
                    return {
                        id: options.name,
                        name: options.name,
                        setState: setStateSpy
                    } as unknown as ContainerWindow;
                });
                
                await container.loadLayout("Test");
                
                expect(setStateSpy).toHaveBeenCalledWith({ "value": "foo" });
            });
            
            it("loadLayout handles window grouping", async () => {
                const joinGroupSpy = vi.fn().mockResolvedValue(undefined);
                container.getWindowByNameSpy.mockImplementationOnce((name) => {
                    return {
                        id: name,
                        name: name,
                        joinGroup: joinGroupSpy
                    } as unknown as ContainerWindow;
                });
                
                await container.loadLayout("Test");
                
                expect(joinGroupSpy).toHaveBeenCalled();
            });
            
            it("loadLayout throws error for invalid layout", async () => {
                // Create a layout object with no windows property
                const invalidLayout = {};
                
                // Mock getLayoutFromStorage to return the invalid layout
                vi.spyOn(container as any, 'getLayoutFromStorage').mockReturnValue(invalidLayout);
                
                await expect(container.loadLayout("NonExistentLayout")).rejects.toThrow("Layout does not exist or is invalid");
            });
            
            it("saveLayout builds and saves layout", async () => {
                const buildLayoutSpy = vi.spyOn(container, "buildLayout");
                const saveLayoutToStorageSpy = vi.spyOn(container as any, "saveLayoutToStorage");
                
                await container.saveLayout("NewLayout");
                
                expect(buildLayoutSpy).toHaveBeenCalled();
                expect(saveLayoutToStorageSpy).toHaveBeenCalledWith("NewLayout", expect.any(Object));
            });
            
            it("deleteLayout deletes layout from storage", async () => {
                const deleteLayoutFromStorageSpy = vi.spyOn(container as any, "deleteLayoutFromStorage");
                
                await container.deleteLayout("LayoutToDelete");
                
                expect(deleteLayoutFromStorageSpy).toHaveBeenCalledWith("LayoutToDelete");
            });
            
            it("getLayouts returns layouts from storage", async () => {
                const layouts = await container.getLayouts();
                
                expect(layouts).toBeDefined();
                expect(layouts.length).toBe(1);
                expect(layouts[0].name).toBe("Test");
            });
            
            it("getLayouts returns undefined when no layouts exist", async () => {
                container.getItemSpy.mockReturnValueOnce(null);
                
                const layouts = await container.getLayouts();
                
                expect(layouts).toBeUndefined();
            });
        });
    });
    
    describe("WebContainerBase", () => {
        let webContainer: TestWebContainer;
        
        beforeEach(() => {
            // Mock window object
            const mockWindow = {
                top: {
                    document: {
                        createElement: vi.fn().mockReturnValue({ href: "" })
                    }
                },
                open: vi.fn().mockReturnValue({})
            };
            
            webContainer = new TestWebContainer(mockWindow as any);
        });
        
        it("constructor initializes properties", () => {
            expect(webContainer.globalWindow).toBeDefined();
            expect(webContainer.uuid).toBeDefined();
        });
        
        it("ensureAbsoluteUrl returns url with linkHelper", () => {
            const url = "relative/path";
            (webContainer as any).linkHelper = { href: "" };
            
            const result = (webContainer as any).ensureAbsoluteUrl(url);
            
            expect(result).toBeDefined();
        });
        
        it("ensureAbsoluteUrl returns original url without linkHelper", () => {
            const url = "relative/path";
            (webContainer as any).linkHelper = null;
            
            const result = (webContainer as any).ensureAbsoluteUrl(url);
            
            expect(result).toBe(url);
        });
        
        it("onOpen calls original open method", () => {
            const openFn = vi.fn().mockReturnValue({});
            const args = ["url", "name", "features"];
            
            const result = (webContainer as any).onOpen(openFn, ...args);
            
            expect(openFn).toHaveBeenCalledWith(...args);
            expect(result).toBeDefined();
        });
        
        it("wrapWindow calls wrapWindowSpy", () => {
            const window = { name: "test-window" };
            
            const result = webContainer.wrapWindow(window);
            
            expect(webContainer.wrapWindowSpy).toHaveBeenCalledWith(window);
            expect(result).toBeDefined();
            expect(result.id).toBe("wrapped-window");
        });
    });
});
