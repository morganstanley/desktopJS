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
import { Point } from "../../../src/screen";

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
    public innerWidth: any = 2;
    public innerHeight: any = 3;
    public screen: any = {
        width: 1920,
        height: 1080,
        availWidth: 1920,
        availHeight: 1040,
        availLeft: 0,
        availTop: 40
    };
    public devicePixelRatio: number = 1.25;
    public event: any = {
        screenX: 123,
        screenY: 456
    };
    location: any = {
        origin: "origin",
        replace: vi.fn(),
        toString: vi.fn().mockReturnValue("https://example.com")
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

    it("getInfo returns underlying navigator.appVersion", async () => {
        window.navigator = { appVersion: "TEST" } as any;
        const info = await container.getInfo();
        expect(info).toBe("TEST");
    });

    it("getMainWindow returns wrapped innerWindow", () => {
        window[Default.DefaultContainer.windowsPropertyKey] = {
            "root": window
        };
        
        const win = container.getMainWindow();
        expect(win).toBeDefined();
        expect(win.innerWindow).toBe(window);
    });

    it("getCurrentWindow returns wrapped innerWindow", () => {
        const win = container.getCurrentWindow();
        expect(win).toBeDefined();
        expect(win.innerWindow).toBe(window);
    });

    describe("getAllWindows", () => {
        it("getAllWindows returns wrapped windows", async () => {
            window[Default.DefaultContainer.windowsPropertyKey] = {
                "1": new MockWindow(),
                "2": new MockWindow()
            };

            const wins = await container.getAllWindows();
            expect(wins).toBeDefined();
            expect(wins.length).toBe(2);
        });

        it("getWindowById returns wrapped window", async () => {
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
    
    describe("createMessageBus", () => {
        it("creates DefaultMessageBus instance", () => {
            const messageBus = (container as any).createMessageBus();
            expect(messageBus).toBeDefined();
            expect(messageBus).toBeInstanceOf(Default.DefaultMessageBus);
        });
    });
    
    describe("getWindowOptions", () => {
        it("transforms properties using windowOptionsMap", () => {
            const options = { x: 100, y: 200, width: 800, height: 600 };
            const transformedOptions = (container as any).getWindowOptions(options);
            expect(transformedOptions).toBeDefined();
            expect(transformedOptions.left).toBe(100);
            expect(transformedOptions.top).toBe(200);
            expect(transformedOptions.width).toBe(800);
            expect(transformedOptions.height).toBe(600);
        });
    });
    
    describe("onOpen", () => {
        it("tracks new window and assigns properties", () => {
            const newWindow = new MockWindow();
            const openFn = vi.fn().mockReturnValue(newWindow);
            
            // Disable emit to prevent postMessage errors
            vi.spyOn(Container, 'emit').mockImplementation(() => {});
            vi.spyOn(ContainerWindow, 'emit').mockImplementation(() => {});
            
            const result = (container as any).onOpen(openFn, "url", "name", "features");
            
            expect(openFn).toHaveBeenCalledWith("url", "name", "features");
            expect(result).toBe(newWindow);
            expect(newWindow[Default.DefaultContainer.windowUuidPropertyKey]).toBeDefined();
        });
        
        it("handles error when tracking new window", () => {
            const newWindow = {};
            const openFn = vi.fn().mockReturnValue(newWindow);
            const logSpy = vi.spyOn(container, "log");
            
            // Disable emit to prevent postMessage errors
            vi.spyOn(Container, 'emit').mockImplementation(() => {});
            vi.spyOn(ContainerWindow, 'emit').mockImplementation(() => {});
            
            const result = (container as any).onOpen(openFn, "url", "name", "features");
            
            expect(openFn).toHaveBeenCalledWith("url", "name", "features");
            expect(result).toBe(newWindow);
            expect(logSpy).toHaveBeenCalledWith("warn", expect.stringContaining("Error tracking new window"));
        });
        
        it("does not track null/undefined window", () => {
            const openFn = vi.fn().mockReturnValue(null);
            
            // Disable emit to prevent postMessage errors
            vi.spyOn(Container, 'emit').mockImplementation(() => {});
            vi.spyOn(ContainerWindow, 'emit').mockImplementation(() => {});
            
            const result = (container as any).onOpen(openFn, "url", "name", "features");
            expect(result).toBeNull();
        });
    });
    
    describe("closeAllWindows", () => {
        it("closes all windows", async () => {
            const win1 = new MockWindow();
            const win2 = new MockWindow();
            const closeSpy1 = vi.spyOn(win1, "close");
            const closeSpy2 = vi.spyOn(win2, "close");
            
            window[Default.DefaultContainer.windowsPropertyKey] = {
                "1": win1,
                "2": win2
            };
            
            await container.closeAllWindows();
            
            expect(closeSpy1).toHaveBeenCalled();
            expect(closeSpy2).toHaveBeenCalled();
        });
        
        it("excludes self when specified", async () => {
            const win1 = window; // This is the container's window
            const win2 = new MockWindow();
            const closeSpy1 = vi.spyOn(win1, "close");
            const closeSpy2 = vi.spyOn(win2, "close");
            
            window[Default.DefaultContainer.windowsPropertyKey] = {
                "1": win1,
                "2": win2
            };
            
            await container.closeAllWindows(true);
            
            expect(closeSpy1).not.toHaveBeenCalled();
            expect(closeSpy2).toHaveBeenCalled();
        });
    });
    
    describe("screen", () => {
        it("has screen property initialized", () => {
            expect(container.screen).toBeDefined();
        });
        
        it("getPrimaryDisplay returns display with correct properties", async () => {
            const display = await container.screen.getPrimaryDisplay();
            
            expect(display).toBeDefined();
            expect(display.id).toBe("Current");
            expect(display.scaleFactor).toBe(1.25);
            
            // Check bounds
            expect(display.bounds.x).toBe(0);
            expect(display.bounds.y).toBe(40);
            expect(display.bounds.width).toBe(1920);
            expect(display.bounds.height).toBe(1080);
            
            // Check work area
            expect(display.workArea.x).toBe(0);
            expect(display.workArea.y).toBe(40);
            expect(display.workArea.width).toBe(1920);
            expect(display.workArea.height).toBe(1040);
        });
        
        it("getAllDisplays returns array with primary display", async () => {
            const displays = await container.screen.getAllDisplays();
            
            expect(displays).toBeDefined();
            expect(displays.length).toBe(1);
            expect(displays[0].id).toBe("Current");
        });
        
        it("getMousePosition returns correct mouse position from window.event", async () => {
            const position = await container.screen.getMousePosition();
            
            expect(position).toBeDefined();
            expect(position.x).toBe(123);
            expect(position.y).toBe(456);
        });
    });
});

describe("DefaultMessageBus", () => {
    let mockWindow: MockWindow;
    let container: Default.DefaultContainer;
    let messageBus: Default.DefaultMessageBus;
    
    beforeEach(() => {
        mockWindow = new MockWindow();
        container = new Default.DefaultContainer(mockWindow as any);
        messageBus = new Default.DefaultMessageBus(container);
    });
    
    describe("subscribe", () => {
        it("adds event listener to window", async () => {
            const addEventListenerSpy = vi.spyOn(mockWindow, "addEventListener");
            const listener = vi.fn();
            
            await messageBus.subscribe("topic", listener);
            
            expect(addEventListenerSpy).toHaveBeenCalledWith("message", expect.any(Function));
        });
        
        it("filters messages by origin", async () => {
            const listener = vi.fn();
            await messageBus.subscribe("topic", listener);
            
            // Call the listener directly with a message from a different origin
            const subscription = await messageBus.subscribe("topic", listener);
            const event = {
                origin: "different-origin",
                data: {
                    source: "desktopJS",
                    topic: "topic",
                    message: "test"
                }
            };
            
            subscription.listener(event);
            
            expect(listener).not.toHaveBeenCalled();
        });
        
        it("filters messages by topic", async () => {
            const listener = vi.fn();
            
            // Set the origin to match
            mockWindow.location.origin = "same-origin";
            
            await messageBus.subscribe("topic", listener);
            
            // Call the listener directly with a message with a different topic
            const subscription = await messageBus.subscribe("topic", listener);
            const event = {
                origin: "same-origin",
                data: {
                    source: "desktopJS",
                    topic: "different-topic",
                    message: "test"
                }
            };
            
            subscription.listener(event);
            
            expect(listener).not.toHaveBeenCalled();
        });
        
        it("calls listener when topic and origin match", async () => {
            const listener = vi.fn();
            
            // Set the origin to match
            mockWindow.location.origin = "same-origin";
            
            // Call the listener directly with a matching message
            const subscription = await messageBus.subscribe("topic", listener);
            const event = {
                origin: "same-origin",
                data: {
                    source: "desktopJS",
                    topic: "topic",
                    message: "test"
                }
            };
            
            subscription.listener(event);
            
            expect(listener).toHaveBeenCalledWith({ topic: "topic" }, "test");
        });
    });
    
    describe("unsubscribe", () => {
        it("removes event listener from window", async () => {
            const removeEventListenerSpy = vi.spyOn(mockWindow, "removeEventListener");
            const listener = vi.fn();
            
            const subscription = await messageBus.subscribe("topic", listener);
            await messageBus.unsubscribe(subscription);
            
            expect(removeEventListenerSpy).toHaveBeenCalledWith("message", subscription.listener);
        });
    });
    
    describe("publish", () => {
        it("posts message to all windows", async () => {
            const win1 = new MockWindow();
            const win2 = new MockWindow();
            const postMessageSpy1 = vi.spyOn(win1, "postMessage");
            const postMessageSpy2 = vi.spyOn(win2, "postMessage");
            
            mockWindow[Default.DefaultContainer.windowsPropertyKey] = {
                "1": win1,
                "2": win2
            };
            
            await messageBus.publish("topic", "message");
            
            expect(postMessageSpy1).toHaveBeenCalledWith(
                { source: "desktopJS", topic: "topic", message: "message" },
                "origin"
            );
            expect(postMessageSpy2).toHaveBeenCalledWith(
                { source: "desktopJS", topic: "topic", message: "message" },
                "origin"
            );
        });
        
        it("filters by window name when specified", async () => {
            const win1 = new MockWindow();
            const win2 = new MockWindow();
            win1[Default.DefaultContainer.windowNamePropertyKey] = "window1";
            win2[Default.DefaultContainer.windowNamePropertyKey] = "window2";
            
            const postMessageSpy1 = vi.spyOn(win1, "postMessage");
            const postMessageSpy2 = vi.spyOn(win2, "postMessage");
            
            mockWindow[Default.DefaultContainer.windowsPropertyKey] = {
                "1": win1,
                "2": win2
            };
            
            await messageBus.publish("topic", "message", { name: "window1" });
            
            expect(postMessageSpy1).toHaveBeenCalled();
            expect(postMessageSpy2).not.toHaveBeenCalled();
        });
        
        it("uses custom targetOrigin when specified", async () => {
            const win = new MockWindow();
            const postMessageSpy = vi.spyOn(win, "postMessage");
            
            mockWindow[Default.DefaultContainer.windowsPropertyKey] = {
                "1": win
            };
            
            await messageBus.publish("topic", "message", { targetOrigin: "https://custom-origin.com" });
            
            expect(postMessageSpy).toHaveBeenCalledWith(
                { source: "desktopJS", topic: "topic", message: "message" },
                "https://custom-origin.com"
            );
        });
        
        it("handles undefined windows", async () => {
            mockWindow[Default.DefaultContainer.windowsPropertyKey] = undefined;
            
            // This should not throw an error
            await expect(messageBus.publish("topic", "message")).resolves.toBeUndefined();
        });
    });
});
