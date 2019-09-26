import {} from "jasmine";
import { ElectronContainer, ElectronContainerWindow, ElectronMessageBus, ElectronWindowManager } from "../src/electron";
import {  ContainerWindow, Container } from "@morgan-stanley/desktopjs";

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
            // @ts-ignore
            listener(...eventArgs);
        }
    }    
}

class MockWindow extends MockEventEmitter {
    public name: string;
    public id: number;
    public group: string;
    private bounds: any = { x: 0, y: 1, width: 2, height: 3 }

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

    public getAllWindows(): any { return [new MockWindow(), new MockWindow("target")]; }

    public webContents: any = {
        send(channel: string, ...args: any[]) { },
        getURL() { return "url"; },
        executeJavaScript() {}
    }

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
    public sendSync(channel: string, ...args: any[]) { return {} };
    public send(channel: string, ...args: any[]) { }
}

describe("ElectronContainerWindow", () => {
    let innerWin: any;
    let win: ElectronContainerWindow;
    let container: ElectronContainer;

    beforeEach(() => {
        innerWin = new MockWindow();
        container = new ElectronContainer({ BrowserWindow: { fromId(): any {  } } }, new MockIpc(), {});
        win = new ElectronContainerWindow(innerWin, container);
    });

    it("Wrapped window is retrievable", () => {
        expect(win).toBeDefined();
        expect(win.innerWindow).toBeDefined();
        expect(win.innerWindow).toEqual(innerWin);
    });

    it ("id returns underlying id", () => {
        innerWin.id = "ID";
        expect(win.id).toEqual("ID");
    });

    it ("name returns underlying name", () => {
        innerWin.name = "NAME";
        expect(win.name).toEqual("NAME");
    });

    describe("Window members", () => {
        it("load", (done) => {
            spyOn(innerWin, "loadURL").and.callThrough();
            win.load("url").then(() => {
                expect(innerWin.loadURL).toHaveBeenCalledWith("url");
            }).then(done);
        });

        it("load with options", (done) => {
            spyOn(innerWin, "loadURL").and.callThrough();
            const options = { prop: "value" };
            win.load("url", options).then(() => {
                expect(innerWin.loadURL).toHaveBeenCalledWith("url", options);
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
            const browserWindow = jasmine.createSpyObj("BrowserWindow", ["minimize"]);
            new ElectronContainerWindow(browserWindow, null).minimize().then(() => {
                expect(browserWindow.minimize).toHaveBeenCalledTimes(1);
            }).then(done);
        });

        it("maximize", (done) => {
            const browserWindow = jasmine.createSpyObj("BrowserWindow", ["maximize"]);
            new ElectronContainerWindow(browserWindow, null).maximize().then(() => {
                expect(browserWindow.maximize).toHaveBeenCalledTimes(1);
            }).then(done);
        });
        
        it("restore", (done) => {
            const browserWindow = jasmine.createSpyObj("BrowserWindow", ["restore"]);
            new ElectronContainerWindow(browserWindow, null).restore().then(() => {
                expect(browserWindow.restore).toHaveBeenCalledTimes(1);
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

        describe("getState", () => {
            it("getState undefined", (done) => {
                let mockWindow = new MockWindow();
                mockWindow.webContents = null;
                let win = new ElectronContainerWindow(mockWindow, container);

                win.getState().then(state => {
                    expect(state).toBeUndefined();
                }).then(done);
            });

            it("getState defined", (done) => {
                const mockState = { value: "Foo" };
                spyOn(innerWin.webContents, "executeJavaScript").and.returnValue(Promise.resolve(mockState));
                
                win.getState().then(state => {
                    expect(innerWin.webContents.executeJavaScript).toHaveBeenCalled();
                    expect(state).toEqual(mockState);
                }).then(done);
            });
        });        
    
        describe("setState", () => {
            it("setState undefined", (done) => {
                let mockWindow = new MockWindow();
                mockWindow.webContents = null;
                let win = new ElectronContainerWindow(mockWindow, container);

                win.setState({}).then(done);
            });

            it("setState defined", (done) => {
                const mockState = { value: "Foo" };
                spyOn(innerWin.webContents, "executeJavaScript").and.returnValue(Promise.resolve());

                win.setState(mockState).then(() => {
                    expect(innerWin.webContents.executeJavaScript).toHaveBeenCalled();
                }).then(done);  
            });
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
            spyOn(win.innerWindow, "setBounds").and.callThrough()
            const bounds = { x: 0, y: 1, width: 2, height: 3 };
            win.setBounds(<any>bounds).then(() => {
                expect(win.innerWindow.setBounds).toHaveBeenCalledWith(bounds);
            }).then(done);
        });

        it("flash enable invokes underlying flash", (done) => {
            spyOn(win.innerWindow, "flashFrame").and.callThrough();
            win.flash(true).then(() => {
                expect(win.innerWindow.flashFrame).toHaveBeenCalledWith(true);
                done();
            });
        });

        it("flash disable invokes underlying stopFlashing", (done) => {
            spyOn(win.innerWindow, "flashFrame").and.callThrough();
            win.flash(false).then(() => {
                expect(win.innerWindow.flashFrame).toHaveBeenCalledWith(false);
                done();
            });
        });

        it ("getOptions sends synchronous ipc message", (done) => {
            spyOn(container.internalIpc, "sendSync").and.returnValue({ foo: "bar"});
            spyOnProperty(win, "id", "get").and.returnValue(5);
            spyOn(container, "wrapWindow").and.returnValue(new MockWindow());
            spyOn(container.browserWindow, "fromId").and.returnValue(innerWin);

            win.getOptions().then(options => {
                expect(container.internalIpc.sendSync).toHaveBeenCalledWith("desktopJS.window-getOptions", { source: 5});
                expect(options).toEqual({ foo: "bar" });
            }).then(done);
        });

        describe("addListener", () => {
            it("calls underlying Electron window addListener", () => {
                spyOn(win.innerWindow, "addListener").and.callThrough()
                win.addListener("move", () => {});
                expect(win.innerWindow.addListener).toHaveBeenCalledWith("move", jasmine.any(Function));
            });
    
            describe("beforeunload", () => {
                it ("beforeunload attaches to underlying dom window", () => {
                    var window = jasmine.createSpyObj("window", ["addEventListener"]);
                    spyOn(container, "getCurrentWindow").and.returnValue({ id: 1});
                    win = new ElectronContainerWindow(innerWin, container, window);
                    spyOnProperty(win, "id", "get").and.returnValue(1);
                    win.addListener("beforeunload", () => {});
                    expect(window.addEventListener).toHaveBeenCalledWith("beforeunload", jasmine.any(Function));
                });
    
                it ("beforeunload throws error if not current window", () => {
                    var window = jasmine.createSpyObj("window", ["addEventListener"]);
                    spyOn(container, "getCurrentWindow").and.returnValue({ id: 2});
                    win = new ElectronContainerWindow(innerWin, container, window);
                    spyOnProperty(win, "id", "get").and.returnValue(1);
                    expect(() => {win.addListener("beforeunload", () => {})}).toThrowError("Event handler for 'beforeunload' can only be added on current window");
                });
            });
        });

        it("removeListener calls underlying Electron window removeListener", () => {
            spyOn(win.innerWindow, "removeListener").and.callThrough()
            win.removeListener("move", () => {});
            expect(win.innerWindow.removeListener).toHaveBeenCalledWith("move", jasmine.any(Function));
        });

        it("nativeWindow returns window", () => {
            var window = {};
            const win = new ElectronContainerWindow(innerWin, container, <any>window);
            expect(win.nativeWindow).toEqual(<any>window);
        });
    });

    describe("window grouping", () => {
        it("allowGrouping is true", () => {
            expect(win.allowGrouping).toEqual(true);
        });

        it ("getGroup sends synchronous ipc message", (done) => {
            spyOn(container.internalIpc, "sendSync").and.returnValue([ 1, 5, 2 ]);
            spyOnProperty(win, "id", "get").and.returnValue(5);
            spyOn(container, "wrapWindow").and.returnValue(new MockWindow());
            spyOn(container.browserWindow, "fromId").and.returnValue(innerWin);

            win.getGroup().then(windows => {
                expect(container.internalIpc.sendSync).toHaveBeenCalledWith("desktopJS.window-getGroup", { source: 5});
                expect(container.wrapWindow).toHaveBeenCalledTimes(2);
                expect(windows.length).toEqual(3);
            }).then(done);
        });

        it ("getGroup invokes method directly in main process", () => {
            container = new ElectronContainer({ BrowserWindow: { fromId(): any {  } } }, new MockMainIpc(), {});
            win = new ElectronContainerWindow(innerWin, container);
            (<any>container).windowManager = jasmine.createSpyObj("WindowManager", ["getGroup"]);
            (<any>container).windowManager.getGroup.and.returnValue([]);
            win.getGroup();
            expect((<any>container).windowManager.getGroup).toHaveBeenCalled();
        });

        it ("joinGroup sends ipc message", (done) => {
            spyOn(container.internalIpc, "send").and.callThrough();
            spyOnProperty(win, "id", "get").and.returnValue(1);
            const targetWin = new ElectronContainerWindow(innerWin, container);
            spyOnProperty(targetWin, "id", "get").and.returnValue(2);

            win.joinGroup(targetWin).then(() => {
                expect(container.internalIpc.send).toHaveBeenCalledWith("desktopJS.window-joinGroup", { source: 1, target: 2 });
            }).then(done);
        });

        it ("joinGroup with source == target does not send ipc message", (done) => {
            spyOn(container.internalIpc, "send").and.callThrough();
            spyOnProperty(win, "id", "get").and.returnValue(1);
            const targetWin = new ElectronContainerWindow(innerWin, container);
            spyOnProperty(targetWin, "id", "get").and.returnValue(1);

            win.joinGroup(targetWin).then(() => {
                expect(container.internalIpc.send).toHaveBeenCalledTimes(0);
            }).then(done);
        });

        it ("joinGroup invokes method directly in main process", () => {
            container = new ElectronContainer({ BrowserWindow: { fromId(): any {  } } }, new MockMainIpc(), {});
            win = new ElectronContainerWindow(innerWin, container);
            (<any>container).windowManager = jasmine.createSpyObj("WindowManager", ["groupWindows"]);
            const targetWin = new ElectronContainerWindow(innerWin, container);
            spyOnProperty(targetWin, "id", "get").and.returnValue(2);
            win.joinGroup(targetWin);
            expect((<any>container).windowManager.groupWindows).toHaveBeenCalled();
        });

        it ("leaveGroup sends ipc message", (done) => {
            spyOn(container.internalIpc, "send").and.callThrough();
            spyOnProperty(win, "id", "get").and.returnValue(5);
            win.leaveGroup().then(() => {
                expect(container.internalIpc.send).toHaveBeenCalledWith("desktopJS.window-leaveGroup", { source: 5});
            }).then(done);
        });

        it ("leaveGroup invokes method directly in main process", () => {
            container = new ElectronContainer({ BrowserWindow: { fromId(): any {  } } }, new MockMainIpc(), {});
            win = new ElectronContainerWindow(innerWin, container);
            (<any>container).windowManager = jasmine.createSpyObj("WindowManager", ["ungroupWindows"]);
            win.leaveGroup();
            expect((<any>container).windowManager.ungroupWindows).toHaveBeenCalled();
        });
    });

    it ("bringToFront invokes underlying moveTop", (done) => {
        spyOn(win.innerWindow, "moveTop").and.callThrough()
        win.bringToFront().then(() => {
            expect(innerWin.moveTop).toHaveBeenCalled();
        }).then(done);
    });
});

describe("ElectronContainer", () => {
    let electron: any;
    let container: ElectronContainer;
    let globalWindow: any = {};
    let windows: MockWindow[];

    beforeEach(() => {
        windows = [new MockWindow(), new MockWindow("Name")];

        electron = {
            app: new MockEventEmitter(),
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
            Notification: (options: any) => {
                return {
                    show: () => {},
                    addListener: () => {},
                    once: () => {}
                }
            },
            require: (type: string) => { return {} },
            getCurrentWindow: () => { return windows[0]; },
            process: { versions: { electron: "1", chrome: "2" } }
        };
        container = new ElectronContainer(electron, new MockIpc(), globalWindow);
    });

    it("hostType is Electron", () => {
        expect(container.hostType).toEqual("Electron");
    });

    it ("getInfo invokes underlying version info", (done) => {
        container.getInfo().then(info => {
            expect(info).toEqual("Electron/1 Chrome/2");
        }).then(done);
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

    it("getMainWindow returns wrapped window marked as main", async () => {
        const innerWin: any = new MockWindow();

        container.browserWindow = {
            getAllWindows(): MockWindow[] { return windows; },
            fromId(): any {  }
        };

        windows[1][Container.windowOptionsPropertyKey] = { main: true };

        spyOn(container.browserWindow, "fromId").and.returnValue(innerWin);

        const win: ContainerWindow = await container.getMainWindow();

        expect(win).toBeDefined();
        expect(win.innerWindow).toEqual(windows[1]);
        expect(container.browserWindow.fromId).toHaveBeenCalledTimes(0);
    });

    it("getMainWindow with no defined main returns first wrapped window", async () => {
        const innerWin: any = new MockWindow();

        container.browserWindow = {
            getAllWindows(): MockWindow[] { return windows; },
            fromId(): any {  }
        };

        spyOn(container.browserWindow, "fromId").and.returnValue(innerWin);

        const win: ContainerWindow = await container.getMainWindow();

        expect(win).toBeDefined();
        expect(win.innerWindow).toEqual(innerWin);
        expect(container.browserWindow.fromId).toHaveBeenCalledWith(1);
    });

    it("getCurrentWindow returns wrapped inner getCurrentWindow", async () => {
        const innerWin: any = new MockWindow();
        spyOn(electron, "getCurrentWindow").and.returnValue(innerWin);
        const win: ContainerWindow = await container.getCurrentWindow();

        expect(win).toBeDefined();
        expect(electron.getCurrentWindow).toHaveBeenCalled();
        expect(win.innerWindow).toEqual(innerWin);
    });

    it("createWindow", (done) => {
        spyOn<any>(container, "browserWindow").and.callThrough();
        container.createWindow("url", { x: "x", taskbar: false, node: true }).then(done);
        expect((<any>container).browserWindow).toHaveBeenCalledWith({ x: "x", skipTaskbar: true, webPreferences: { nodeIntegration: true } });
    });

    it("createWindow fires window-created", (done) => {
        container.addListener("window-created", () => done());
        container.createWindow("url");
    });

    it("app browser-window-created fires Container window-created", (done) => {
        new ElectronContainer(electron, new MockMainIpc(), globalWindow, { isRemote: false });
        ContainerWindow.addListener("window-created", () => done());
        electron.app.emit("browser-window-created", {}, { webContents: {id: "id"}});
    });

    it("createWindow on main process invokes ElectronWindowManager.initializeWindow", (done) => {
        (<any>container).isRemote = false;
        (<any>container).windowManager = new ElectronWindowManager({}, new MockMainIpc(), { fromId(): any {}, getAllWindows(): any {} })
        spyOn((<any>container).windowManager, "initializeWindow").and.callThrough();
        const options = { name: "name" };
        container.createWindow("url", options).then(done);
        expect((<any>container).windowManager.initializeWindow).toHaveBeenCalledWith(jasmine.any(Object), "name", options);
    });

    it("createWindow pulls nodeIntegration default from container", (done) => {
        const container = new ElectronContainer(electron, new MockIpc(), globalWindow, { node: true });
        spyOn<any>(container, "browserWindow").and.callThrough();
        container.createWindow("url", { }).then(() => {
            expect(container.browserWindow).toHaveBeenCalledWith({ webPreferences: { nodeIntegration: true }});
        }).then(done);
    });

    it("createWindow with node specified ignores container default", (done) => {
        const container = new ElectronContainer(electron, new MockIpc(), globalWindow, { node: true });
        spyOn<any>(container, "browserWindow").and.callThrough();
        container.createWindow("url", { node: false }).then(() => {
            expect(container.browserWindow).toHaveBeenCalledWith({ webPreferences: { nodeIntegration: false }});
        }).then(done);
    });

    it("addTrayIcon", () => {
        spyOn<any>(container, "tray").and.callThrough();
        container.addTrayIcon({ text: "text", icon: "icon" }, () => { }, [{ id: "id", label: "label", click: () => { } }]);
        expect((<any>container).tray).toHaveBeenCalled();
    });

    describe("notifications", () => {
        it("showNotification delegates to electron notification", () => {
            spyOn(electron, "Notification").and.callThrough();
            container.showNotification("title", <any> { onClick: () => {}, notification: { } });
            expect(electron.Notification).toHaveBeenCalledWith({ title: "title", onClick: jasmine.any(Function), notification: jasmine.any(Object) });
        });

        it("requestPermission granted", (done) => {
            globalWindow["Notification"].requestPermission((permission) => {
                expect(permission).toEqual("granted");
            }).then(done);
        });

        it("notification api delegates to showNotification", () => {
            spyOn(container, "showNotification").and.stub();
            new globalWindow["Notification"]("title", { body: "Test message" });
            expect(container.showNotification).toHaveBeenCalled();
        });
    });

    describe("window management", () => {
        beforeEach(() => {
            electron.BrowserWindow = {
                getAllWindows(): MockWindow[] { return windows; },
                fromId(): any {  }
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

        describe("getWindow", () => {
            it("getWindowById returns wrapped window", (done) => {
                spyOn(electron.BrowserWindow, "fromId").and.returnValue(new MockWindow());
                container.getWindowById("1").then(win => {
                    expect(electron.BrowserWindow.fromId).toHaveBeenCalledWith("1");
                    expect(win).toBeDefined();
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
                container.getWindowByName("Name").then(win => {
                    expect(win).toBeDefined();
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
            container.browserWindow = {
                getAllWindows(): MockWindow[] { return windows; },
                fromId(): any { return {}; }
            };

            spyOn<any>(container.internalIpc, "sendSync").and.returnValue([ 1, 5, 2 ]);
            spyOn<any>(container, "saveLayoutToStorage").and.stub();
            spyOn<any>(container, "getMainWindow").and.returnValue(new MockWindow());
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
            const win1 = jasmine.createSpyObj(["getOptions", "getGroup", "getState"]);
            Object.defineProperty(win1, "innerWindow", {
                value: { name: "win1", "desktopJS-options": { main: true }, "webContents": { getURL() { return "" } }, getBounds() { return undefined } }
            });
            win1.getGroup.and.returnValue(Promise.resolve([]));
            win1.getState.and.returnValue(Promise.resolve(undefined));
            const win2 = jasmine.createSpyObj(["getOptions", "getGroup", "getState"]);
            Object.defineProperty(win2, "innerWindow", {
                value: { name: "win2", "desktopJS-options": { persist: false }, "webContents": { getURL() { return "" } }, getBounds() { return undefined } }
            });
            win2.getGroup.and.returnValue(Promise.resolve([]));
            win2.getState.and.returnValue(Promise.resolve(undefined));
            spyOn(container, "getMainWindow").and.returnValue(win1);
            spyOn(container, "getAllWindows").and.returnValue(Promise.resolve([win1, win2]));
            container.buildLayout().then(layout => {
                expect(layout).toBeDefined();
                expect(layout.windows.length).toEqual(1);
                expect(layout.windows[0].name === "win1")
            }).then(done);
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

    it("publish in main invokes callback in main", () => {
        const message: any = {};
        const ipc = new MockMainIpc();
        spyOn(ipc, "listeners").and.callThrough();
        const localBus = new ElectronMessageBus(<any> ipc, mockWindow);
        localBus.publish("topic", message);
        expect(ipc.listeners).toHaveBeenCalledWith("topic");
    });

    it("publish with optional name invokes underling send", (done) => {
        let message: any = {};
        bus.publish("topic", message, { name: "target" }).then(done);
    });
});

describe("ElectronWindowManager", () => {
    let mgr: ElectronWindowManager;

    beforeEach(() => {
        mgr = new ElectronWindowManager({ quit(): any {} }, <any> new MockMainIpc(), { fromId(): any {}, getAllWindows(): any {} });
    });

    it ("subscribed to ipc", () => {
        const ipc = new MockMainIpc();
        spyOn(ipc, "on").and.callThrough();
        new ElectronWindowManager({}, ipc, { });
        expect(ipc.on).toHaveBeenCalledTimes(5);
        expect(ipc.on).toHaveBeenCalledWith("desktopJS.window-initialize", jasmine.any(Function));
        expect(ipc.on).toHaveBeenCalledWith("desktopJS.window-joinGroup", jasmine.any(Function));
        expect(ipc.on).toHaveBeenCalledWith("desktopJS.window-leaveGroup", jasmine.any(Function));
        expect(ipc.on).toHaveBeenCalledWith("desktopJS.window-getGroup", jasmine.any(Function));
        expect(ipc.on).toHaveBeenCalledWith("desktopJS.window-getOptions", jasmine.any(Function));
    });

    it ("initializeWindow on non-main does not attach to close", () => {
        const win: MockWindow = new MockWindow();
        spyOn(win, "on").and.callThrough();
        mgr.initializeWindow(win, "name", { });
        expect(win.on).toHaveBeenCalledTimes(0);
    });

    it ("initializeWindow attaches to close on main window and invokes quit", (done) => {
        const win: MockWindow = new MockWindow();
        spyOn(win, "on").and.callThrough();
        spyOn((<any>mgr).app, "quit").and.callFake(done);
        mgr.initializeWindow(win, "name", { main: true });
        expect(win.on).toHaveBeenCalledWith("closed", jasmine.any(Function));
        win.emit("closed");
        expect((<any>mgr).app.quit).toHaveBeenCalled();
    });

    describe("main ipc handlers", () => {
        it ("setname sets and returns supplied name", ()=> {
            const win: MockWindow = new MockWindow();
            spyOn((<any>mgr).browserWindow, "fromId").and.returnValue(win);
            const event: any = {};
            (<any>mgr).ipc.emit("desktopJS.window-initialize", event, { id: 1, name: "NewName" });
            expect(win.name).toEqual("NewName");
            expect(event.returnValue).toEqual("NewName");
        });

        it ("joinGroup invokes groupWindows", () => {
            const source: MockWindow = new MockWindow();
            source.id = 1;
            const target: MockWindow = new MockWindow();
            target.id = 2;

            spyOn(mgr, "groupWindows").and.stub();
            spyOn((<any>mgr).browserWindow, "fromId").and.callFake(id => (id === source.id) ? source : target);
            (<any>mgr).ipc.emit("desktopJS.window-joinGroup", {}, { source: 1, target: 2 });

            expect(mgr.groupWindows).toHaveBeenCalledWith(target, source);
        });

        it ("leaveGroup invokes ungroupWindows", () => {
            const win: MockWindow = new MockWindow();

            spyOn(mgr, "ungroupWindows").and.stub();
            spyOn((<any>mgr).browserWindow, "fromId").and.callFake(id => win);
            (<any>mgr).ipc.emit("desktopJS.window-leaveGroup", {}, { source: 1 });

            expect(mgr.ungroupWindows).toHaveBeenCalledWith(win);
        });

        it ("getGroup returns matching windows by group", () => {
            const win1: MockWindow = new MockWindow();
            win1.id = 1;
            const win2: MockWindow = new MockWindow();
            win2.id = 2;
            const win3: MockWindow = new MockWindow();
            win3.id = 3;

            win1.group = win2.group = "group";

            spyOn((<any>mgr).browserWindow, "fromId").and.returnValue(win1);
            spyOn((<any>mgr).browserWindow, "getAllWindows").and.returnValue([ win1, win2, win3 ]);
            const event: any = {};
            (<any>mgr).ipc.emit("desktopJS.window-getGroup", event, { id: 1 });
            expect(event.returnValue).toEqual([ 1, 2 ]);
        });

        it ("getGroup returns returns empty array when no matching groups", () => {
            const win1: MockWindow = new MockWindow();
            win1.id = 1;
            const win2: MockWindow = new MockWindow();
            win2.id = 2;

            spyOn((<any>mgr).browserWindow, "fromId").and.returnValue(win1);
            spyOn((<any>mgr).browserWindow, "getAllWindows").and.returnValue([ win1, win2 ]);
            const event: any = {};
            (<any>mgr).ipc.emit("desktopJS.window-getGroup", event, { id: 1 });
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

            target.id = 1;
            win1.id = 2;
            win2.id = 3;

            spyOn(target, "on").and.callThrough();
            spyOn(win1, "on").and.callThrough();
            spyOn(win2, "on").and.callThrough();
        });

        it ("assigns group property", () => {
            expect(target.group).toBeUndefined();
            expect(win1.group).toBeUndefined();
            expect(win2.group).toBeUndefined();

            mgr.groupWindows(target, win1, win2);

            expect(target.group).toBeDefined();
            expect(win1.group).toEqual(target.group);
            expect(win2.group).toEqual(target.group);
        });

        it ("copies from existing target group", () => {
            target.group = "groupid";

            mgr.groupWindows(target, win1, win2);

            expect(win1.group).toEqual(target.group);
            expect(win2.group).toEqual(target.group);
        });

        it ("attaches move handler", () => {
            mgr.groupWindows(target, win1, win2);

            expect(target.on).toHaveBeenCalledWith("move", jasmine.any(Function));
            expect(win1.on).toHaveBeenCalledWith("move", jasmine.any(Function));
            expect(win2.on).toHaveBeenCalledWith("move", jasmine.any(Function));
        });

        it ("resize is ignored", () => {
            mgr.groupWindows(target, win1, win2);
            spyOn((<any>mgr).browserWindow, "getAllWindows").and.returnValue([]);
            win1.setBounds({ x: 0, y: 1, width: 10, height: 10});

            expect((<any>mgr).browserWindow.getAllWindows).toHaveBeenCalledTimes(0);
        });

        it("move updates other grouped window bounds", () => {
            mgr.groupWindows(target, win1, win2);
            spyOn((<any>mgr).browserWindow, "getAllWindows").and.returnValue([target, win1, win2]);            
            win1.setBounds({ x: 10, y: 1, width: 2, height: 3});

            expect(target.getBounds().x).toEqual(10);
            expect(win2.getBounds().x).toEqual(10);
        });
    });

    describe("ungroupWindows", () => {
        let target: MockWindow;
        let win1: MockWindow;
        let win2: MockWindow;

        beforeEach(() => {
            target = new MockWindow();
            win1 = new MockWindow();
            win2 = new MockWindow();
        });

        it("clears group properties", () => {
            mgr.groupWindows(target, win1, win2);
            expect(win1.group).toBeDefined();
            expect(win2.group).toBeDefined();

            spyOn((<any>mgr).browserWindow, "getAllWindows").and.returnValue([target, win1, win2]);            
            mgr.ungroupWindows(win1, win2);

            expect(win1.group).toBeNull();
            expect(win2.group).toBeNull();
        });

        it ("unhooks orphanded grouped window", () => {
            mgr.groupWindows(target, win1, win2);
            spyOn((<any>mgr).browserWindow, "getAllWindows").and.returnValue([target, win1, win2]);            
            spyOn(target, "removeListener").and.callThrough();

            mgr.ungroupWindows(win1, win2);

            expect(target.group).toBeNull();
            expect(target.removeListener).toHaveBeenCalledWith("move", jasmine.any(Function));
        });
    });
});

describe("ElectronDisplayManager", () => {
    let electron;
    let screen;
    let container;
   
    beforeEach(() => {
        electron = jasmine.createSpyObj("electron", ["ipc"]);
        screen = jasmine.createSpyObj("screen", ["getPrimaryDisplay", "getAllDisplays", "getCursorScreenPoint"]);
        Object.defineProperty(electron, "screen", { value: screen });
        screen.getCursorScreenPoint.and.returnValue({ x: 1, y: 2 });
        screen.getPrimaryDisplay.and.returnValue(
            {
                id: "primary",
                scaleFactor: 1,
                bounds: { x: 2, y: 3, width: 4, height: 5 },
                workArea: { x: 6, y: 7, width: 8, height: 9 }
            }
        );
        screen.getAllDisplays.and.returnValue(
            [
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
            ]
        );

        container = new ElectronContainer(electron, new MockIpc());
    });

    it("screen to be defined", () => {
        expect(container.screen).toBeDefined();
    });

    it("getPrimaryMonitor", (done) => {
        container.screen.getPrimaryDisplay().then(display => {
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
        }).then(done);
    });

    it ("getAllDisplays", (done) => {
        container.screen.getAllDisplays().then(displays => {
            expect(displays).toBeDefined();
            expect(displays.length).toBe(2);
            expect(displays[0].id).toBe("primary");
            expect(displays[1].id).toBe("secondary");
        }).then(done);
    });

    it ("getMousePosition", (done) => {
        container.screen.getMousePosition().then(point => {
            expect(point).toEqual({ x: 1, y: 2});
        }).then(done);
    });    
});

describe("ElectronGlobalShortcutManager", () => {
    describe("invokes underlying Electron", () => {
        let electron;
        let container;

        beforeEach(() => {
            electron = {  globalShortcut: jasmine.createSpyObj("Electron", ["register", "unregister", "isRegistered", "unregisterAll"]) };
            container = new ElectronContainer(electron, new MockIpc());
        });

        it ("register", () => {
            container.globalShortcut.register("shortcut", () => {});
            expect(electron.globalShortcut.register).toHaveBeenCalledWith("shortcut", jasmine.any(Function));
        });

        it ("unregister", () => {
            container.globalShortcut.unregister("shortcut");
            expect(electron.globalShortcut.unregister).toHaveBeenCalledWith("shortcut");
        });

        it ("isRegistered", () => {
            container.globalShortcut.isRegistered("shortcut");
            expect(electron.globalShortcut.isRegistered).toHaveBeenCalledWith("shortcut");
        });

        it ("unregisterAll", () => {
            container.globalShortcut.unregisterAll();
            expect(electron.globalShortcut.unregisterAll).toHaveBeenCalledWith();
        }); 
    });
});