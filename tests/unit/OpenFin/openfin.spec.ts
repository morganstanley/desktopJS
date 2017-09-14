import { OpenFinContainer, OpenFinContainerWindow, OpenFinMessageBus } from "../../../src/OpenFin/openfin";
import { MessageBusSubscription } from "../../../src/ipc";
import { MenuItem } from "../../../src/menu";

class MockDesktop {
    public static application: any = {
        uuid: "uuid",
        getChildWindows(callback) { callback([MockWindow.singleton]); },
        setTrayIcon() { },
        getWindow() { return MockWindow.singleton; }
    }

    Window: any = MockWindow;
    Notification(): any { return {}; }
    InterApplicationBus(): any { return new MockInterApplicationBus(); }
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
    static singleton: MockWindow = new MockWindow();

    static getCurrent(): any { return MockWindow.singleton; }

    getParentWindow(): any { return MockWindow.singleton; }

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

    isShowing(callback: (showing: boolean) => void, error: (reason) => void): any {
        callback(true);
        return {};
    }

    getSnapshot(callback: (snapshot: string) => void, error: (reason) => void): any {
        callback("");
        return {};
    }

    getBounds(callback: (bounds: fin.WindowBounds) => void, error: (reason) => void): any {
        callback({ left: 0, top: 1, width: 2, height: 3 });
        return {};
    }

    setBounds(x: number, y: number, width: number, height: number, callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }

    getOptions(callback: (options: fin.WindowOptions) => void, error: (reason) => void): any {
        callback({ url: "url" });
        return {};
    }

    addEventListener(eventName: string, listener: any): void { }

    removeEventListener(eventName: string, listener: any): void { }
}

describe("OpenFinContainerWindow", () => {
    let innerWin: any;
    let win: OpenFinContainerWindow;

    beforeEach(() => {
        innerWin = new MockWindow;
        win = new OpenFinContainerWindow(innerWin);
    });

    it("Wrapped window is retrievable", () => {
        expect(win).toBeDefined();
        expect(win.containerWindow).toBeDefined();
        expect(win.containerWindow).toEqual(innerWin);
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
            spyOn(win.containerWindow, "setBounds").and.callThrough()
            win.setBounds({ x: 0, y: 1, width: 2, height: 3 }).then(() => {
                expect(win.containerWindow.setBounds).toHaveBeenCalledWith(0, 1, 2, 3, jasmine.any(Function), jasmine.any(Function));
            }).then(done);
        });

        describe("addListener", () => {
            it("addListener calls underlying OpenFin window addEventListener with mapped event name", () => {
                spyOn(win.containerWindow, "addEventListener").and.callThrough()
                win.addListener("move", () => { });
                expect(win.containerWindow.addEventListener).toHaveBeenCalledWith("bounds-changing", jasmine.any(Function));
            });

            it("addListener calls underlying OpenFin window addEventListener with unmapped event name", () => {
                const unmappedEvent = "closed";
                spyOn(win.containerWindow, "addEventListener").and.callThrough()
                win.addListener(unmappedEvent, () => { });
                expect(win.containerWindow.addEventListener).toHaveBeenCalledWith(unmappedEvent, jasmine.any(Function));
            });
        });

        describe("removeListener", () => {
            it("removeListener calls underlying OpenFin window removeEventListener with mapped event name", () => {
                spyOn(win.containerWindow, "removeEventListener").and.callThrough()
                win.removeListener("move", () => { });
                expect(win.containerWindow.removeEventListener).toHaveBeenCalledWith("bounds-changing", jasmine.any(Function));
            });

            it("removeListener calls underlying OpenFin window removeEventListener with unmapped event name", () => {
                const unmappedEvent = "closed";
                spyOn(win.containerWindow, "removeEventListener").and.callThrough()
                win.removeListener(unmappedEvent, () => { });
                expect(win.containerWindow.removeEventListener).toHaveBeenCalledWith(unmappedEvent, jasmine.any(Function));
            });
        });
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

    it("getMainWindow returns wrapped inner window", () => {
        const win: OpenFinContainerWindow = container.getMainWindow();
        expect(win).toBeDefined();
        expect(win.containerWindow).toEqual(MockWindow.singleton);
    });

    it("getCurrentWindow returns wrapped inner window", () => {
        const win: OpenFinContainerWindow = container.getCurrentWindow();
        expect(win).toBeDefined();
        expect(win.containerWindow).toEqual(MockWindow.singleton);
    });

    describe("createWindow", () => {
        beforeEach(() => {
            spyOn(desktop, "Window").and.stub();
        });

        it("defaults", () => {
            let win: OpenFinContainerWindow = container.createWindow("url");
            expect(win).toBeDefined();
            expect(desktop.Window).toHaveBeenCalledWith({ autoShow: true, url: "url", name: jasmine.stringMatching(/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/) });
        });

        it("createWindow defaults", () => {
            spyOn<any>(container, "ensureAbsoluteUrl").and.returnValue("absoluteIcon");

            let win: OpenFinContainerWindow = container.createWindow("url",
                {
                    x: "x",
                    y: "y",
                    height: "height",
                    width: "width",
                    taskbar: "taskbar",
                    center: "center",
                    icon: "icon",
                    name: "name"
                });

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
                    name: "name"
                }
            );
        });

        describe("window management", () => {
            it("getAllWindows returns wrapped native windows", (done) => {
                container.getAllWindows().then(windows => {
                    expect(windows).not.toBeNull();
                    expect(windows.length).toEqual(2);
                    expect(windows[0].containerWindow).toEqual(MockWindow.singleton);
                    done();
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