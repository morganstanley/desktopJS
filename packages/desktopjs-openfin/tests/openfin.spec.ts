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

import {} from "jasmine";
import { OpenFinContainer, OpenFinContainerWindow, OpenFinMessageBus } from "../src/openfin";
import { ContainerWindow, MessageBusSubscription, MenuItem } from "@morgan-stanley/desktopjs";

class MockDesktop {
    public static application: any = {
        eventListeners: new Map(),
        uuid: "uuid",
        getChildWindows(callback) { callback([MockWindow.singleton, new MockWindow("Window2", JSON.stringify({ persist: false }))]); },
        setTrayIcon() { },
        setShortcuts(config) { },
        getShortcuts(callback) { callback(); },
        getWindow() { return MockWindow.singleton; },
        addEventListener(eventName, listener) {
            (this.eventListeners[eventName] = this.eventListeners[eventName] || []).push(listener);
        },
        listeners(eventName: string): ((event: any) => void)[] {
            return (this.eventListeners[eventName] || []);
        },
        emit(eventName: string, ...eventArgs: any[]) {
            for (const listener of this.listeners(eventName)) {
                listener(...eventArgs);
            }
        }
    }
    main(callback): any { callback(); }
    GlobalHotkey: any = { };
    Window: any = MockWindow;
    Notification(): any { return {}; }
    InterApplicationBus: any = new MockInterApplicationBus();
    Application: any = {
        getCurrent() {
            return MockDesktop.application;
        }
    };

}

class MockInterApplicationBus {
    subscribe(uuid: string, name: string, topic: string, listener: (message: any, uuid: string, name: string) => void, callback?: () => void, errorCallback?: (reason: string) => void): void {
        callback();
    }

    unsubscribe(senderUuid: string, name: string, topic: string, listener: (message: any, uuid: string, name: string) => void, callback?: () => void, errorCallback?: (reason: string) => void): void {
        callback();
    }

    send(destinationUuid: string, name: string, topic: string, message: any, callback?: () => void, errorCallback?: (reason: string) => void): void {
        callback();
    }

    publish(topic: string, message: any, callback?: () => void, errorCallback?: (reason: string) => void): void {
        callback();
    }

    addSubscribeListener() { }
    addUnsubscribeListener() { }
    removeSubscribeListener() { }
    removeUnsubscribeListener() { }
}

class MockWindow {
    static singleton: MockWindow = new MockWindow("Singleton");
    public nativeWindow: Window = jasmine.createSpyObj("window", ["location", "getState", "setState"]);
    private customData: string;

    constructor(name?: string, customData?: string) {
        this.name = name;
        this.customData = customData;
    }

    public name: string;

    static getCurrent(): any { return MockWindow.singleton; }

    getParentWindow(): any { return MockWindow.singleton; }

    getNativeWindow(): any { return this.nativeWindow; }

    navigate(url: string, callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }

    focus(callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }

    show(callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }

    close(force: boolean, callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }

    hide(callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }

    minimize(callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }

    maximize(callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }
    
    restore(callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }

    isShowing(callback: (showing: boolean) => void, error: (reason) => void): any {
        callback(true);
        return {};
    }

    getSnapshot(callback: (snapshot: string) => void, error: (reason) => void): any {
        callback("");
        return {};
    }

    getBounds(callback: (bounds: any) => void, error: (reason) => void): any {
        callback({ left: 0, top: 1, width: 2, height: 3 });
        return {};
    }

    setBounds(x: number, y: number, width: number, height: number, callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }

    flash(options: any, callback: () => void): void {
        callback();
    }

    stopFlashing(callback: () => void): void {
        callback();
    }

    getOptions(callback: (options: any) => void, error: (reason) => void): any {
        callback({ url: "url", customData: this.customData });
        return {};
    }

    getGroup(callback: any, errorCallback: any) {
        callback([ MockWindow.singleton]);
    }

    joinGroup(target: any, callback: any, errorCallback: any) { }
    leaveGroup(callback: any, errorCallback: any) { }

    bringToFront(callback:any, errorCallback: any) {
        callback();
    }

    addEventListener(eventName: string, listener: any): void { }

    removeEventListener(eventName: string, listener: any): void { }
}

describe("OpenFinContainerWindow", () => {
    let innerWin: any;
    let win: OpenFinContainerWindow;

    beforeEach(() => {
        innerWin = new MockWindow();
        win = new OpenFinContainerWindow(innerWin);
    });

    it("Wrapped window is retrievable", () => {
        expect(win).toBeDefined();
        expect(win.innerWindow).toBeDefined();
        expect(win.innerWindow).toEqual(innerWin);
    });

    it ("id returns underlying name", () => {
        innerWin.name = "NAME";
        expect(win.id).toEqual("NAME");
    });

    it ("name returns underlying name", () => {
        innerWin.name = "NAME";
        expect(win.name).toEqual("NAME");
    });

    it ("nativeWindow invokes underlying getNativeWindow", () => {
        spyOn(innerWin, "getNativeWindow").and.callThrough();
        const nativeWin = win.nativeWindow;
        expect(innerWin.getNativeWindow).toHaveBeenCalled();
        expect(nativeWin).toBeDefined();
        expect(nativeWin).toEqual(innerWin.nativeWindow);
    });

    it("load", async () => {
        spyOn(innerWin, "navigate").and.callThrough();
        await win.load("url");
        expect(innerWin.navigate).toHaveBeenCalledWith("url", jasmine.any(Function), jasmine.any(Function));
    });

    it("focus", async () => {
        spyOn(innerWin, "focus").and.callThrough();
        await win.focus();
        expect(innerWin.focus).toHaveBeenCalled();
    });

    it("show", async () => {
        spyOn(innerWin, "show").and.callThrough();
        await win.show();
        expect(innerWin.show).toHaveBeenCalled();
    });

    it("hide", async () => {
        spyOn(innerWin, "hide").and.callThrough();
        await win.hide();
        expect(innerWin.hide).toHaveBeenCalled();
    });

    it("close", async () => {
        spyOn(innerWin, "close").and.callThrough();
        await win.close();
        expect(innerWin.close).toHaveBeenCalled();
    });

    it("minimize", async () => {
        spyOn(innerWin, "minimize").and.callThrough();
        await win.minimize();
        expect(innerWin.minimize).toHaveBeenCalled();
    });

    it("maximize", async () => {
        spyOn(innerWin, "maximize").and.callThrough();
        await win.maximize();
        expect(innerWin.maximize).toHaveBeenCalled();
    });

    it("restore", async () => {
        spyOn(innerWin, "restore").and.callThrough();
        await win.restore();
        expect(innerWin.restore).toHaveBeenCalled();
    });
   
    it("isShowing", async () => {
        spyOn(innerWin, "isShowing").and.callThrough();

        const showing = await win.isShowing();
        expect(showing).toBeDefined();
        expect(showing).toEqual(true);
        expect(innerWin.isShowing).toHaveBeenCalled();
    });


    describe("getState", () => {
        it("getState undefined", async () => {
            const mockWindow = new MockWindow();
            delete (<any>mockWindow.nativeWindow).getState;
            const win = new OpenFinContainerWindow(innerWin);

            const state = await win.getState();
            expect(state).toBeUndefined();
        });

        it("getState defined", async () => {
            const mockState = { value: "Foo" };
            innerWin.nativeWindow.getState.and.returnValue(mockState);
    
            const state = await win.getState();
            expect(innerWin.nativeWindow.getState).toHaveBeenCalled();
            expect(state).toEqual(mockState);
        });
    });

    describe("setState", () => {
        it("setState undefined", async () => {
            const mockWindow = new MockWindow();
            delete (<any>mockWindow.nativeWindow).setState;
            const win = new OpenFinContainerWindow(innerWin);

            await expectAsync(win.setState({})).toBeResolved();
        });

        it("setState defined", async () => {
            const mockState = { value: "Foo" };
            innerWin.nativeWindow.setState.and.returnValue(Promise.resolve());
    
            await win.setState(mockState);
            expect(innerWin.nativeWindow.setState).toHaveBeenCalledWith(mockState);
        });
    });

    describe("getSnapshot", () => {
        it("getSnapshot invokes underlying getSnapshot", async () => {
            spyOn(innerWin, "getSnapshot").and.callThrough();

            const snapshot = await win.getSnapshot();
            expect(snapshot).toBeDefined();
            expect(snapshot).toEqual("data:image/png;base64,");
            expect(innerWin.getSnapshot).toHaveBeenCalled();
        });

        it("getSnapshot propagates internal error to promise reject", async () => {
            spyOn(innerWin, "getSnapshot").and.callFake((callback, reject) => reject("Error"));

            await expectAsync(win.getSnapshot()).toBeRejected();
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
            spyOn(win.innerWindow, "setBounds").and.callThrough()
            await win.setBounds(<any> { x: 0, y: 1, width: 2, height: 3 });
            expect(win.innerWindow.setBounds).toHaveBeenCalledWith(0, 1, 2, 3, jasmine.any(Function), jasmine.any(Function));
        });

        it("flash enable invokes underlying flash", async () => {
            spyOn(win.innerWindow, "flash").and.callThrough();
            await win.flash(true);
            expect(win.innerWindow.flash).toHaveBeenCalled();
        });

        it("flash disable invokes underlying stopFlashing", async () => {
            spyOn(win.innerWindow, "stopFlashing").and.callThrough();
            await win.flash(false);
            expect(win.innerWindow.stopFlashing).toHaveBeenCalled();
        });

        it("getParent does not throw", async () => {
            expect(() => win.getParent().then()).not.toThrow();
        });

        it("setParent does not throw", async () => {
            expect(() => win.setParent(null).then()).not.toThrow();
        });

        describe("getOptions", () => {
            it("getOptions invokes underlying getOptions and returns undefined customData", async () => {
                spyOn(win.innerWindow, "getOptions").and.callFake(callback => callback({ }));
                const options = await win.getOptions();
                expect(options).toBeUndefined();
            });

            it("getOptions invokes underlying getOptions and parses non-null customData", async () => {
                spyOn(win.innerWindow, "getOptions").and.callFake(callback => callback({ customData: '{ "a": "foo"}' }));
                const options = await win.getOptions();
                expect(options).toBeDefined();
                expect(options.a).toEqual("foo");
            });
        });
    });

    describe("addListener", () => {
        it("addListener calls underlying OpenFin window addEventListener with mapped event name", () => {
            spyOn(win.innerWindow, "addEventListener").and.callThrough()
            win.addListener("move", () => { });
            expect(win.innerWindow.addEventListener).toHaveBeenCalledWith("bounds-changing", jasmine.any(Function));
        });

        it("addListener calls underlying OpenFin window addEventListener with unmapped event name", () => {
            const unmappedEvent = "closed";
            spyOn(win.innerWindow, "addEventListener").and.callThrough()
            win.addListener(unmappedEvent, () => { });
            expect(win.innerWindow.addEventListener).toHaveBeenCalledWith(unmappedEvent, jasmine.any(Function));
        });

        it ("resize wraps filtered bounds-changing", (done) => {
            spyOn(win.innerWindow, "addEventListener").and.callFake((eventName, listener) => {
                listener({ changeType: 1 });
            });
            win.addListener("resize", (e) => {
                expect(e.innerEvent.changeType).toBeGreaterThanOrEqual(1);
                done();
            });
        });

        it ("move wraps filtered bounds-changing", (done) => {
            spyOn(win.innerWindow, "addEventListener").and.callFake((eventName, listener) => {
                listener({ changeType: 0 });
            });
            win.addListener("move", (e) => {
                expect(e.innerEvent.changeType).toEqual(0);
                done();
            });
        });

        it ("beforeunload attaches to underlying close-requested ", () => {
            spyOn(win.innerWindow, "addEventListener").and.stub()
            win.addListener("beforeunload", (e) => {});
            expect(win.innerWindow.addEventListener).toHaveBeenCalledWith("close-requested", jasmine.any(Function));
        });
    });

    describe("removeListener", () => {
        it("removeListener calls underlying OpenFin window removeEventListener with mapped event name", () => {
            spyOn(win.innerWindow, "removeEventListener").and.callThrough()
            win.removeListener("move", () => { });
            expect(win.innerWindow.removeEventListener).toHaveBeenCalledWith("bounds-changing", jasmine.any(Function));
        });

        it("removeListener calls underlying OpenFin window removeEventListener with unmapped event name", () => {
            const unmappedEvent = "closed";
            spyOn(win.innerWindow, "removeEventListener").and.callThrough()
            win.removeListener(unmappedEvent, () => { });
            expect(win.innerWindow.removeEventListener).toHaveBeenCalledWith(unmappedEvent, jasmine.any(Function));
        });
    });

    describe("window grouping", () => {
        it("allowGrouping is true", () => {
            expect(win.allowGrouping).toEqual(true);
        });

        it ("getGroup invokes underlying getGroup", async () => {
            spyOn(innerWin, "getGroup").and.callFake(resolve => {
                resolve([ win ] );
            });

            const windows = await win.getGroup();
            expect(innerWin.getGroup).toHaveBeenCalled();
            expect(windows).toBeDefined();
            expect(windows.length).toEqual(1);
        });

        it ("joinGroup invokes underlying joinGroup", async () => {
            spyOn(innerWin, "joinGroup").and.callFake((target, resolve) => resolve());
            const window = new OpenFinContainerWindow(new MockWindow("Fake"));
            await win.joinGroup(window);
            expect(innerWin.joinGroup).toHaveBeenCalledWith(window.innerWindow, jasmine.any(Function), jasmine.any(Function));
        });

        it ("joinGroup with source == target does not invoke joinGroup", async () => {
            spyOn(innerWin, "joinGroup").and.callFake((target, resolve) => resolve());
            await win.joinGroup(win);
            expect(innerWin.joinGroup).toHaveBeenCalledTimes(0);
        });

        it ("leaveGroup invokes underlying leaveGroup", async () => {
            spyOn(innerWin, "leaveGroup").and.callFake(resolve => resolve());
            await win.leaveGroup();
            expect(innerWin.leaveGroup).toHaveBeenCalled();
        });
    });

    it("bringToFront invokes underlying bringToFront", async () => {
        spyOn(innerWin, "bringToFront").and.callThrough();
        await win.bringToFront();
        expect(innerWin.bringToFront).toHaveBeenCalled();
    });
});

describe("OpenFinContainer", () => {
    let desktop: any;
    let container: OpenFinContainer;
    const globalWindow: any = {};

    beforeEach(() => {
        desktop = new MockDesktop();
        container = new OpenFinContainer(desktop, globalWindow);
    });

    it("hostType is OpenFin", () => {
        expect(container.hostType).toEqual("OpenFin");
    });

    it ("getInfo invokes underlying getRvmInfo and getRuntimeInfo", async () => {
        const system = jasmine.createSpyObj("system", ["getRvmInfo", "getRuntimeInfo", "log"]);
        system.getRvmInfo.and.callFake(f => f({ version: "1" }));
        system.getRuntimeInfo.and.callFake(f => f({ version: "2" }));
        Object.defineProperty(desktop, "System", { value: system });
        const info = await container.getInfo();
        expect(system.getRvmInfo).toHaveBeenCalledTimes(1);
        expect(system.getRuntimeInfo).toHaveBeenCalledTimes(1);
        expect(info).toEqual("RVM/1 Runtime/2");
    });

    it("ready invokes underlying main", async () => {
        spyOn(desktop, "main").and.callThrough();
        await container.ready();
        expect(desktop.main).toHaveBeenCalled();
    });

    describe("ctor options", () => {
        describe("registerUser", () => {
            let desktop;
            let app;

            beforeEach(() => {
                desktop = jasmine.createSpyObj("desktop", ["Application", "InterApplicationBus", "GlobalHotkey"]);
                app = jasmine.createSpyObj("application", ["getCurrent", "registerUser", "addEventListener", "setShortcuts"]);
                Object.defineProperty(desktop, "Application", { value: app });
                Object.defineProperty(desktop, "InterApplicationBus", { value: new MockInterApplicationBus() });
                app.getCurrent.and.returnValue(app);
            });

            it("options userName and appName to registerUser", () => {
                const container = new OpenFinContainer(desktop, null, { userName: "user", appName: "app" });
                expect(app.registerUser).toHaveBeenCalledWith("user", "app");
            });

            it("options missing userName does not invoke registerUser", () => {
                const container = new OpenFinContainer(desktop, null, { appName: "app" });
                expect(app.registerUser).toHaveBeenCalledTimes(0);
            });

            it("options missing userName does not invoke registerUser", () => {
                const container = new OpenFinContainer(desktop, null, { userName: "user" });
                expect(app.registerUser).toHaveBeenCalledTimes(0);
            });

            it("options missing userName and appName does not invoke registerUser", () => {
                const container = new OpenFinContainer(desktop, null, {});
                expect(app.registerUser).toHaveBeenCalledTimes(0);
            });

            it("options autoStartOnLogin to setShortcuts", () => {
                const container = new OpenFinContainer(desktop, null, { autoStartOnLogin: true });
                expect(app.setShortcuts).toHaveBeenCalledWith({ systemStartup: true });
            });

            it("options missing autoStartOnLogin does not invoke setShortcuts", () => {
                const container = new OpenFinContainer(desktop, null, { });
                expect(app.setShortcuts).toHaveBeenCalledTimes(0);
            });
        });
    });

    describe("log", () => {
        beforeEach(() => {
            Object.defineProperty(desktop, "System", { value: jasmine.createSpyObj("System", ["log"]) });
        });

        it("debug", () => {
            container.log("debug", "message");
            expect(desktop.System.log).toHaveBeenCalledWith("debug", "message", jasmine.any(Function), jasmine.any(Function));
        });

        it("info", () => {
            container.log("info", "message");
            expect(desktop.System.log).toHaveBeenCalledWith("info", "message", jasmine.any(Function), jasmine.any(Function));
        });

        it("warn", () => {
            container.log("warn", "message");
            expect(desktop.System.log).toHaveBeenCalledWith("warn", "message", jasmine.any(Function), jasmine.any(Function));
        });

        it("error", () => {
            container.log("error", "message");
            expect(desktop.System.log).toHaveBeenCalledWith("error", "message", jasmine.any(Function), jasmine.any(Function));
        });
    });

    it("getMainWindow returns wrapped inner window", async () => {
        const win: ContainerWindow = await container.getMainWindow();
        expect(win).toBeDefined();
        expect(win.innerWindow).toEqual(MockWindow.singleton);
    });

    it("getCurrentWindow returns wrapped inner window", async () => {
        const win: ContainerWindow = await container.getCurrentWindow();
        expect(win).toBeDefined();
        expect(win.innerWindow).toEqual(MockWindow.singleton);
    });

    describe("getWindowOptions", () => {
        it ("defaults autoShow on", () => {
            expect((<any>container).getWindowOptions({}).autoShow).toBeTruthy();
        });

        it ("defaults saveWindowState off", () => {
            expect((<any>container).getWindowOptions({}).saveWindowState).toBeFalsy();
        });
    });

    describe("createWindow", () => {
        beforeEach(() => {
            spyOn(desktop, "Window").and.callFake((options?: any, callback?: () => void) => { if (callback) { callback(); } });
        });

        it("defaults", async () => {
            const win = await container.createWindow("url");
            expect(win).toBeDefined();
            expect(desktop.Window).toHaveBeenCalledWith({ autoShow: true, url: "url", name: jasmine.stringMatching(/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/), customData: undefined }, jasmine.any(Function), jasmine.any(Function));
        });

        it("createWindow defaults", async () => {
            spyOn<any>(container, "ensureAbsoluteUrl").and.returnValue("absoluteIcon");
            const options = {
                x: "x",
                y: "y",
                height: "height",
                width: "width",
                taskbar: "taskbar",
                center: "center",
                icon: "icon",
                name: "name"
            }

            const win = await container.createWindow("url", options);
            expect(win).toBeDefined();
            expect(desktop.Window).toHaveBeenCalledWith(
                {
                    defaultLeft: "x",
                    defaultTop: "y",
                    defaultHeight: "height",
                    defaultWidth: "width",
                    showTaskbarIcon: "taskbar",
                    defaultCentered: "center",
                    icon: "absoluteIcon",
                    autoShow: true,
                    saveWindowState: false,
                    url: "url",
                    name: "name",
                    customData: JSON.stringify(options)
                },
                jasmine.any(Function),
                jasmine.any(Function)
            );
        });

        it("application window-created fires container window-created", (done) => {
            container.addListener("window-created", () => done());
            MockDesktop.application.emit('window-created', { name: "name" });
        });
    });

    describe("window management", () => {
        it("getAllWindows returns wrapped native windows", async () => {
            const windows = await container.getAllWindows();
            expect(windows).not.toBeNull();
            expect(windows.length).toEqual(3);
            expect(windows[0].innerWindow).toEqual(MockWindow.singleton);
        });

        describe("getWindow", () => {
            it("getWindowById returns wrapped window", async () => {
                const win = await container.getWindowById("Singleton");
                expect(win).toBeDefined();
                expect(win.id).toEqual("Singleton");
            });

            it ("getWindowById with unknown id returns null", async () => {
                const win = await container.getWindowById("DoesNotExist");
                expect(win).toBeNull();
            });

            it("getWindowByName returns wrapped window", async () => {
                const win = await container.getWindowByName("Singleton");
                expect(win).toBeDefined();
                expect(win.id).toEqual("Singleton");
            });

            it ("getWindowByName with unknown name returns null", async () => {
                const win = await container.getWindowByName("DoesNotExist");
                expect(win).toBeNull();
            });
        });

        it("closeAllWindows invokes window.close", async () => {
            spyOn(MockWindow.singleton, "close").and.callThrough();
            await (<any>container).closeAllWindows();
            expect(MockWindow.singleton.close).toHaveBeenCalled();
        });

        it("saveLayout invokes underlying saveLayoutToStorage", async () => {
            spyOn<any>(container, "saveLayoutToStorage").and.stub();
            const layout = await container.saveLayout("Test");
            expect(layout).toBeDefined();
            expect((<any>container).saveLayoutToStorage).toHaveBeenCalledWith("Test", layout);
        });

        it("buildLayout skips windows with persist false", async () => {
            const layout = await container.buildLayout();
            expect(layout).toBeDefined();
            expect(layout.windows.length).toEqual(2);
            expect(layout.windows[0].name === "Singleton");
        });

        it("setOptions allows the auto startup settings to be turned on", () => {
            const app = desktop.Application;
            const current = app.getCurrent();
            spyOn(app, "getCurrent").and.callThrough();
            spyOn(current, "setShortcuts").and.callThrough();
            container.setOptions({ autoStartOnLogin: true });
            expect(app.getCurrent).toHaveBeenCalled();
            expect(current.setShortcuts).toHaveBeenCalled();
        });

        it("getOptions returns autoStartOnLogin status", async () => {
            const app = desktop.Application;
            const current = app.getCurrent();
            spyOn(app, "getCurrent").and.callThrough();
            spyOn(current, "getShortcuts").and.callFake((callback) => callback({ systemStartup: true }));
            const result = await container.getOptions();
            expect(app.getCurrent).toHaveBeenCalled();
            expect(current.getShortcuts).toHaveBeenCalled();
            expect(result.autoStartOnLogin).toEqual(true);
        });

        it("getOptions error out while fetching auto start info", async () => {
            const app = desktop.Application;
            const current = app.getCurrent();
            spyOn(app, "getCurrent").and.callThrough();
            spyOn(current, "getShortcuts").and.callFake(() => {
                throw new Error("something went wrong");
            });
            await expectAsync(container.getOptions()).toBeRejectedWithError("Error getting Container options. Error: something went wrong");
            expect(app.getCurrent).toHaveBeenCalled();
            expect(current.getShortcuts).toHaveBeenCalled();
        });
    });

    describe("notifications", () => {
        it("showNotification passes message and invokes underlying notification api", () => {
            spyOn(desktop, "Notification").and.stub();
            container.showNotification("title", { body: "Test message", url: "notification.html" });
            expect(desktop.Notification).toHaveBeenCalledWith({ url: "notification.html", message: "Test message" });
        });

        it("requestPermission granted", async () => {
            await globalWindow["Notification"].requestPermission((permission) => {
                expect(permission).toEqual("granted");
            });
        });

        it("notification api delegates to showNotification", () => {
            spyOn(container, "showNotification");
            new globalWindow["Notification"]("title", { body: "Test message" });
            expect(container.showNotification).toHaveBeenCalled();
        });
    });

    it("getMenuHtml is non null and equal to static default", () => {
        expect((<any>container).getMenuHtml()).toEqual(OpenFinContainer.menuHtml);
    });

    it("getMenuItemHtml with icon has embedded icon in span", () => {
        const menuItem: MenuItem = { id: "ID", label: "Label", icon: "Icon" };
        const menuItemHtml: string = (<any>container).getMenuItemHtml(menuItem);
        expect(menuItemHtml).toEqual(`<li class="context-menu-item" onclick="fin.desktop.InterApplicationBus.send('uuid', null, 'TrayIcon_ContextMenuClick_${container.uuid}', { id: '${menuItem.id}' });this.close()"><span><img align="absmiddle" class="context-menu-image" src="${menuItem.icon}" /></span>Label</li>`);
    });

    it("getMenuItemHtml with no icon has nbsp; in span", () => {
        const menuItem: MenuItem = { id: "ID", label: "Label" };
        const menuItemHtml: string = (<any>container).getMenuItemHtml(menuItem);
        expect(menuItemHtml).toEqual(`<li class="context-menu-item" onclick="fin.desktop.InterApplicationBus.send('uuid', null, 'TrayIcon_ContextMenuClick_${container.uuid}', { id: '${menuItem.id}' });this.close()"><span>&nbsp;</span>Label</li>`);
    });

    it("addTrayIcon invokes underlying setTrayIcon", () => {
        spyOn(MockDesktop.application, "setTrayIcon").and.stub();
        container.addTrayIcon({ icon: 'icon', text: 'Text' }, () => { });
        expect(MockDesktop.application.setTrayIcon).toHaveBeenCalledWith("icon", jasmine.any(Function), jasmine.any(Function), jasmine.any(Function));
    });
});

describe("OpenFinMessageBus", () => {
    let mockBus: any;
    let bus: OpenFinMessageBus;

    function callback() { }

    beforeEach(() => {
        bus = new OpenFinMessageBus(<any>(mockBus = new MockInterApplicationBus()), "uuid");
    });

    it("subscribe invokes underlying subscribe", (done) => {
        spyOn(mockBus, "subscribe").and.callThrough();
        bus.subscribe("topic", callback).then((subscriber) => {
            expect(subscriber.listener).toEqual(jasmine.any(Function));
            spyOn(subscriber, "listener").and.callThrough();
            subscriber.listener();
            expect(subscriber.topic).toEqual("topic");
            expect(subscriber.listener).toHaveBeenCalled();
        }).then(done);
        expect(mockBus.subscribe).toHaveBeenCalledWith("*", undefined, "topic", jasmine.any(Function), jasmine.any(Function), jasmine.any(Function));
    });

    it("subscribe with options invokes underlying subscribe", async () => {
        spyOn(mockBus, "subscribe").and.callThrough();
        await bus.subscribe("topic", callback, { uuid: "uuid", name: "name" });
        expect(mockBus.subscribe).toHaveBeenCalledWith("uuid", "name", "topic", jasmine.any(Function), jasmine.any(Function), jasmine.any(Function));
    });

    it("unsubscribe invokes underlying unsubscribe", async () => {
        spyOn(mockBus, "unsubscribe").and.callThrough();
        await bus.unsubscribe({ topic: "topic", listener: callback });
        expect(mockBus.unsubscribe).toHaveBeenCalledWith("*", undefined, "topic", jasmine.any(Function), jasmine.any(Function), jasmine.any(Function));
    });

    it("unsubscribe with options invokes underlying unsubscribe", async () => {
        spyOn(mockBus, "unsubscribe").and.callThrough();
        const sub: MessageBusSubscription = new MessageBusSubscription("topic", callback, { uuid: "uuid", name: "name" });
        await bus.unsubscribe(sub);
        expect(mockBus.unsubscribe).toHaveBeenCalledWith("uuid", "name", "topic", jasmine.any(Function), jasmine.any(Function), jasmine.any(Function));
    });

    it("publish invokes underling publish", async () => {
        const message: any = {};
        spyOn(mockBus, "publish").and.callThrough();
        await bus.publish("topic", message);
        expect(mockBus.publish).toHaveBeenCalledWith("topic", message, jasmine.any(Function), jasmine.any(Function));
    });

    it("publish with optional uuid invokes underling send", async () => {
        const message: any = {};
        spyOn(mockBus, "send").and.callThrough();
        await bus.publish("topic", message, { uuid: "uuid" });
        expect(mockBus.send).toHaveBeenCalledWith("uuid", undefined, "topic", message, jasmine.any(Function), jasmine.any(Function));
    });

    it("publish with optional name invokes underling send", async () => {
        const message: any = {};
        spyOn(mockBus, "send").and.callThrough();
        await bus.publish("topic", message, { uuid: "uuid", name: "name" });
        expect(mockBus.send).toHaveBeenCalledWith("uuid", "name", "topic", message, jasmine.any(Function), jasmine.any(Function));
    });
});

describe("OpenFinDisplayManager", () => {
    let desktop;
    let app;
    let container;
    let system;
   
    beforeEach(() => {
        desktop = jasmine.createSpyObj("desktop", ["Application", "System", "InterApplicationBus", "GlobalHotkey"]);
        app = jasmine.createSpyObj("application", ["getCurrent", "addEventListener"]);
        system = jasmine.createSpyObj("system", ["getMonitorInfo", "getMousePosition"]);
        Object.defineProperty(desktop, "Application", { value: app });
        Object.defineProperty(desktop, "System", { value: system });
        Object.defineProperty(desktop, "InterApplicationBus", { value: new MockInterApplicationBus() });
        system.getMousePosition.and.callFake(callback => callback({ left: 1, top: 2 }));
        system.getMonitorInfo.and.callFake(callback => callback(
            {
                primaryMonitor: {
                    deviceId: "deviceId1",
                    name: "name1",
                    deviceScaleFactor: 1,
                    monitorRect: { left: 2, top: 3, right: 4, bottom: 5 },
                    availableRect: { left: 6, top: 7, right: 8, bottom: 9 }
                },
                nonPrimaryMonitors:
                    [
                        {
                            deviceId: "deviceId2",
                            name: "name2",
                            deviceScaleFactor: 1,
                            monitorRect: { left: 2, top: 3, right: 4, bottom: 5 },
                            availableRect: { left: 6, top: 7, right: 8, bottom: 9 }
                        }
                    ]
            }
        ));
        app.getCurrent.and.returnValue(app);

        container = new OpenFinContainer(desktop);
    });

    it("screen to be defined", () => {
        expect(container.screen).toBeDefined();
    });

    it("getPrimaryMonitor", async () => {
        const display = await container.screen.getPrimaryDisplay();
        expect(display).toBeDefined();
        expect(display.id).toBe("name1");
        expect(display.scaleFactor).toBe(1);
        
        expect(display.bounds.x).toBe(2);
        expect(display.bounds.y).toBe(3);
        expect(display.bounds.width).toBe(2);  // right - left
        expect(display.bounds.height).toBe(2); // bottom - top
        
        expect(display.workArea.x).toBe(6);
        expect(display.workArea.y).toBe(7);
        expect(display.workArea.width).toBe(2); // right - left
        expect(display.workArea.height).toBe(2); // bottom - top
    });

    it ("getAllDisplays", async () => {
        const displays = await container.screen.getAllDisplays();
        expect(displays).toBeDefined();
        expect(displays.length).toBe(2);
        expect(displays[0].id).toBe("name1");
        expect(displays[1].id).toBe("name2");
    });

    it ("getMousePosition", async () => {
        const point = await container.screen.getMousePosition();
        expect(point).toEqual({ x: 1, y: 2});
    });
});

describe("OpenfinGlobalShortcutManager", () => {
    let desktop;
    let container;

    beforeEach(() => {
        desktop = new MockDesktop()
    });

    it ("Unavailable in OpenFin is unavailable on container", () => {
        delete desktop.GlobalHotkey;
        spyOn(OpenFinContainer.prototype, "log").and.stub();
        const container = new OpenFinContainer(desktop);
        expect(container.globalShortcut).toBeUndefined();
        expect(OpenFinContainer.prototype.log).toHaveBeenCalledWith("warn","Global shortcuts require minimum OpenFin runtime of 9.61.32.34");
    });  

    describe("invokes underlying OpenFin", () => {
        beforeEach(() => {
            desktop.GlobalHotkey = jasmine.createSpyObj("GlobalHotKey", ["register", "unregister", "isRegistered", "unregisterAll"]);
            container = new OpenFinContainer(desktop);
        });

        it ("register", () => {
            container.globalShortcut.register("shortcut", () => {});
            expect(desktop.GlobalHotkey.register).toHaveBeenCalledWith("shortcut", jasmine.any(Function), jasmine.any(Function), jasmine.any(Function));
        });

        it ("unregister", () => {
            container.globalShortcut.unregister("shortcut");
            expect(desktop.GlobalHotkey.unregister).toHaveBeenCalledWith("shortcut", jasmine.any(Function), jasmine.any(Function));
        });

        it ("isRegistered", async () => {
            desktop.GlobalHotkey.isRegistered.and.callFake((shortcut, resolve, reject) => resolve(true));
            await container.globalShortcut.isRegistered("shortcut");
            expect(desktop.GlobalHotkey.isRegistered).toHaveBeenCalledWith("shortcut", jasmine.any(Function), jasmine.any(Function));
        });

        it ("unregisterAll", () => {
            container.globalShortcut.unregisterAll();
            expect(desktop.GlobalHotkey.unregisterAll).toHaveBeenCalledWith(jasmine.any(Function), jasmine.any(Function));
        }); 
    });
});