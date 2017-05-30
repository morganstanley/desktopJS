import { ElectronContainer, ElectronContainerWindow, ElectronMessageBus } from "../../../src/Electron/electron";
import { MessageBusSubscription } from "../../../src/ipc";

class MockWindow {
    public name: string;

    constructor(name?: string) {
        this.name = name;
    }

    public focus(): void { }
    public show(): void { }
    public hide(): void { }
    public isVisible(): boolean { return true; }
    public capturePage(callback: (snapshot: MockCapture) => void): any {
        callback(new MockCapture());
        return {};
    }

    public getParentWindow(): any { return undefined; }

    public getAllWindows(): any { return [new MockWindow(), new MockWindow("target")]; }

    public webContents: any = {
        send(channel: string, ...args: any[]) { }
    }
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
    });
});

describe("ElectronContainer", () => {
    let electron: any;
    let container: ElectronContainer;

    beforeEach(() => {
        electron = {
            app: {},
            BrowserWindow: (options: any) => {
                return {
                    loadURL: (url: string) => { }
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
            getCurrentWindow: () => { return {} }
        };
        container = new ElectronContainer(electron, new MockIpc());
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

    it("getCurrentWindow returns wrapped inner getCurrentWindow", () => {
        const innerWin: any = new MockWindow();
        spyOn(electron, "getCurrentWindow").and.returnValue(innerWin);
        const win: ElectronContainerWindow = container.getMainWindow();

        expect(win).toBeDefined();
        expect(win.containerWindow).toEqual(innerWin);
    });

    it("showWindow", () => {
        spyOn<any>(container, "browserWindow").and.callThrough();
        container.showWindow("url", { x: "x", taskbar: false });
        expect((<any>container).browserWindow).toHaveBeenCalledWith({ x: "x", skipTaskbar: true });
    });

    it("addTrayIcon", () => {
        spyOn<any>(container, "tray").and.callThrough();
        container.addTrayIcon({ text: "text", icon: "icon" }, () => { }, [{ id: "id", label: "label", click: () => { } }]);
        expect((<any>container).tray).toHaveBeenCalled();
    });

    describe("showNotification", () => {
        it("Throws Not implemented", () => {
            expect(() => container.showNotification({})).toThrowError(TypeError);
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