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

/* eslint-disable @typescript-eslint/no-empty-function */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ElectronContainer, ElectronContainerWindow, ElectronMessageBus, ElectronWindowManager } from "../src/electron";
import { ContainerWindow, Container } from "@morgan-stanley/desktopjs";

class MockEventEmitter {
    private eventListeners: Map<string, any> = new Map();
    
    public addListener(eventName: string, listener: any): void {
        (this.eventListeners[eventName] = this.eventListeners[eventName] || []).push(listener);
    }
    
    public removeListener(eventName: string, listener: any): void { }

    public on(eventName: string, listener: any): void {
        this.addListener(eventName, listener);
    }

    public listeners(eventName: string): ((event: any) => void)[] {
        return (this.eventListeners[eventName] || []);
    }

    public emit(eventName: string, ...eventArgs: any[]) {
        for (const listener of this.listeners(eventName)) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            listener(...eventArgs);
        }
    }    
}

class MockWindow extends MockEventEmitter {
    public name: string;
    public id: number;
    public group: string;
    private bounds: any = { x: 0, y: 1, width: 2, height: 3 };

    constructor(name?: string) {
        super();
        this.name = name;
    }

    public loadURL(url: string, options?: any): void { }
    public focus(): void { }
    public show(): void { }
    public close(): void { }
    public hide(): void { }
    public isVisible(): boolean { return true; }
    public capturePage(callback: (snapshot: MockCapture) => void): any {
        callback(new MockCapture());
        return {};
    }

    public getParentWindow(): any { return undefined; }
    public setParentWindow(parent: any) { }

    public getAllWindows(): any { return [new MockWindow(), new MockWindow("target")]; }

    public webContents: any = {
        send(channel: string, ...args: any[]) { },
        getURL() { return "url"; },
        executeJavaScript() {}
    };

    public getBounds(): any { return this.bounds; }

    public setBounds(bounds: {x: number, y: number, width: number, height: number}): void {
        this.bounds = bounds;
        this.emit("move", null);
    }

    public flashFrame(enable: boolean): void { }
    public moveTop(): void { }
}

class MockCapture {
    public toPNG(): any {
        return {
            toString(type: any) {
                return "Mock";
            }
        };
    }
}

class MockMainIpc extends MockEventEmitter {
}

class MockIpc extends MockMainIpc {
    public sendSync(channel: string, ...args: any[]) { return {}; }
    public send(channel: string, ...args: any[]) { }
}

describe("ElectronContainerWindow", () => {
    let innerWin: any;
    let win: ElectronContainerWindow;
    let container: ElectronContainer;

    beforeEach(() => {
        innerWin = new MockWindow();
        container = new ElectronContainer({ BrowserWindow: { fromId(): any { } } }, new MockIpc(), {});
        win = new ElectronContainerWindow(innerWin, container);
    });

    it("Wrapped window is retrievable", () => {
        expect(win).toBeDefined();
        expect(win.innerWindow).toBeDefined();
        expect(win.innerWindow).toBe(innerWin);
    });

    it("id returns underlying id", () => {
        innerWin.id = "ID";
        expect(win.id).toBe("ID");
    });

    it("name returns underlying name", () => {
        innerWin.name = "NAME";
        expect(win.name).toBe("NAME");
    });

    describe("Window members", () => {
        it("load", async () => {
            const loadURLSpy = vi.spyOn(innerWin, "loadURL");
            await win.load("url");
            expect(loadURLSpy).toHaveBeenCalledWith("url");
        });

        it("load with options", async () => {
            const loadURLSpy = vi.spyOn(innerWin, "loadURL");
            const options = { prop: "value" };
            await win.load("url", options);
            expect(loadURLSpy).toHaveBeenCalledWith("url", options);
        });

        it("focus", async () => {
            const focusSpy = vi.spyOn(innerWin, "focus");
            await win.focus();
            expect(focusSpy).toHaveBeenCalled();
        });

        it("show", async () => {
            const showSpy = vi.spyOn(innerWin, "show");
            await win.show();
            expect(showSpy).toHaveBeenCalled();
        });

        it("hide", async () => {
            const hideSpy = vi.spyOn(innerWin, "hide");
            await win.hide();
            expect(hideSpy).toHaveBeenCalled();
        });

        it("close", async () => {
            const closeSpy = vi.spyOn(innerWin, "close");
            await win.close();
            expect(closeSpy).toHaveBeenCalled();
        });

        it("minimize", async () => {
            const browserWindow = { minimize: vi.fn() };
            await new ElectronContainerWindow(browserWindow, null).minimize();
            expect(browserWindow.minimize).toHaveBeenCalledTimes(1);
        });

        it("maximize", async () => {
            const browserWindow = { maximize: vi.fn() };
            await new ElectronContainerWindow(browserWindow, null).maximize();
            expect(browserWindow.maximize).toHaveBeenCalledTimes(1);
        });
        
        it("restore", async () => {
            const browserWindow = { restore: vi.fn() };
            await new ElectronContainerWindow(browserWindow, null).restore();
            expect(browserWindow.restore).toHaveBeenCalledTimes(1);
        });

        it("isShowing", async () => {
            const isVisibleSpy = vi.spyOn(innerWin, "isVisible");
            const showing = await win.isShowing();
            expect(showing).toBeDefined();
            expect(showing).toBe(true);
            expect(isVisibleSpy).toHaveBeenCalled();
        });

        describe("getState", () => {
            it("getState undefined", async () => {
                const mockWindow = new MockWindow();
                mockWindow.webContents = null;
                const win = new ElectronContainerWindow(mockWindow, container);
                const state = await win.getState();
                expect(state).toBeUndefined();
            });

            it("getState defined", async () => {
                const mockState = { value: "Foo" };
                const executeJavaScriptSpy = vi.spyOn(innerWin.webContents, "executeJavaScript")
                    .mockResolvedValue(mockState);
                const state = await win.getState();
                expect(executeJavaScriptSpy).toHaveBeenCalled();
                expect(state).toBe(mockState);
            });
        });

        describe("setState", () => {
            it("setState undefined", async () => {
                const mockWindow = new MockWindow();
                mockWindow.webContents = null;
                const win = new ElectronContainerWindow(mockWindow, container);
                await expect(win.setState({})).resolves.toBeUndefined();
            });

            it("setState defined", async () => {
                const mockState = { value: "Foo" };
                const executeJavaScriptSpy = vi.spyOn(innerWin.webContents, "executeJavaScript")
                    .mockResolvedValue(undefined);
                await win.setState(mockState);
                expect(executeJavaScriptSpy).toHaveBeenCalled();
            });
        });

        it("getSnapshot", async () => {
            const capturePageSpy = vi.spyOn(innerWin, "capturePage");
            const snapshot = await win.getSnapshot();
            expect(snapshot).toBeDefined();
            expect(snapshot).toBe("data:image/png;base64,Mock");
            expect(capturePageSpy).toHaveBeenCalled();
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
            const setBoundsSpy = vi.spyOn(win.innerWindow, "setBounds");
            const bounds = { x: 0, y: 1, width: 2, height: 3 };
            await win.setBounds(bounds as any);
            expect(setBoundsSpy).toHaveBeenCalledWith(bounds);
        });

        it("flash enable invokes underlying flash", async () => {
            const flashFrameSpy = vi.spyOn(win.innerWindow, "flashFrame");
            await win.flash(true);
            expect(flashFrameSpy).toHaveBeenCalledWith(true);
        });

        it("flash disable invokes underlying stopFlashing", async () => {
            const flashFrameSpy = vi.spyOn(win.innerWindow, "flashFrame");
            await win.flash(false);
            expect(flashFrameSpy).toHaveBeenCalledWith(false);
        });

        it("getParent calls underlying getParentWindow", async () => {
            const getParentWindowSpy = vi.spyOn(win.innerWindow, "getParentWindow");
            await win.getParent();
            expect(getParentWindowSpy).toHaveBeenCalled();
        });

        it("setParent calls underlying setParentWindow", async () => {
            const mockParent = { innerWindow: new MockWindow() };
            const setParentWindowSpy = vi.spyOn(win.innerWindow, "setParentWindow");
            await win.setParent(mockParent as any);
            expect(setParentWindowSpy).toHaveBeenCalledWith(mockParent.innerWindow);
        });

        it("getOptions sends synchronous ipc message", async () => {
            const sendSyncSpy = vi.spyOn(container.internalIpc, "sendSync")
                .mockReturnValue({ foo: "bar" });
            vi.spyOn(win, "id", "get").mockReturnValue("5");
            vi.spyOn(container, "wrapWindow").mockReturnValue(new MockWindow() as any);
            vi.spyOn(container.browserWindow, "fromId").mockReturnValue(innerWin);

            const options = await win.getOptions();
            expect(sendSyncSpy).toHaveBeenCalledWith("desktopJS.window-getOptions", { source: "5" });
            expect(options).toEqual({ foo: "bar" });
        });

        describe("addListener", () => {
            it("calls underlying Electron window addListener", () => {
                const addListenerSpy = vi.spyOn(win.innerWindow, "addListener");
                win.addListener("move", () => {});
                expect(addListenerSpy).toHaveBeenCalledWith("move", expect.any(Function));
            });

            describe("beforeunload", () => {
                it("beforeunload attaches to underlying dom window", () => {
                    const window = { addEventListener: vi.fn() };
                    vi.spyOn(container, "getCurrentWindow").mockReturnValue({ id: "1" } as any);
                    win = new ElectronContainerWindow(innerWin, container, window as any);
                    vi.spyOn(win, "id", "get").mockReturnValue("1");
                    win.addListener("beforeunload", () => {});
                    expect(window.addEventListener).toHaveBeenCalledWith("beforeunload", expect.any(Function));
                });

                it("beforeunload throws error if not current window", () => {
                    const window = { addEventListener: vi.fn() };
                    vi.spyOn(container, "getCurrentWindow").mockReturnValue({ id: "2" } as any);
                    win = new ElectronContainerWindow(innerWin, container, window as any);
                    vi.spyOn(win, "id", "get").mockReturnValue("1");
                    expect(() => win.addListener("beforeunload", () => {}))
                        .toThrow("Event handler for 'beforeunload' can only be added on current window");
                });
            });
        });

        it("removeListener calls underlying Electron window removeListener", () => {
            const removeListenerSpy = vi.spyOn(win.innerWindow, "removeListener");
            win.removeListener("move", () => {});
            expect(removeListenerSpy).toHaveBeenCalledWith("move", expect.any(Function));
        });

        it("nativeWindow returns window", () => {
            const window = {};
            const win = new ElectronContainerWindow(innerWin, container, window as any);
            expect(win.nativeWindow).toBe(window);
        });
    });

    describe("window grouping", () => {
        it("allowGrouping is true", () => {
            expect(win.allowGrouping).toBe(true);
        });

        it("getGroup sends synchronous ipc message", async () => {
            const sendSyncSpy = vi.spyOn(container.internalIpc, "sendSync")
                .mockReturnValue([1, 5, 2]);
            vi.spyOn(win, "id", "get").mockReturnValue("5");
            vi.spyOn(container, "wrapWindow").mockReturnValue(new MockWindow() as any);
            vi.spyOn(container.browserWindow, "fromId").mockReturnValue(innerWin);

            const windows = await win.getGroup();
            expect(sendSyncSpy).toHaveBeenCalledWith("desktopJS.window-getGroup", { source: "5" });
            expect(container.wrapWindow).toHaveBeenCalledTimes(3);
            expect(windows.length).toBe(3);
        });

        it("getGroup invokes method directly in main process", () => {
            container = new ElectronContainer({ BrowserWindow: { fromId(): any { } } }, new MockMainIpc(), {});
            win = new ElectronContainerWindow(innerWin, container);
            const windowManager = { getGroup: vi.fn().mockReturnValue([]) };
            (container as any).windowManager = windowManager;
            win.getGroup();
            expect(windowManager.getGroup).toHaveBeenCalled();
        });

        it("joinGroup sends ipc message", async () => {
            const sendSpy = vi.spyOn(container.internalIpc, "send");
            vi.spyOn(win, "id", "get").mockReturnValue("1");
            const targetWin = new ElectronContainerWindow(innerWin, container);
            vi.spyOn(targetWin, "id", "get").mockReturnValue("2");

            await win.joinGroup(targetWin);
            expect(sendSpy).toHaveBeenCalledWith("desktopJS.window-joinGroup", { source: "1", target: "2" });
        });

        it("joinGroup with source == target does not send ipc message", async () => {
            const sendSpy = vi.spyOn(container.internalIpc, "send");
            vi.spyOn(win, "id", "get").mockReturnValue("1");
            const targetWin = new ElectronContainerWindow(innerWin, container);
            vi.spyOn(targetWin, "id", "get").mockReturnValue("1");

            await win.joinGroup(targetWin);
            expect(sendSpy).not.toHaveBeenCalled();
        });

        it("joinGroup invokes method directly in main process", () => {
            container = new ElectronContainer({ BrowserWindow: { fromId(): any { } } }, new MockMainIpc(), {});
            win = new ElectronContainerWindow(innerWin, container);
            const windowManager = { groupWindows: vi.fn() };
            (container as any).windowManager = windowManager;
            const targetWin = new ElectronContainerWindow(innerWin, container);
            vi.spyOn(targetWin, "id", "get").mockReturnValue("2");
            win.joinGroup(targetWin);
            expect(windowManager.groupWindows).toHaveBeenCalled();
        });

        it("leaveGroup sends ipc message", async () => {
            const sendSpy = vi.spyOn(container.internalIpc, "send");
            vi.spyOn(win, "id", "get").mockReturnValue("5");
            await win.leaveGroup();
            expect(sendSpy).toHaveBeenCalledWith("desktopJS.window-leaveGroup", { source: "5" });
        });

        it("leaveGroup invokes method directly in main process", async () => {
            container = new ElectronContainer({ BrowserWindow: { fromId(): any { } } }, new MockMainIpc(), {});
            win = new ElectronContainerWindow(innerWin, container);
            const windowManager = { ungroupWindows: vi.fn() };
            (container as any).windowManager = windowManager;
            await win.leaveGroup();
            expect(windowManager.ungroupWindows).toHaveBeenCalled();
        });
    });

    it("bringToFront invokes underlying moveTop", async () => {
        const moveTopSpy = vi.spyOn(win.innerWindow, "moveTop");
        await win.bringToFront();
        expect(moveTopSpy).toHaveBeenCalled();
    });
});

describe("ElectronMessageBus", () => {
    let mockIpc: any;
    let mockWindow: any;
    let bus: ElectronMessageBus;

    function callback() { }

    beforeEach(() => {
        mockWindow = new MockWindow();
        mockIpc = new MockIpc();
        bus = new ElectronMessageBus(mockIpc, mockWindow);
    });

    it("subscribe invokes underlying subscribe", async () => {
        const onSpy = vi.spyOn(mockIpc, "on");
        const subscriber = await bus.subscribe("topic", callback);
        expect(subscriber.listener).toEqual(expect.any(Function));
        expect(subscriber.topic).toBe("topic");
        expect(onSpy).toHaveBeenCalledWith("topic", expect.any(Function));
    });

    it("subscribe listener attached", async () => {
        const subscriber = await bus.subscribe("topic", callback);
        const listenerSpy = vi.spyOn(subscriber, "listener");
        subscriber.listener();
        expect(listenerSpy).toHaveBeenCalled();
    });

    it("unsubscribe invokes underlying unsubscribe", async () => {
        const removeListenerSpy = vi.spyOn(mockIpc, "removeListener");
        await bus.unsubscribe({ topic: "topic", listener: callback });
        expect(removeListenerSpy).toHaveBeenCalledWith("topic", expect.any(Function));
    });

    it("publish invokes underling publish", async () => {
        const message: any = {};
        const sendSpy = vi.spyOn(mockIpc, "send");
        const webContentsSendSpy = vi.spyOn(mockWindow.webContents, "send");
        await bus.publish("topic", message);
        expect(sendSpy).toHaveBeenCalledWith("topic", message);
    });

    it("publish in main invokes callback in main", async () => {
        const message: any = {};
        const ipc = new MockMainIpc();
        const listenersSpy = vi.spyOn(ipc, "listeners");
        const localBus = new ElectronMessageBus(ipc as any, mockWindow);
        await localBus.publish("topic", message);
        expect(listenersSpy).toHaveBeenCalledWith("topic");
    });

    it("publish with optional name invokes underling send", async () => {
        const message: any = {};
        await bus.publish("topic", message, { name: "target" });
    });
});

describe("ElectronContainer", () => {
    let electron: any;
    let container: ElectronContainer;
    const globalWindow: any = {};
    let windows: MockWindow[];

    beforeEach(() => {
        windows = [new MockWindow(), new MockWindow("Name")];

        electron = {
            app: new MockEventEmitter(),
            BrowserWindow: vi.fn().mockImplementation((options: any) => {
                const win = new MockWindow();
                win.id = "1";
                return win;
            }),
            Tray: vi.fn().mockImplementation((icon: string) => {
                return {
                    on: vi.fn(),
                    setContextMenu: vi.fn(),
                    destroy: vi.fn()
                };
            }),
            Menu: {
                buildFromTemplate: vi.fn()
            },
            Notification: vi.fn().mockImplementation((options: any) => {
                return {
                    show: vi.fn(),
                    on: vi.fn()
                };
            }),
            require: vi.fn(),
            getCurrentWindow: vi.fn(),
            process: { versions: { electron: "1", chrome: "2" } }
        };

        container = new ElectronContainer(electron, new MockIpc(), globalWindow);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("hostType is Electron", () => {
        expect(container.hostType).toBe("Electron");
    });

    it("getInfo invokes underlying version info", async () => {
        const info = await container.getInfo();
        expect(info).toBe("Electron/1 Chrome/2");
    });

    it("error during creation", () => {
        const consoleSpy = vi.spyOn(console, "error");
        new ElectronContainer();
        expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it("electron members are copied", () => {
        expect((container as any).app).toBe(electron.app);
        expect((container as any).browserWindow).toBe(electron.BrowserWindow);
        expect((container as any).tray).toBe(electron.Tray);
        expect((container as any).menu).toBe(electron.Menu);
    });

    describe("window management", () => {
        beforeEach(() => {
            electron.BrowserWindow = {
                getAllWindows(): MockWindow[] { return windows; },
                fromId(): any { }
            };

            container = new ElectronContainer(electron, new MockIpc());
        });

        it("getAllWindows returns wrapped native windows", async () => {
            const wins = await container.getAllWindows();
            expect(wins).toBeDefined();
            expect(wins.length).toBe(windows.length);
        });

        describe("getWindow", () => {
            it("getWindowById returns wrapped window", async () => {
                vi.spyOn(electron.BrowserWindow, "fromId").mockReturnValue(new MockWindow());
                const win = await container.getWindowById("1");
                expect(electron.BrowserWindow.fromId).toHaveBeenCalledWith("1");
                expect(win).toBeDefined();
            });

            it("getWindowById with unknown id returns null", async () => {
                const win = await container.getWindowById("DoesNotExist");
                expect(win).toBeNull();
            });

            it("getWindowByName returns wrapped window", async () => {
                const win = await container.getWindowByName("Name");
                expect(win).toBeDefined();
            });

            it("getWindowByName with unknown name returns null", async () => {
                const win = await container.getWindowByName("DoesNotExist");
                expect(win).toBeNull();
            });
        });

        it("closeAllWindows excluding self skips current window", async () => {
            vi.spyOn(electron, "getCurrentWindow").mockReturnValue(windows[0]);
            const closeSpy0 = vi.spyOn(windows[0], "close");
            const closeSpy1 = vi.spyOn(windows[1], "close");
            await (container as any).closeAllWindows(true);
            expect(electron.getCurrentWindow).toHaveBeenCalled();
            expect(closeSpy0).not.toHaveBeenCalled();
            expect(closeSpy1).toHaveBeenCalled();
        });

        it("closeAllWindows including self closes all", async () => {
            vi.spyOn(electron, "getCurrentWindow");
            const closeSpy0 = vi.spyOn(windows[0], "close");
            const closeSpy1 = vi.spyOn(windows[1], "close");
            await (container as any).closeAllWindows();
            expect(electron.getCurrentWindow).not.toHaveBeenCalled();
            expect(closeSpy0).toHaveBeenCalled();
            expect(closeSpy1).toHaveBeenCalled();
        });

        it("saveLayout invokes underlying saveLayoutToStorage", async () => {
            container.browserWindow = {
                getAllWindows(): MockWindow[] { return windows; },
                fromId(): any { return {}; }
            };

            container.storage = vi.fn(undefined);
            container.storage.getItem = vi.fn(() => JSON.stringify({}))
            vi.spyOn(container.internalIpc, "sendSync").mockReturnValue([1, 5, 2]);
            const saveLayoutToStorageSpy = vi.spyOn(container as any, "saveLayoutToStorage");
            vi.spyOn(container as any, "getMainWindow").mockReturnValue(new MockWindow());
            container.storage.setItem = vi.fn();
            const layout = await container.saveLayout("Test");
            expect(layout).toBeDefined();
            expect(saveLayoutToStorageSpy).toHaveBeenCalledWith("Test", layout);
        });

        it("buildLayout skips windows with persist false", async () => {
            const win1 = { 
                getOptions: vi.fn(), 
                getGroup: vi.fn().mockResolvedValue([]), 
                getState: vi.fn().mockResolvedValue(undefined),
                innerWindow: { 
                    name: "win1", 
                    "desktopJS-options": { main: true }, 
                    webContents: { getURL: () => "" }, 
                    getBounds: () => undefined 
                }
            };
            const win2 = { 
                getOptions: vi.fn(), 
                getGroup: vi.fn().mockResolvedValue([]), 
                getState: vi.fn().mockResolvedValue(undefined),
                innerWindow: { 
                    name: "win2", 
                    "desktopJS-options": { persist: false }, 
                    webContents: { getURL: () => "" }, 
                    getBounds: () => undefined 
                }
            };
            vi.spyOn(container, "getMainWindow").mockReturnValue(win1);
            vi.spyOn(container, "getAllWindows").mockResolvedValue([win1, win2]);
            const layout = await container.buildLayout();
            expect(layout).toBeDefined();
            expect(layout.windows.length).toBe(1);
            expect(layout.windows[0].name === "win1");
        });
    });

    it("getMainWindow returns wrapped window marked as main", async () => {
        const innerWin: any = new MockWindow();

        container.browserWindow = {
            getAllWindows(): MockWindow[] { return windows; },
            fromId(): any { }
        };

        windows[1][Container.windowOptionsPropertyKey] = { main: true };

        vi.spyOn(container.browserWindow, "fromId").mockReturnValue(innerWin);

        const win: ContainerWindow = await container.getMainWindow();
        expect(win).toBeDefined();
        expect(win.innerWindow).toBe(windows[1]);
        expect(container.browserWindow.fromId).not.toHaveBeenCalled();
    });

    it("getMainWindow with no defined main returns first wrapped window", async () => {
        const innerWin: any = new MockWindow();

        container.browserWindow = {
            getAllWindows(): MockWindow[] { return windows; },
            fromId(): any { }
        };

        vi.spyOn(container.browserWindow, "fromId").mockReturnValue(innerWin);

        const win: ContainerWindow = await container.getMainWindow();
        expect(win).toBeDefined();
        expect(win.innerWindow).toBe(innerWin);
        expect(container.browserWindow.fromId).toHaveBeenCalledWith(1);
    });

    it("getCurrentWindow returns wrapped inner getCurrentWindow", async () => {
        const innerWin: any = new MockWindow();
        vi.spyOn(electron, "getCurrentWindow").mockReturnValue(innerWin);
        const win: ContainerWindow = await container.getCurrentWindow();
        expect(win).toBeDefined();
        expect(electron.getCurrentWindow).toHaveBeenCalled();
        expect(win.innerWindow).toBe(innerWin);
    });

    it("createWindow", async () => {
        const browserWindowSpy = vi.spyOn(container as any, "browserWindow");
        await container.createWindow("url", { x: "x", taskbar: false, node: true });
        expect(browserWindowSpy).toHaveBeenCalledWith({ 
            x: "x", 
            skipTaskbar: true, 
            webPreferences: { nodeIntegration: true } 
        });
    });

    it("createWindow fires window-created", async () => {
        const callback = vi.fn();
        container.addListener("window-created", callback);
        await container.createWindow("url");
        expect(callback).toHaveBeenCalled();
    });

    it.skip("app browser-window-created fires Container window-created", () => {
        new ElectronContainer(electron, new MockMainIpc(), globalWindow, { isRemote: false });
        const callback = vi.fn();
        ContainerWindow.addListener("window-created", callback);
        electron.app.emit("browser-window-created", {}, { webContents: {id: "id"}});
        expect(callback).toHaveBeenCalled();
    });

    it("createWindow on main process invokes ElectronWindowManager.initializeWindow", async () => {
        (container as any).isRemote = false;
        (container as any).windowManager = new ElectronWindowManager(
            {}, 
            new MockMainIpc(), 
            { fromId(): any {}, getAllWindows(): any {} }
        );
        const initializeWindowSpy = vi.spyOn((container as any).windowManager, "initializeWindow");
        const options = { name: "name" };
        await container.createWindow("url", options);
        expect(initializeWindowSpy).toHaveBeenCalledWith(expect.any(Object), "name", options);
    });

    it("createWindow pulls nodeIntegration default from container", async () => {
        const container = new ElectronContainer(electron, new MockIpc(), globalWindow, { node: true });
        const browserWindowSpy = vi.spyOn(container as any, "browserWindow");
        await container.createWindow("url", {});
        expect(browserWindowSpy).toHaveBeenCalledWith({ 
            webPreferences: { nodeIntegration: true }
        });
    });

    it("createWindow with node specified ignores container default", async () => {
        const container = new ElectronContainer(electron, new MockIpc(), globalWindow, { node: true });
        const browserWindowSpy = vi.spyOn(container as any, "browserWindow");
        await container.createWindow("url", { node: false });
        expect(browserWindowSpy).toHaveBeenCalledWith({ 
            webPreferences: { nodeIntegration: false }
        });
    });

    it("addTrayIcon", () => {
        const traySpy = vi.spyOn(container as any, "tray");
        traySpy.getMockImplementation();
        container.addTrayIcon(
            { text: null, icon: "icon" }, 
            () => {}, 
            [{ id: "id", label: "label", click: () => {} }]
        );
        expect(traySpy).toHaveBeenCalled();
    });

    describe("notifications", () => {
        it("showNotification delegates to electron notification", () => {
            vi.spyOn(electron, "Notification").mockImplementation(() => {
                return {
                    addListener: vi.fn(),
                    once: vi.fn(),
                    show: vi.fn()
                }
            });

            container.showNotification("title", { onClick: () => {}, notification: {} } as any);
            expect(electron.Notification).toHaveBeenCalledWith({ 
                title: "title", 
                onClick: expect.any(Function), 
                notification: expect.any(Object) 
            });
        });
    });

    describe("LoginItemSettings", () => {
        it("options autoStartOnLogin to setLoginItemSettings", () => {
            electron.app.setLoginItemSettings = vi.fn();
            const container = new ElectronContainer(electron, new MockMainIpc(), globalWindow, { autoStartOnLogin: true });
            expect(electron.app.setLoginItemSettings).toHaveBeenCalledWith({ openAtLogin: true });
        });

        it("options missing autoStartOnLogin does not invoke setLoginItemSettings", () => {
            electron.app.setLoginItemSettings = vi.fn();
            const container = new ElectronContainer(electron, new MockMainIpc(), globalWindow, {});
            expect(electron.app.setLoginItemSettings).not.toHaveBeenCalled();
        });

        it("setOptions allows the auto startup settings to be turned on", () => {
            electron.app.setLoginItemSettings = vi.fn();
            container.setOptions({ autoStartOnLogin: true });
            expect(electron.app.setLoginItemSettings).toHaveBeenCalledWith({ openAtLogin: true });
        });

        it("setOptions errors out on setLoginItemSettings", () => {
            electron.app.setLoginItemSettings = vi.fn().mockImplementation(() => {
                throw new Error("something went wrong");
            });
            const consoleSpy = vi.spyOn(console, "error");
            container.setOptions({ autoStartOnLogin: true });
            expect(electron.app.setLoginItemSettings).toHaveBeenCalledWith({ openAtLogin: true });
            expect(consoleSpy).toHaveBeenCalledTimes(1);
        });

        it("getOptions returns autoStartOnLogin status", async () => {
            electron.app.getLoginItemSettings = vi.fn().mockReturnValue({ openAtLogin: true });
            const result = await container.getOptions();
            expect(electron.app.getLoginItemSettings).toHaveBeenCalled();
            expect(result.autoStartOnLogin).toBe(true);
        });

        it("getOptions error out while fetching auto start info", async () => {
            electron.app.getLoginItemSettings = vi.fn().mockImplementation(() => {
                throw new Error("something went wrong");
            });
            await expect(container.getOptions()).rejects.toThrow(
                "Error getting Container options. Error: something went wrong"
            );
            expect(electron.app.getLoginItemSettings).toHaveBeenCalled();
        });
    });
});

describe("ElectronWindowManager", () => {
    let mgr: ElectronWindowManager;

    beforeEach(() => {
        mgr = new ElectronWindowManager(
            { quit(): any {} },
            new MockMainIpc() as any,
            { fromId(): any {}, getAllWindows(): any {} }
        );
    });

    it("subscribed to ipc", () => {
        const ipc = new MockMainIpc();
        const onSpy = vi.spyOn(ipc, "on");
        new ElectronWindowManager({}, ipc, {});
        expect(onSpy).toHaveBeenCalledTimes(5);
        expect(onSpy).toHaveBeenCalledWith("desktopJS.window-initialize", expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith("desktopJS.window-joinGroup", expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith("desktopJS.window-leaveGroup", expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith("desktopJS.window-getGroup", expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith("desktopJS.window-getOptions", expect.any(Function));
    });

    it("initializeWindow on non-main does not attach to close", () => {
        const win: MockWindow = new MockWindow();
        const onSpy = vi.spyOn(win, "on");
        mgr.initializeWindow(win, "name", {});
        expect(onSpy).not.toHaveBeenCalled();
    });

    it("initializeWindow attaches to close on main window and invokes quit", () => {
        const win: MockWindow = new MockWindow();
        const onSpy = vi.spyOn(win, "on");
        const quitSpy = vi.spyOn((mgr as any).app, "quit");
        mgr.initializeWindow(win, "name", { main: true });
        expect(onSpy).toHaveBeenCalledWith("closed", expect.any(Function));
        win.emit("closed");
        expect(quitSpy).toHaveBeenCalled();
    });

    describe("main ipc handlers", () => {
        it("setname sets and returns supplied name", () => {
            const win: MockWindow = new MockWindow();
            vi.spyOn((mgr as any).browserWindow, "fromId").mockReturnValue(win);
            const event: any = {};
            (mgr as any).ipc.emit("desktopJS.window-initialize", event, { id: 1, name: "NewName" });
            expect(win.name).toBe("NewName");
            expect(event.returnValue).toBe("NewName");
        });

        it("joinGroup invokes groupWindows", () => {
            const source: MockWindow = new MockWindow();
            source.id = 1;
            const target: MockWindow = new MockWindow();
            target.id = 2;

            const groupWindowsSpy = vi.spyOn(mgr, "groupWindows");
            vi.spyOn((mgr as any).browserWindow, "fromId")
                .mockImplementation(id => (id === source.id) ? source : target);
            (mgr as any).ipc.emit("desktopJS.window-joinGroup", {}, { source: 1, target: 2 });

            expect(groupWindowsSpy).toHaveBeenCalledWith(target, source);
        });

        it("leaveGroup invokes ungroupWindows", () => {
            const win: MockWindow = new MockWindow();
            const ungroupWindowsSpy = vi.spyOn(mgr, "ungroupWindows");
            vi.spyOn((mgr as any).browserWindow, "fromId").mockReturnValue(win);
            (mgr as any).ipc.emit("desktopJS.window-leaveGroup", {}, { source: 1 });
            expect(ungroupWindowsSpy).toHaveBeenCalledWith(win);
        });

        it("getGroup returns matching windows by group", () => {
            const win1: MockWindow = new MockWindow();
            win1.id = 1;
            const win2: MockWindow = new MockWindow();
            win2.id = 2;
            const win3: MockWindow = new MockWindow();
            win3.id = 3;

            win1.group = win2.group = "group";

            vi.spyOn((mgr as any).browserWindow, "fromId").mockReturnValue(win1);
            vi.spyOn((mgr as any).browserWindow, "getAllWindows").mockReturnValue([win1, win2, win3]);
            const event: any = {};
            (mgr as any).ipc.emit("desktopJS.window-getGroup", event, { id: 1 });
            expect(event.returnValue).toEqual([1, 2]);
        });

        it("getGroup returns empty array when no matching groups", () => {
            const win1: MockWindow = new MockWindow();
            win1.id = 1;
            const win2: MockWindow = new MockWindow();
            win2.id = 2;

            vi.spyOn((mgr as any).browserWindow, "fromId").mockReturnValue(win1);
            vi.spyOn((mgr as any).browserWindow, "getAllWindows").mockReturnValue([win1, win2]);
            const event: any = {};
            (mgr as any).ipc.emit("desktopJS.window-getGroup", event, { id: 1 });
            expect(event.returnValue).toEqual([]);
        });
    });

    describe("groupWindows", () => {
        let target: MockWindow;
        let win1: MockWindow;
        let win2: MockWindow;

        beforeEach(() => {
            target = new MockWindow();
            win1 = new MockWindow();
            win2 = new MockWindow();
        });

        it("moveToGroup assigns group", () => {
            target.group = "target";
            mgr.groupWindows(target, win1);
            expect(win1.group).toBe("target");
        });

        it("moveToGroup creates new group", () => {
            mgr.groupWindows(target, win1);
            expect(target.group).toBeDefined();
            expect(win1.group).toBe(target.group);
        });

        it("resize is ignored", () => {
            mgr.groupWindows(target, win1, win2);
            const getAllWindowsSpy = vi.spyOn((mgr as any).browserWindow, "getAllWindows");
            win1.setBounds({ x: 0, y: 1, width: 10, height: 10});
            expect(getAllWindowsSpy).not.toHaveBeenCalled();
        });

        it.skip("move updates other grouped window bounds", () => {
            mgr.groupWindows(target, win1, win2);
            vi.spyOn((mgr as any).browserWindow, "getAllWindows").mockReturnValue([target, win1, win2]);
            win1.setBounds({ x: 10, y: 1, width: 2, height: 3});
            expect(target.getBounds().x).toBe(10);
            expect(win2.getBounds().x).toBe(10);
        });
    });

    describe("ungroupWindows", () => {
        let win: MockWindow;

        beforeEach(() => {
            win = new MockWindow();
            win.group = "group";
        });

        it("clears group property", () => {
            mgr.ungroupWindows(win);
            expect(win.group).toBeNull();
        });

        it("unhooks orphanded grouped window", () => {
            const target = new MockWindow();
            const win1 = new MockWindow();
            const win2 = new MockWindow();

            mgr.groupWindows(target, win1, win2);
            vi.spyOn((mgr as any).browserWindow, "getAllWindows").mockReturnValue([target, win1, win2]);
            const removeListenerSpy = vi.spyOn(target, "removeListener");

            mgr.ungroupWindows(win1, win2);

            expect(target.group).toBeNull();
            expect(removeListenerSpy).toHaveBeenCalledWith("move", expect.any(Function));
        });
    });
});

describe("ElectronDisplayManager", () => {
    let electron: any;
    let screen: any;
    let container: any;
   
    beforeEach(() => {
        electron = { ipc: vi.fn() };
        screen = {
            getPrimaryDisplay: vi.fn(),
            getAllDisplays: vi.fn(),
            getCursorScreenPoint: vi.fn()
        };
        Object.defineProperty(electron, "screen", { value: screen });
        screen.getCursorScreenPoint.mockReturnValue({ x: 1, y: 2 });
        screen.getPrimaryDisplay.mockReturnValue({
            id: "primary",
            scaleFactor: 1,
            bounds: { x: 2, y: 3, width: 4, height: 5 },
            workArea: { x: 6, y: 7, width: 8, height: 9 }
        });
        screen.getAllDisplays.mockReturnValue([
            {
                id: "primary",
                scaleFactor: 1,
                bounds: { x: 2, y: 3, width: 4, height: 5 },
                workArea: { x: 6, y: 7, width: 8, height: 9 }
            },
            {
                id: "secondary",
                scaleFactor: 1,
                bounds: { x: 2, y: 3, width: 4, height: 5 },
                workArea: { x: 6, y: 7, width: 8, height: 9 }
            }
        ]);

        container = new ElectronContainer(electron, new MockIpc());
    });

    it("screen to be defined", () => {
        expect(container.screen).toBeDefined();
    });

    it("getPrimaryMonitor", async () => {
        const display = await container.screen.getPrimaryDisplay();
        expect(display).toBeDefined();
        expect(display.id).toBe("primary");
        expect(display.scaleFactor).toBe(1);
        
        expect(display.bounds.x).toBe(2);
        expect(display.bounds.y).toBe(3);
        expect(display.bounds.width).toBe(4);
        expect(display.bounds.height).toBe(5);
        
        expect(display.workArea.x).toBe(6);
        expect(display.workArea.y).toBe(7);
        expect(display.workArea.width).toBe(8);
        expect(display.workArea.height).toBe(9);
    });

    it("getAllDisplays", async () => {
        const displays = await container.screen.getAllDisplays();
        expect(displays).toBeDefined();
        expect(displays.length).toBe(2);
        expect(displays[0].id).toBe("primary");
        expect(displays[1].id).toBe("secondary");
    });

    it("getMousePosition", async () => {
        const point = await container.screen.getMousePosition();
        expect(point).toEqual({ x: 1, y: 2 });
    });
});

describe("ElectronGlobalShortcutManager", () => {
    describe("invokes underlying Electron", () => {
        let electron: any;
        let container: any;

        beforeEach(() => {
            electron = {
                globalShortcut: {
                    register: vi.fn(),
                    unregister: vi.fn(),
                    isRegistered: vi.fn(),
                    unregisterAll: vi.fn()
                }
            };
            container = new ElectronContainer(electron, new MockIpc());
        });

        it("register", () => {
            container.globalShortcut.register("shortcut", () => {});
            expect(electron.globalShortcut.register).toHaveBeenCalledWith("shortcut", expect.any(Function));
        });

        it("unregister", () => {
            container.globalShortcut.unregister("shortcut");
            expect(electron.globalShortcut.unregister).toHaveBeenCalledWith("shortcut");
        });

        it("isRegistered", () => {
            container.globalShortcut.isRegistered("shortcut");
            expect(electron.globalShortcut.isRegistered).toHaveBeenCalledWith("shortcut");
        });

        it("unregisterAll", () => {
            container.globalShortcut.unregisterAll();
            expect(electron.globalShortcut.unregisterAll).toHaveBeenCalled();
        });
    });
});
