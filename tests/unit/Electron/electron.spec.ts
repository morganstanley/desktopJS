import { ElectronContainer, ElectronContainerWindow, ElectronMessageBus } from "../../../src/Electron/electron";
import { MessageBusSubscription } from "../../../src/ipc";

class MockWindow {
    public name: string;

    constructor(name?: string) {
        this.name = name;
    }

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

    public getAllWindows(): any { return [new MockWindow(), new MockWindow("target")]; }

    public webContents: any = {
        send(channel: string, ...args: any[]) { },
        getURL() { return "url"; }
    }

    public getBounds(): any { return { x: 0, y: 1, width: 2, height: 3 }; }

    public setBounds(bounds: {x: number, y: number, width: number, height: number}): void { }

    public addListener(eventName: string, listener: any): void { }
    
    public removeListener(eventName: string, listener: any): void { }
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

class MockIpc {
    public on(event: string | symbol, listener: Function) { return this; }
    public removeListener(event: string | symbol, listener: Function) { return this; };
    public send(channel: string, ...args: any[]) { }
    public sendSync(channel: string, ...args: any[]) { return {} };
}

describe("ElectronContainerWindow", () => {
    let innerWin: any;
    let win: ElectronContainerWindow;

    beforeEach(() => {
        innerWin = new MockWindow();
        win = new ElectronContainerWindow(innerWin);
    });

    it("Wrapped window is retrievable", () => {
        expect(win).toBeDefined();
        expect(win.containerWindow).toBeDefined();
        expect(win.containerWindow).toEqual(innerWin);
    });

    describe("Window members", () => {
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
            spyOn(innerWin, "isVisible").and.callThrough();
            let success: boolean = false;

            win.isShowing().then((showing) => {
                success = true;
                expect(showing).toBeDefined();
                expect(showing).toEqual(true);
            }).then(() => {
                expect(success).toEqual(true);
                expect(innerWin.isVisible).toHaveBeenCalled();
            }).then(done);
        });

        it("getSnapshot", (done) => {
            spyOn(innerWin, "capturePage").and.callThrough();
            let success: boolean = false;

            win.getSnapshot().then((snapshot) => {
                success = true;
                expect(snapshot).toBeDefined();
                expect(snapshot).toEqual("data:image/png;base64,Mock");
            }).then(() => {
                expect(success).toEqual(true);
                expect(innerWin.capturePage).toHaveBeenCalled();
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
            const bounds = { x: 0, y: 1, width: 2, height: 3 };
            win.setBounds(bounds).then(() => {
                expect(win.containerWindow.setBounds).toHaveBeenCalledWith(bounds);
            }).then(done);
        });

        it("addListener calls underlying Electron window addListener", () => {
            spyOn(win.containerWindow, "addListener").and.callThrough()
            win.addListener("move", () => {});
            expect(win.containerWindow.addListener).toHaveBeenCalledWith("move", jasmine.any(Function));
        });

        it("removeListener calls underlying Electron window removeListener", () => {
            spyOn(win.containerWindow, "removeListener").and.callThrough()
            win.removeListener("move", () => {});
            expect(win.containerWindow.removeListener).toHaveBeenCalledWith("move", jasmine.any(Function));
        });
    });
});

describe("ElectronContainer", () => {
    let electron: any;
    let container: ElectronContainer;
    let globalWindow: any = {};
    let windows: MockWindow[] = [new MockWindow(), new MockWindow()];

    beforeEach(() => {
        electron = {
            app: {},
            BrowserWindow: (options: any) => {
                return {
                    loadURL: (url: string) => { },
                }
            },
            Tray: (icon: string) => {
                return {
                    setToolTip: (text: string) => { },
                    setContextMenu: (menuItems: any) => { },
                    on: (event: string, listener: () => void) => { }
                }
            },
            Menu: {
                buildFromTemplate: (menuItems: any) => { }
            },
            require: (type: string) => { return {} },
            getCurrentWindow: () => { return windows[0]; }
        };
        container = new ElectronContainer(electron, new MockIpc(), globalWindow);
    });

    it("hostType is Electron", () => {
        expect(container.hostType).toEqual("Electron");
    });

    it("error during creation", () => {
        spyOn(console, "error");
        new ElectronContainer();
        expect(console.error).toHaveBeenCalledTimes(1);
    });

    it("electron members are copied", () => {
        expect((<any>container).app).toEqual(electron.app);
        expect((<any>container).browserWindow).toEqual(electron.BrowserWindow);
        expect((<any>container).tray).toEqual(electron.Tray);
        expect((<any>container).menu).toEqual(electron.Menu);
    });

    it("getMainWindow returns wrapped window", () => {
        const innerWin: any = new MockWindow();
        spyOn(electron, "getCurrentWindow").and.returnValue(innerWin);
        const win: ElectronContainerWindow = container.getMainWindow();

        expect(win).toBeDefined();
        expect(electron.getCurrentWindow).toHaveBeenCalled();
        expect(win.containerWindow).toEqual(innerWin);
    });

    it("getCurrentWindow returns wrapped inner getCurrentWindow", () => {
        const innerWin: any = new MockWindow();
        spyOn(electron, "getCurrentWindow").and.returnValue(innerWin);
        const win: ElectronContainerWindow = container.getCurrentWindow();

        expect(win).toBeDefined();
        expect(electron.getCurrentWindow).toHaveBeenCalled();
        expect(win.containerWindow).toEqual(innerWin);
    });

    it("createWindow", () => {
        spyOn<any>(container, "browserWindow").and.callThrough();
        container.createWindow("url", { x: "x", taskbar: false });
        expect((<any>container).browserWindow).toHaveBeenCalledWith({ x: "x", skipTaskbar: true });
    });

    it("addTrayIcon", () => {
        spyOn<any>(container, "tray").and.callThrough();
        container.addTrayIcon({ text: "text", icon: "icon" }, () => { }, [{ id: "id", label: "label", click: () => { } }]);
        expect((<any>container).tray).toHaveBeenCalled();
    });

    describe("notifications", () => {
        it("showNotification throws not implemented", () => {
            expect(() => container.showNotification("title", {})).toThrowError(TypeError);
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

    describe("window management", () => {
        beforeEach(() => {
            electron.BrowserWindow = {
                getAllWindows(): MockWindow[] { return windows; }
            };

            container = new ElectronContainer(electron, new MockIpc());
        });

        it("getAllWindows returns wrapped native windows", (done) => {
            container.getAllWindows().then(wins => {
                expect(wins).not.toBeNull();
                expect(wins.length).toEqual(windows.length);
                done();
            });
        });

        it("closeAllWindows excluding self skips current window", (done) => {
            spyOn(electron, "getCurrentWindow").and.callThrough();
            spyOn(windows[0], "close").and.callThrough();
            spyOn(windows[1], "close").and.callThrough();
            (<any>container).closeAllWindows(true).then(done).catch(error => {
                fail(error);
                done();
            });
            expect(electron.getCurrentWindow).toHaveBeenCalled();
            expect(windows[0].close).not.toHaveBeenCalled();
            expect(windows[1].close).toHaveBeenCalled();
        });

        it("closeAllWindows including self closes all", (done) => {
            spyOn(electron, "getCurrentWindow").and.callThrough();
            spyOn(windows[0], "close").and.callThrough();
            spyOn(windows[1], "close").and.callThrough();
            (<any>container).closeAllWindows().then(done);
            expect(electron.getCurrentWindow).not.toHaveBeenCalled();
            expect(windows[0].close).toHaveBeenCalled();
            expect(windows[1].close).toHaveBeenCalled();
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
                });;
        });
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

    it("subscribe invokes underlying subscribe", (done) => {
        spyOn(mockIpc, "on").and.callThrough();
        bus.subscribe("topic", callback).then((subscriber) => {
            expect(subscriber.listener).toEqual(jasmine.any(Function));
            expect(subscriber.topic).toEqual("topic");
        }).then(done);
        expect(mockIpc.on).toHaveBeenCalledWith("topic", jasmine.any(Function));
    });

    it("subscribe listener attached", (done) => {
        bus.subscribe("topic", callback).then((subscriber) => {
            spyOn(subscriber, "listener").and.callThrough();
            subscriber.listener();
            expect(subscriber.listener).toHaveBeenCalled();
        }).then(done);
    });

    it("unsubscribe invokes underlying unsubscribe", (done) => {
        spyOn(mockIpc, "removeListener").and.callThrough();
        bus.unsubscribe({ topic: "topic", listener: callback }).then(done);
        expect(mockIpc.removeListener).toHaveBeenCalledWith("topic", jasmine.any(Function));
    });

    it("publish invokes underling publish", (done) => {
        let message: any = {};
        spyOn(mockIpc, "send").and.callThrough();
        spyOn(mockWindow.webContents, "send").and.callThrough();
        bus.publish("topic", message).then(done);
        expect(mockIpc.send).toHaveBeenCalledWith("topic", message);
    });

    it("publish with optional name invokes underling send", (done) => {
        let message: any = {};
        bus.publish("topic", message, { name: "target" }).then(done);
    });
});