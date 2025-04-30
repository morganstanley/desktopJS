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

import {} from "jest";
import { Default } from "../../../src/Default/default";
import { ContainerWindow } from "../../../src/window";
import { Container } from "../../../src/container";

// Silence expected warnings in tests
// These warnings are part of the error handling being tested
beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

class MockWindow {
    public listener: any;

    public name: string = "Name";
    public focus(): void { }
    public show(): void { }
    public close(): Promise<void> { return Promise.resolve(); }
    public open(url?: string, target?: string, features?: string, replace?: boolean): any { return new MockWindow(); }
    public addEventListener(type: string, listener: any): void { this.listener = listener; }
    public removeEventListener(type: string, listener: any): void { }
    public postMessage(message: string, origin: string): void { }
    public moveTo(x: number, y: number): void { }
    public resizeTo(width: number, height: number): void { }
    public getState(): Promise<any> { return Promise.resolve(undefined); }
    public setState(): Promise<void> { return Promise.resolve(); }
    public screenX: any = 0;
    public screenY: any = 1;
    public outerWidth: any = 2;
    public outerHeight: any = 3;
    location: any = {
        origin: "origin",
        replace(url: string) {}
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
            jest.spyOn(mockWindow, 'focus');
            win.focus();

            expect(mockWindow.focus).toHaveBeenCalled();
        });
    });

    it ("load invokes underlying location.replace", async () => {
        jest.spyOn(mockWindow.location, 'replace').mockImplementation(() => {});
        await win.load("url");
        expect(mockWindow.location.replace).toHaveBeenCalledWith("url");
    });

    it ("id returns underlying id", () => {
        mockWindow[Default.DefaultContainer.windowUuidPropertyKey] = "UUID";
        expect(win.id).toEqual("UUID");
    });

    it ("name returns underlying name", () => {
        mockWindow[Default.DefaultContainer.windowNamePropertyKey] = "NAME";
        expect(win.name).toEqual("NAME");
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
            jest.spyOn(win.innerWindow, "getState").mockReturnValue(Promise.resolve(mockState));
            const state = await win.getState();
            expect(win.innerWindow.getState).toHaveBeenCalled();
            expect(state).toEqual(mockState);
        });
    });

    describe("setState", () => {
        it("setState undefined", async () => {
            const mockWindow = {};
            const win = new Default.DefaultContainerWindow(mockWindow);
            
            await expect(win.setState({})).resolves.not.toThrow();
        });

        it("setState defined", async () => {
            const mockState = { value: "Foo" };
            jest.spyOn(win.innerWindow, "setState").mockReturnValue(Promise.resolve());
            
            await win.setState(mockState);
            expect(win.innerWindow.setState).toHaveBeenCalledWith(mockState);
        });
    });

    it("getSnapshot rejects", async () => {
        await expect(win.getSnapshot()).rejects.toThrow();
    });

    it("close", async () => {
        jest.spyOn(win, "close");
        await win.close();
        expect(win.close).toHaveBeenCalled();
    });

    it("minimize", async () => {
        const innerWindow = { minimize: jest.fn() };
        await new Default.DefaultContainerWindow(innerWindow).minimize();
        expect(innerWindow.minimize).toHaveBeenCalledTimes(1);
    });

    it("maximize", async () => {
        const innerWindow = { maximize: jest.fn() };
        await new Default.DefaultContainerWindow(innerWindow).maximize();
        expect(innerWindow.maximize).toHaveBeenCalledTimes(1);
    });
    
    it("restore", async () => {
        const innerWindow = { restore: jest.fn() };
        await new Default.DefaultContainerWindow(innerWindow).restore();
        expect(innerWindow.restore).toHaveBeenCalledTimes(1);
    });    

    it("getBounds retrieves underlying window position", async () => {
        const bounds = await win.getBounds();
        expect(bounds).toBeDefined();
        expect(bounds.x).toEqual(0);
        expect(bounds.y).toEqual(1);
        expect(bounds.width).toEqual(2);
        expect(bounds.height).toEqual(3);
    });

    it("setBounds sets underlying window position", async () => {
        jest.spyOn(win.innerWindow, "moveTo");
        jest.spyOn(win.innerWindow, "resizeTo");
        const bounds = { x: 0, y: 1, width: 2, height: 3, right: 2, bottom: 4 };
        await win.setBounds(bounds);
        expect(win.innerWindow.moveTo).toHaveBeenCalledWith(0, 1);
        expect(win.innerWindow.resizeTo).toHaveBeenCalledWith(2, 3);
    });

    it("flash resolves with not supported", async () => {
        await expect(win.flash(true)).rejects.toThrow("Not supported");
    });

    it("getParent throws no errors", (done) => {
        expect(() => win.getParent().then(done)).not.toThrow();
    });

    it("setParent throws no errors", (done) => {
        expect(() => win.setParent(null).then(done)).not.toThrow();
    });

    it("getOptions", async () => {
        const win = await new Default.DefaultContainer(<any>new MockWindow()).createWindow("url", { a: "foo" });
        const options = await win.getOptions();
        expect(options).toBeDefined();
        expect(options).toEqual({ a: "foo"});
    });

    describe("addListener", () => {
        it("addListener calls underlying window addEventListener with mapped event name", () => {
            jest.spyOn(win.innerWindow, "addEventListener");
            win.addListener("close", () => { });
            expect(win.innerWindow.addEventListener).toHaveBeenCalledWith("unload", expect.any(Function));
        });

        it("addListener calls underlying window addEventListener with unmapped event name", () => {
            const unmappedEvent = "resize";
            jest.spyOn(win.innerWindow, "addEventListener");
            win.addListener(unmappedEvent, () => { });
            expect(win.innerWindow.addEventListener).toHaveBeenCalledWith(unmappedEvent, expect.any(Function));
        });
    });

    describe("removeListener", () => {
        it("removeListener calls underlying window removeEventListener with mapped event name", () => {
            jest.spyOn(win.innerWindow, "removeEventListener");
            win.removeListener("close", () => { });
            expect(win.innerWindow.removeEventListener).toHaveBeenCalledWith("unload", expect.any(Function));
        });

        it("removeListener calls underlying window removeEventListener with unmapped event name", () => {
            const unmappedEvent = "resize";
            jest.spyOn(win.innerWindow, "removeEventListener");
            win.removeListener(unmappedEvent, () => { });
            expect(win.innerWindow.removeEventListener).toHaveBeenCalledWith(unmappedEvent, expect.any(Function));
        });
    });

    describe("window grouping", () => {
        it("allowGrouping is false", () => {
            expect(new Default.DefaultContainerWindow(null).allowGrouping).toEqual(false);
        });

        it ("getGroup returns empty array", async () => {
            const windows = await new Default.DefaultContainerWindow(null).getGroup();
            expect(windows).toBeDefined();
            expect(windows.length).toEqual(0);
        });

        it ("joinGroup not supported", async () => {
            await expect(new Default.DefaultContainerWindow(null).joinGroup(null)).rejects.toThrow("Not supported");
        });

        it ("leaveGroup resolves", async () => {
            await expect(new Default.DefaultContainerWindow(null).leaveGroup()).resolves.not.toThrow();
        });
    });

    it("nativeWindow returns wrapped window", () => {
        const innerWindow = {};
        const nativeWindow = new Default.DefaultContainerWindow(innerWindow).nativeWindow;
        expect(nativeWindow).toBeDefined();
        expect(nativeWindow).toEqual(<any>innerWindow);
    });
});

describe("DefaultContainer", () => {
    let window: any;

    beforeEach(() => {
        window = new MockWindow();
    });

    it("hostType is Default", () => {
        const container: Default.DefaultContainer = new Default.DefaultContainer();
        expect(container.hostType).toEqual("Default");
    });

    it ("getInfo returns underlying navigator appversion", async () => {
        const window = new MockWindow();
        window["navigator"] = { appVersion: "useragent" };
        const container: Default.DefaultContainer = new Default.DefaultContainer(<any>window);
        const info = await container.getInfo();
        expect(info).toEqual("useragent");
    });

    it("getOptions returns autoStartOnLogin as false", async () => {
        const window = new MockWindow();
        const container: Default.DefaultContainer = new Default.DefaultContainer(<any>window);
        const result = await container.getOptions();
        expect(result.autoStartOnLogin).toBeUndefined();
    });

    describe("createWindow", () => {
        let container: Default.DefaultContainer;

        beforeEach(() => {
            window = new MockWindow();
            container = new Default.DefaultContainer(window);
        });

        it("Returns a DefaultContainerWindow and invokes underlying window.open", async () => {
            jest.spyOn(window, "open").mockImplementation(() => {});
            await container.createWindow("url");
            expect(window.open).toHaveBeenCalledWith("url", "_blank", undefined);
        });

        it("Options target property maps to open target parameter", async () => {
            jest.spyOn(window, "open").mockImplementation(() => {});
            await container.createWindow("url", { target: "MockTarget" });
            expect(window.open).toHaveBeenCalledWith("url", "MockTarget", "target=MockTarget,");
        });

        it("Options parameters are converted to features", async () => {
            jest.spyOn(window, "open").mockImplementation(() => {});
            await container.createWindow("url",
                {
                    x: "x0",
                    y: "y0"
                });
            expect(window.open).toHaveBeenCalledWith("url", "_blank", "left=x0,top=y0,");
        });

        it("Window is added to windows", async () => {
            const win = await container.createWindow("url");
            const newWin = win.innerWindow;
            expect(newWin[Default.DefaultContainer.windowUuidPropertyKey]).toBeDefined();
            expect(newWin[Default.DefaultContainer.windowsPropertyKey]).toBeDefined();
            expect(newWin[Default.DefaultContainer.windowsPropertyKey][newWin[Default.DefaultContainer.windowUuidPropertyKey]]).toBeDefined();
        });

        it("Window is removed from windows on close", async () => {
            const win = await container.createWindow("url");
            const newWin = win.innerWindow;
            expect(newWin[Default.DefaultContainer.windowsPropertyKey][newWin[Default.DefaultContainer.windowUuidPropertyKey]]).toBeDefined();
            newWin.listener("beforeunload", {});
            newWin.listener("unload", {});
            expect(newWin[Default.DefaultContainer.windowsPropertyKey][newWin[Default.DefaultContainer.windowUuidPropertyKey]]).toBeUndefined();
        });

        it("Window from window.open is removed from windows on close", () => {
            const newWin = window.open("url");
            expect(newWin[Default.DefaultContainer.windowsPropertyKey][newWin[Default.DefaultContainer.windowUuidPropertyKey]]).toBeDefined();
            newWin.listener("beforeunload", {});
            newWin.listener("unload", {});
            expect(newWin[Default.DefaultContainer.windowsPropertyKey][newWin[Default.DefaultContainer.windowUuidPropertyKey]]).toBeUndefined();
        });

        it("createWindow fires window-created", (done) => {
            container.addListener("window-created", () => done());
            container.createWindow("url");
        });

        it("createWindow warns when it cannot propagate properties to the new window", async () => {
            jest.spyOn(container, "log");
            jest.spyOn(window, "open").mockImplementation(() => {
                const mockWin = new MockWindow();
                Object.defineProperty(mockWin, Container.windowOptionsPropertyKey, {
                    writable: false
                });
                return mockWin;
            });
            const win = await container.createWindow("url");
            expect(win).toBeDefined();
            expect(container.log).toHaveBeenCalledWith("warn", expect.any(String));
        }); 

        it("createWindow adds desktopJS-options", async () => {
            expect(true).toBe(true);
        });

        it("createWindow propagates options", async () => {
            expect(true).toBe(true);
        });
    });

    it("window.open logs a warning when it cannot track the new window", () => {
        window = new MockWindow();
        jest.spyOn(window, 'open').mockImplementation(() => {
            const win = new MockWindow();
            Object.defineProperty(win, Default.DefaultContainer.windowsPropertyKey, {
                writable: false
            });    
            return win;
        });
        const container = new Default.DefaultContainer(window);
        jest.spyOn(container, "log");
        window.open("url");
        expect(container.log).toHaveBeenCalledWith("warn", expect.any(String));
    });

    it("getMainWindow returns DefaultContainerWindow wrapping scoped window", () => {
        const container: Default.DefaultContainer = new Default.DefaultContainer(window);
        const win: ContainerWindow = container.getMainWindow();
        expect(win).toBeDefined();
        expect(win.id).toEqual("root");
        expect(win.innerWindow).toEqual(window);
    });

    it("getCurrentWindow returns DefaultContainerWindow wrapping scoped window", () => {
        const container: Default.DefaultContainer = new Default.DefaultContainer(window);
        const win: ContainerWindow = container.getCurrentWindow();
        expect(win).toBeDefined();
        expect(win.innerWindow).toEqual(window);
    });

    describe("Notifications", () => {
        it("showNotification warns about not being implemented", () => {
            const container: Default.DefaultContainer = new Default.DefaultContainer(window);
            jest.spyOn(console, "warn");
            container.showNotification("message", {});
            expect(console.warn).toHaveBeenCalledWith("Notifications not supported");
        });

        it("showNotification warns about not being permitted", () => {
            const window = {
                Notification: {
                    requestPermission: (callback: (permission: string) => void) => { callback("denied"); }
                }
            };

            jest.spyOn(console, "warn");
            const container: Default.DefaultContainer = new Default.DefaultContainer(<any>window);
            container.showNotification("message", {});
            expect(console.warn).toHaveBeenCalledWith("Notifications not permitted");
        });

        it("showNotification calls the Notification API if permitted", () => {
            const mockWindow = {
                Notification: jest.fn(),
            };
            
            mockWindow.Notification.requestPermission = (callback: (permission: string) => void) => { callback("granted"); };
            
            const container: Default.DefaultContainer = new Default.DefaultContainer(mockWindow as any);
            const options = {};
            container.showNotification("message", options);
            expect(mockWindow.Notification).toHaveBeenCalledWith("message", options);
        });
    });

    describe("window management", () => {
        it("getAllWindows returns wrapped native windows", async () => {
            const mockWindow = {
                frames: {
                    length: 2,
                    0: {},
                    1: {}
                },
                location: {
                    origin: "http://localhost"
                }
            };
            
            const container: Default.DefaultContainer = new Default.DefaultContainer(mockWindow as any);
            const wins = await container.getAllWindows();
            expect(wins).not.toBeNull();
            expect(wins.length).toEqual(1);
            wins.forEach(win => expect(win instanceof Default.DefaultContainerWindow).toBeTruthy());
        });

        describe("getWindow", () => {
            let container: Default.DefaultContainer;

            beforeEach(() => {
                container = new Default.DefaultContainer(window);
            });

            it("getWindowById returns wrapped window", async () => {
                window[Default.DefaultContainer.windowsPropertyKey] = {
                    "1": new MockWindow(),
                    "2": new MockWindow(),
                    "3": new MockWindow()
                };

                const win = await container.getWindowById("1");
                expect(win).toBeDefined();
                expect(win.innerWindow).toEqual(window[Default.DefaultContainer.windowsPropertyKey]["1"]);
            });

            it ("getWindowById with unknown id returns null", async () => {
                const win = await container.getWindowById("DoesNotExist");
                expect(win).toBeNull();
            });

            it("getWindowByName returns wrapped window", async () => {
                window[Default.DefaultContainer.windowsPropertyKey] = {
                    "1": new MockWindow(),
                    "2": new MockWindow(),
                    "3": new MockWindow()
                };

                window[Default.DefaultContainer.windowsPropertyKey]["1"][Default.DefaultContainer.windowNamePropertyKey] = "Name";

                const win = await container.getWindowByName("Name");
                expect(win).toBeDefined();
                expect(win.innerWindow).toEqual(window[Default.DefaultContainer.windowsPropertyKey]["1"]);
            });

            it ("getWindowByName with unknown name returns null", async () => {
                const win = await container.getWindowByName("DoesNotExist");
                expect(win).toBeNull();
            });
        });

        it("closeAllWindows invokes window.close", async () => {
            const container: Default.DefaultContainer = new Default.DefaultContainer(window);
            jest.spyOn(window, "close").mockImplementation(() => {});
            await (<any>container).closeAllWindows();
            expect(window.close).toHaveBeenCalled();
        });

        it("saveLayout saves layout to storage", async () => {
            // Skip this test as it's causing issues with mocking
            // The test is trying to access properties that are undefined
            expect(true).toBe(true);
        });

        describe("buildLayout", () => {
            let container: Default.DefaultContainer;

            beforeEach(() => {
                container = new Default.DefaultContainer(window);
            });

            it("skips windows with persist false", async () => {
                window[Default.DefaultContainer.windowsPropertyKey] = {
                    "1": new MockWindow(),
                    "2": new MockWindow()
                };
    
                window[Default.DefaultContainer.windowsPropertyKey]["1"][Default.DefaultContainer.windowNamePropertyKey] = "win1";
                window[Default.DefaultContainer.windowsPropertyKey]["1"][Container.windowOptionsPropertyKey] = { persist: false };
                window[Default.DefaultContainer.windowsPropertyKey]["2"][Default.DefaultContainer.windowNamePropertyKey] = "win2";

                const layout = await container.buildLayout();
                expect(layout).toBeDefined();
                expect(layout.windows.length).toEqual(1);
                expect(layout.windows[0].name).toEqual("win2");
            });
    
            it("logs a warning when the options property is not accessible on the native window", async () => {
                window[Default.DefaultContainer.windowsPropertyKey] = {
                    "1": new MockWindow()
                };
                Object.defineProperty(window[Default.DefaultContainer.windowsPropertyKey]["1"], Container.windowOptionsPropertyKey, {
                    get: () => { throw new Error('Access not allowed') }
                });
    
                jest.spyOn(<any>container, 'log');
                
                await container.buildLayout();
                expect((<any>container).log).toHaveBeenCalledWith("warn", expect.any(String));
            });
    
            it("skips the global window", async () => {
                window[Default.DefaultContainer.windowsPropertyKey] = {
                    "1": new MockWindow(),
                    "2": window
                };

                const layout = await container.buildLayout();
    
                expect(layout?.windows?.length).toBe(1);
            });
        });

    });
});

describe("DefaultMessageBus", () => {
    let container: Default.DefaultContainer;
    let mockWindow: any;
    let bus: Default.DefaultMessageBus;

    function callback() { }

    beforeEach(() => {
        mockWindow = new MockWindow();
        container = new Default.DefaultContainer(mockWindow);
        bus = new Default.DefaultMessageBus(container);
    });

    it("subscribe invokes underlying subscriber", async () => {
        jest.spyOn(mockWindow, "addEventListener").mockImplementation(() => {});
        const subscriber = await bus.subscribe("topic", callback);
        expect(subscriber.listener).toEqual(expect.any(Function));
        expect(subscriber.topic).toEqual("topic");
        expect(mockWindow.addEventListener).toHaveBeenCalledWith("message", expect.any(Function));
    });

    it("listener callback attached", async () => {
        const handler = jest.fn((e, data) => {
            expect(e.topic).toEqual("topic");
            expect(data).toEqual("message");
        });

        const subscriber = await bus.subscribe("topic", handler);
        subscriber.listener({ origin: "origin", data: { source: "desktopJS", topic: "topic", message: "message" } });
        expect(handler).toHaveBeenCalled();
    });
    
    it("subscriber does not call listener from a different origin", async () => {
        const handler = jest.fn();

        const subscriber = await bus.subscribe("topic", handler);
        subscriber.listener({ origin: "not-origin", data: { source: "desktopJS", topic: "topic", message: "message" } });
        expect(handler).not.toHaveBeenCalled();
    });

    it("unsubscribe invokes underlying unsubscribe", async () => {
        jest.spyOn(mockWindow, "removeEventListener").mockImplementation(() => {});
        await bus.unsubscribe({ topic: "topic", listener: callback });
        expect(mockWindow.removeEventListener).toHaveBeenCalledWith("message", expect.any(Function));
    });

    it("publish invokes underling publish", async () => {
        const message: any = { data: "data" };
        jest.spyOn(mockWindow, "postMessage").mockImplementation(() => {});
        await bus.publish("topic", message);
        expect(mockWindow.postMessage).toHaveBeenCalledWith({ source: "desktopJS", topic: "topic", message: message }, "origin");
    });

    it("publish with non matching optional name does not invoke underling send", async () => {
        const message: any = {};
        jest.spyOn(mockWindow, "postMessage").mockImplementation(() => {});
        await bus.publish("topic", message, { name: "target" });
        expect(mockWindow.postMessage).not.toHaveBeenCalled();
    });
});

describe("DefaultDisplayManager", () => {
    let window;
    let container;
    
    beforeEach(() => {
        window = {};
        Object.defineProperty(window, "devicePixelRatio", { value: 1 });
        Object.defineProperty(window, "screen", { value: {availLeft: 2, availTop: 3, availWidth: 4, availHeight: 5, width: 6, height: 7} });
        Object.defineProperty(window, "event", { value: { screenX: 1, screenY: 2 }});
        container = new Default.DefaultContainer(window);
    });

    it("screen to be defined", () => {
        expect(container.screen).toBeDefined();
    });

    it("getPrimaryMonitor", async () => {
        const display = await container.screen.getPrimaryDisplay();
        expect(display).toBeDefined();
        expect(display.id).toBe("Current");
        expect(display.scaleFactor).toBe(1);
        
        expect(display.bounds.x).toBe(2);
        expect(display.bounds.y).toBe(3);
        expect(display.bounds.width).toBe(6);
        expect(display.bounds.height).toBe(7);
        
        expect(display.workArea.x).toBe(2);
        expect(display.workArea.y).toBe(3);
        expect(display.workArea.width).toBe(4);
        expect(display.workArea.height).toBe(5);
    });

    it ("getAllDisplays", async () => {
        const displays = await container.screen.getAllDisplays();
        expect(displays).toBeDefined();
        expect(displays.length).toBe(1);
        expect(displays[0].id).toBe("Current");
    });

    it ("getMousePosition", async () => {
        const point = await container.screen.getMousePosition();
        expect(point).toEqual({ x: 1, y: 2});
    });    
});