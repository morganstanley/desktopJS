import { ElectronContainer, ElectronContainerWindow } from "../../../src/Electron/electron";

class MockBrowserWindow {
    getParentWindow(): any {
        return undefined;
    }
}

class MockWindow {
    focus() { }
    show() { }
    hide() { }
    isVisible(): boolean { return true; }
    capturePage(callback: (snapshot: MockCapture) => void): any {
        callback(new MockCapture());
        return {};
    }
}

class MockCapture {
    toPNG(): any {
         return {
             toString(type: any) {
                 return "Mock";
             }
         };    
    }
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
        container = new ElectronContainer(electron);
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
        const innerWin: any = new MockBrowserWindow();
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