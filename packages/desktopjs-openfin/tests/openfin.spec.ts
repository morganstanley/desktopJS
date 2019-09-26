import {} from "jasmine";
import { OpenFinContainer, OpenFinContainerWindow, OpenFinMessageBus } from "../src/openfin";
import { ContainerWindow, MessageBusSubscription, MenuItem } from "@morgan-stanley/desktopjs";

class MockDesktop {
    public static application: any = {
        eventListeners: new Map(),
        uuid: "uuid",
        getChildWindows(callback) { callback([MockWindow.singleton, new MockWindow("Window2", JSON.stringify({ persist: false }))]); },
        setTrayIcon() { },
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
    main(callback): any { callback() };
    GlobalHotkey: any = { };
    Window: any = MockWindow;
    Notification(): any { return {}; }
    InterApplicationBus: any = new MockInterApplicationBus();
    Application: any = {
        getCurrent() {
            return MockDesktop.application;
        }
    }

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

    close(force: Boolean, callback: () => void, error: (reason) => void): any {
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

    it("load", (done) => {
        spyOn(innerWin, "navigate").and.callThrough();
        win.load("url").then(() => {
            expect(innerWin.navigate).toHaveBeenCalledWith("url", jasmine.any(Function), jasmine.any(Function));
        }).then(done);
    });

    it("focus", (done) => {
        spyOn(innerWin, "focus").and.callThrough();
        win.focus().then(() => {
            expect(innerWin.focus).toHaveBeenCalled();
        }).then(done);
    });

    it("show", (done) => {
        spyOn(innerWin, "show").and.callThrough();
        win.show().then(() => {
            expect(innerWin.show).toHaveBeenCalled();
        }).then(done);
    });

    it("hide", (done) => {
        spyOn(innerWin, "hide").and.callThrough();
        win.hide().then(() => {
            expect(innerWin.hide).toHaveBeenCalled();
        }).then(done);
    });

    it("close", (done) => {
        spyOn(innerWin, "close").and.callThrough();
        win.close().then(() => {
            expect(innerWin.close).toHaveBeenCalled();
        }).then(done);
    });

    it("minimize", (done) => {
        spyOn(innerWin, "minimize").and.callThrough();
        win.minimize().then(() => {
            expect(innerWin.minimize).toHaveBeenCalled();
        }).then(done);
    });

    it("maximize", (done) => {
        spyOn(innerWin, "maximize").and.callThrough();
        win.maximize().then(() => {
            expect(innerWin.maximize).toHaveBeenCalled();
        }).then(done);
    });

    it("restore", (done) => {
        spyOn(innerWin, "restore").and.callThrough();
        win.restore().then(() => {
            expect(innerWin.restore).toHaveBeenCalled();
        }).then(done);
    });
   
    it("isShowing", (done) => {
        spyOn(innerWin, "isShowing").and.callThrough();
        let success: boolean = false;

        win.isShowing().then((showing) => {
            success = true;
            expect(showing).toBeDefined();
            expect(showing).toEqual(true);
        }).then(() => {
            expect(success).toEqual(true);
            expect(innerWin.isShowing).toHaveBeenCalled();
        }).then(done);
    });


    describe("getState", () => {
        it("getState undefined", (done) => {
            let mockWindow = new MockWindow();
            delete (<any>mockWindow.nativeWindow).getState;
            let win = new OpenFinContainerWindow(innerWin);

            win.getState().then(state => {
                expect(state).toBeUndefined();
            }).then(done);
        });

        it("getState defined", (done) => {
            const mockState = { value: "Foo" };
            innerWin.nativeWindow.getState.and.returnValue(mockState);
    
            win.getState().then(state => {
                expect(innerWin.nativeWindow.getState).toHaveBeenCalled();
                expect(state).toEqual(mockState);
            }).then(done);
        });
        });        

    describe("setState", () => {
        it("setState undefined", (done) => {
            let mockWindow = new MockWindow();
            delete (<any>mockWindow.nativeWindow).setState;
            let win = new OpenFinContainerWindow(innerWin);

            win.setState({}).then(done);
        });

        it("setState defined", (done) => {
            const mockState = { value: "Foo" };
            innerWin.nativeWindow.setState.and.returnValue(Promise.resolve());
    
            win.setState(mockState).then(() => {
                expect(innerWin.nativeWindow.setState).toHaveBeenCalledWith(mockState);
            }).then(done);
        });
        });

    describe("getSnapshot", () => {
        it("getSnapshot invokes underlying getSnapshot", (done) => {
            spyOn(innerWin, "getSnapshot").and.callThrough();
            let success: boolean = false;

            win.getSnapshot().then((snapshot) => {
                success = true;
                expect(snapshot).toBeDefined();
                expect(snapshot).toEqual("data:image/png;base64,");
            }).then(() => {
                expect(success).toEqual(true);
                expect(innerWin.getSnapshot).toHaveBeenCalled();
            }).then(done);
        });

        it("getSnapshot propagates internal error to promise reject", (done) => {
            spyOn(innerWin, "getSnapshot").and.callFake((callback, reject) => reject("Error"));
            let success: boolean = false;

            win.getSnapshot().catch((error) => {
                success = true;
                expect(error).toBeDefined();
            }).then(() => {
                expect(success).toEqual(true);
            }).then(done);
        });

        it("getBounds retrieves underlying window position", (done) => {
            win.getBounds().then(bounds => {
                expect(bounds).toBeDefined();
                expect(bounds.x).toEqual(0);
                expect(bounds.y).toEqual(1);
                expect(bounds.width).toEqual(2);
                expect(bounds.height).toEqual(3);
            }).then(done);
        });

        it("setBounds sets underlying window position", (done) => {
            spyOn(win.innerWindow, "setBounds").and.callThrough()
            win.setBounds(<any> { x: 0, y: 1, width: 2, height: 3 }).then(() => {
                expect(win.innerWindow.setBounds).toHaveBeenCalledWith(0, 1, 2, 3, jasmine.any(Function), jasmine.any(Function));
            }).then(done);
        });

        it("flash enable invokes underlying flash", (done) => {
            spyOn(win.innerWindow, "flash").and.callThrough();
            win.flash(true).then(() => {
                expect(win.innerWindow.flash).toHaveBeenCalled();
                done();
            });
        });

        it("flash disable invokes underlying stopFlashing", (done) => {
            spyOn(win.innerWindow, "stopFlashing").and.callThrough();
            win.flash(false).then(() => {
                expect(win.innerWindow.stopFlashing).toHaveBeenCalled();
                done();
            });
        });

        describe("getOptions", () => {
            it("getOptions invokes underlying getOptions and returns undefined customData", (done) => {
                spyOn(win.innerWindow, "getOptions").and.callFake(callback => callback({ }));
                win.getOptions().then(options => {
                    expect(options).toBeUndefined();
                }).then(done);
            });

            it("getOptions invokes underlying getOptions and parses non-null customData", (done) => {
                spyOn(win.innerWindow, "getOptions").and.callFake(callback => callback({ customData: '{ "a": "foo"}' }));
                win.getOptions().then(options => {
                    expect(options).toBeDefined();
                    expect(options.a).toEqual("foo");
                }).then(done);
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

        it ("getGroup invokes underlying getGroup", (done) => {
            spyOn(innerWin, "getGroup").and.callFake(resolve => {
                resolve([ win ] );
            });

            win.getGroup().then(windows => {
                expect(innerWin.getGroup).toHaveBeenCalled();
                expect(windows).toBeDefined();
                expect(windows.length).toEqual(1);
            }).then(done);
        });

        it ("joinGroup invokes underlying joinGroup", (done) => {
            spyOn(innerWin, "joinGroup").and.callFake((target, resolve) => resolve());
            const window = new OpenFinContainerWindow(new MockWindow("Fake"));
            win.joinGroup(window).then(() => {
                expect(innerWin.joinGroup).toHaveBeenCalledWith(window.innerWindow, jasmine.any(Function), jasmine.any(Function));
            }).then(done);
        });

        it ("joinGroup with source == target does not invoke joinGroup", (done) => {
            spyOn(innerWin, "joinGroup").and.callFake((target, resolve) => resolve());
            win.joinGroup(win).then(() => {
                expect(innerWin.joinGroup).toHaveBeenCalledTimes(0);
            }).then(done);
        });

        it ("leaveGroup invokes underlying leaveGroup", (done) => {
            spyOn(innerWin, "leaveGroup").and.callFake(resolve => resolve());
            win.leaveGroup().then(() => {
                expect(innerWin.leaveGroup).toHaveBeenCalled();
            }).then(done);
        });
    });

    it("bringToFront invokes underlying bringToFront", (done) => {
        spyOn(innerWin, "bringToFront").and.callThrough();
        win.bringToFront().then(() => {
            expect(innerWin.bringToFront).toHaveBeenCalled();
        }).then(done);
    });
});

describe("OpenFinContainer", () => {
    let desktop: any;
    let container: OpenFinContainer;
    let globalWindow: any = {};

    beforeEach(() => {
        desktop = new MockDesktop();
        container = new OpenFinContainer(desktop, globalWindow);
    });

    it("hostType is OpenFin", () => {
        expect(container.hostType).toEqual("OpenFin");
    });

    it ("getInfo invokes underlying getRvmInfo and getRuntimeInfo", (done) => {
        const system = jasmine.createSpyObj("system", ["getRvmInfo", "getRuntimeInfo"]);
        system.getRvmInfo.and.callFake(f => f({ version: "1" }));
        system.getRuntimeInfo.and.callFake(f => f({ version: "2" }));
        Object.defineProperty(desktop, "System", { value: system });
        container.getInfo().then(info => {
            expect(system.getRvmInfo).toHaveBeenCalledTimes(1);
            expect(system.getRuntimeInfo).toHaveBeenCalledTimes(1);
            expect(info).toEqual("RVM/1 Runtime/2");
        }).then(done);
    });

    it("ready invokes underlying main", (done) => {
        spyOn(desktop, "main").and.callThrough();
        container.ready().then(() => {
            expect(desktop.main).toHaveBeenCalled();
        }).then(done);
    });

    describe("ctor options", () => {
        describe("registerUser", () => {
            let desktop;
            let app;

            beforeEach(() => {
                desktop = jasmine.createSpyObj("desktop", ["Application", "InterApplicationBus", "GlobalHotkey"]);
                app = jasmine.createSpyObj("application", ["getCurrent", "registerUser", "addEventListener"]);
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
            spyOn(desktop, "Window").and.callFake((options?: any, callback?: Function) => { if (callback) { callback(); } });
        });

        it("defaults", (done) => {
            container.createWindow("url").then(win => {
                expect(win).toBeDefined();
                expect(desktop.Window).toHaveBeenCalledWith({ autoShow: true, url: "url", name: jasmine.stringMatching(/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/), customData: undefined }, jasmine.any(Function), jasmine.any(Function));
                done();
            });
        });

        it("createWindow defaults", (done) => {
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

            container.createWindow("url", options).then(win => {
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
                    done();
                });
        });

        it("application window-created fires container window-created", (done) => {
            container.addListener("window-created", () => done());
            MockDesktop.application.emit('window-created', { name: "name" });
        });
    });

    describe("window management", () => {
        it("getAllWindows returns wrapped native windows", (done) => {
            container.getAllWindows().then(windows => {
                expect(windows).not.toBeNull();
                expect(windows.length).toEqual(3);
                expect(windows[0].innerWindow).toEqual(MockWindow.singleton);
                done();
            });
        });

        describe("getWindow", () => {
            it("getWindowById returns wrapped window", (done) => {
                container.getWindowById("Singleton").then(win => {
                    expect(win).toBeDefined();
                    expect(win.id).toEqual("Singleton");
                    done();
                });
            });

            it ("getWindowById with unknown id returns null", (done) => {
                container.getWindowById("DoesNotExist").then(win => {
                    expect(win).toBeNull();
                    done();
                });
            });

            it("getWindowByName returns wrapped window", (done) => {
                container.getWindowByName("Singleton").then(win => {
                    expect(win).toBeDefined();
                    expect(win.id).toEqual("Singleton");
                    done();
                });
            });

            it ("getWindowByName with unknown name returns null", (done) => {
                container.getWindowByName("DoesNotExist").then(win => {
                    expect(win).toBeNull();
                    done();
                });
            });
        });

        it("closeAllWindows invokes window.close", (done) => {
            spyOn(MockWindow.singleton, "close").and.callThrough();
            (<any>container).closeAllWindows().then(done).catch(error => {
                fail(error);
                done();
            });;
            expect(MockWindow.singleton.close).toHaveBeenCalled();
        });

        it("saveLayout invokes underlying saveLayoutToStorage", (done) => {
            spyOn<any>(container, "saveLayoutToStorage").and.stub();
            container.saveLayout("Test")
                .then(layout => {
                    expect(layout).toBeDefined();
                    expect((<any>container).saveLayoutToStorage).toHaveBeenCalledWith("Test", layout);
                    done();
                }).catch(error => {
                    fail(error);
                    done();
                });
        });

        it("buildLayout skips windows with persist false", (done) => {
            container.buildLayout().then(layout => {
                expect(layout).toBeDefined();
                expect(layout.windows.length).toEqual(2);
                expect(layout.windows[0].name === "Singleton")
            }).then(done);
        });
    });    

    describe("notifications", () => {
        it("showNotification passes message and invokes underlying notification api", () => {
            spyOn(desktop, "Notification").and.stub();
            container.showNotification("title", { body: "Test message", url: "notification.html" });
            expect(desktop.Notification).toHaveBeenCalledWith({ url: "notification.html", message: "Test message" });
        });

        it("requestPermission granted", (done) => {
            globalWindow["Notification"].requestPermission((permission) => {
                expect(permission).toEqual("granted");
            }).then(done);
        });

        it("notification api delegates to showNotification", () => {
            spyOn(container, "showNotification").and.stub();
            new globalWindow["Notification"]("title", { body: "Test message" });
            expect(container.showNotification).toHaveBeenCalled();;
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

    it("subscribe with options invokes underlying subscribe", (done) => {
        spyOn(mockBus, "subscribe").and.callThrough();
        bus.subscribe("topic", callback, { uuid: "uuid", name: "name" }).then(done);
        expect(mockBus.subscribe).toHaveBeenCalledWith("uuid", "name", "topic", jasmine.any(Function), jasmine.any(Function), jasmine.any(Function));
    });

    it("unsubscribe invokes underlying unsubscribe", (done) => {
        spyOn(mockBus, "unsubscribe").and.callThrough();
        bus.unsubscribe({ topic: "topic", listener: callback }).then(done);
        expect(mockBus.unsubscribe).toHaveBeenCalledWith("*", undefined, "topic", jasmine.any(Function), jasmine.any(Function), jasmine.any(Function));
    });

    it("unsubscribe with options invokes underlying unsubscribe", (done) => {
        spyOn(mockBus, "unsubscribe").and.callThrough();
        const sub: MessageBusSubscription = new MessageBusSubscription("topic", callback, { uuid: "uuid", name: "name" });
        bus.unsubscribe(sub).then(done);
        expect(mockBus.unsubscribe).toHaveBeenCalledWith("uuid", "name", "topic", jasmine.any(Function), jasmine.any(Function), jasmine.any(Function));
    });

    it("publish invokes underling publish", (done) => {
        let message: any = {};
        spyOn(mockBus, "publish").and.callThrough();
        bus.publish("topic", message).then(done);
        expect(mockBus.publish).toHaveBeenCalledWith("topic", message, jasmine.any(Function), jasmine.any(Function));
    });

    it("publish with optional uuid invokes underling send", (done) => {
        let message: any = {};
        spyOn(mockBus, "send").and.callThrough();
        bus.publish("topic", message, { uuid: "uuid" }).then(done);
        expect(mockBus.send).toHaveBeenCalledWith("uuid", undefined, "topic", message, jasmine.any(Function), jasmine.any(Function));
    });

    it("publish with optional name invokes underling send", (done) => {
        let message: any = {};
        spyOn(mockBus, "send").and.callThrough();
        bus.publish("topic", message, { uuid: "uuid", name: "name" }).then(done);
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

    it("getPrimaryMonitor", (done) => {
        container.screen.getPrimaryDisplay().then(display => {
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
        }).then(done);
    });

    it ("getAllDisplays", (done) => {
        container.screen.getAllDisplays().then(displays => {
            expect(displays).toBeDefined();
            expect(displays.length).toBe(2);
            expect(displays[0].id).toBe("name1");
            expect(displays[1].id).toBe("name2");
        }).then(done);
    });

    it ("getMousePosition", (done) => {
        container.screen.getMousePosition().then(point => {
            expect(point).toEqual({ x: 1, y: 2});
        }).then(done);
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
        spyOn(console, "warn").and.stub();
        const container = new OpenFinContainer(desktop);
        expect(container.globalShortcut).toBeUndefined();
        expect(console.warn).toHaveBeenCalledWith("Global shortcuts require minimum OpenFin runtime of 9.61.32.34");
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

        it ("isRegistered", (done) => {
            desktop.GlobalHotkey.isRegistered.and.callFake((shortcut, resolve, reject) => resolve(true));
            container.globalShortcut.isRegistered("shortcut").then(() => {
                expect(desktop.GlobalHotkey.isRegistered).toHaveBeenCalledWith("shortcut", jasmine.any(Function), jasmine.any(Function));
            }).then(done);
        });

        it ("unregisterAll", () => {
            container.globalShortcut.unregisterAll();
            expect(desktop.GlobalHotkey.unregisterAll).toHaveBeenCalledWith(jasmine.any(Function), jasmine.any(Function));
        }); 
    });
});