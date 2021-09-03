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
import { ElectronContainer, ElectronContainerWindow, ElectronMessageBus, ElectronWindowManager } from "../src/electron";
import { ContainerWindow, Container } from "@morgan-stanley/desktopjs";
import {} from 'jasmine';

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
    public setParentWindow(parent: any) { }

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
    public sendSync(channel: string, ...args: any[]) { return {} }
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
        it("load", async () => {
            spyOn(innerWin, "loadURL").and.callThrough();
            await win.load("url");
            expect(innerWin.loadURL).toHaveBeenCalledWith("url");
        });

        it("load with options", async () => {
            spyOn(innerWin, "loadURL").and.callThrough();
            const options = { prop: "value" };
            await win.load("url", options);
            expect(innerWin.loadURL).toHaveBeenCalledWith("url", options);
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
            const browserWindow = jasmine.createSpyObj("BrowserWindow", ["minimize"]);
            await new ElectronContainerWindow(browserWindow, null).minimize();
            expect(browserWindow.minimize).toHaveBeenCalledTimes(1);
        });

        it("maximize", async () => {
            const browserWindow = jasmine.createSpyObj("BrowserWindow", ["maximize"]);
            await new ElectronContainerWindow(browserWindow, null).maximize();
            expect(browserWindow.maximize).toHaveBeenCalledTimes(1);
        });
        
        it("restore", async () => {
            const browserWindow = jasmine.createSpyObj("BrowserWindow", ["restore"]);
            await new ElectronContainerWindow(browserWindow, null).restore();
            expect(browserWindow.restore).toHaveBeenCalledTimes(1);
        });

        it("isShowing", async () => {
            spyOn(innerWin, "isVisible").and.callThrough();

            const showing = await win.isShowing()
            expect(showing).toBeDefined();
            expect(showing).toEqual(true);
            expect(innerWin.isVisible).toHaveBeenCalled();
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
                spyOn(innerWin.webContents, "executeJavaScript").and.returnValue(Promise.resolve(mockState));
                
                const state = await win.getState();
                expect(innerWin.webContents.executeJavaScript).toHaveBeenCalled();
                expect(state).toEqual(mockState);
            });
        });        
    
        describe("setState", () => {
            it("setState undefined", async () => {
                const mockWindow = new MockWindow();
                mockWindow.webContents = null;
                const win = new ElectronContainerWindow(mockWindow, container);

                await expectAsync(win.setState({})).toBeResolved();
            });

            it("setState defined", async () => {
                const mockState = { value: "Foo" };
                spyOn(innerWin.webContents, "executeJavaScript").and.returnValue(Promise.resolve());

                await win.setState(mockState);
                expect(innerWin.webContents.executeJavaScript).toHaveBeenCalled();
            });
        });

        it("getSnapshot", async () => {
            spyOn(innerWin, "capturePage").and.callThrough();

            const snapshot = await win.getSnapshot()
            expect(snapshot).toBeDefined();
            expect(snapshot).toEqual("data:image/png;base64,Mock");
            expect(innerWin.capturePage).toHaveBeenCalled();
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
            const bounds = { x: 0, y: 1, width: 2, height: 3 };
            await win.setBounds(<any>bounds);
            expect(win.innerWindow.setBounds).toHaveBeenCalledWith(bounds);
        });

        it("flash enable invokes underlying flash", async () => {
            spyOn(win.innerWindow, "flashFrame").and.callThrough();
            await win.flash(true);
            expect(win.innerWindow.flashFrame).toHaveBeenCalledWith(true);
        });

        it("flash disable invokes underlying stopFlashing", async () => {
            spyOn(win.innerWindow, "flashFrame").and.callThrough();
            await win.flash(false);
            expect(win.innerWindow.flashFrame).toHaveBeenCalledWith(false);
        });

        it("getParent calls underlying getParentWindow", async () => {
            spyOn(win.innerWindow, "getParentWindow");
            await win.getParent();
            expect(win.innerWindow.getParentWindow).toHaveBeenCalled();
        });

        it("setParent calls underlying setParentWindow", async () => {
            const mockParent = { innerWindow: new MockWindow() };
            spyOn(win.innerWindow, "setParentWindow");
            await win.setParent(<any>mockParent);
            expect(win.innerWindow.setParentWindow).toHaveBeenCalledWith(mockParent.innerWindow);
        });

        it ("getOptions sends synchronous ipc message", async () => {
            spyOn(container.internalIpc, "sendSync").and.returnValue({ foo: "bar"});
            spyOnProperty(win, "id", "get").and.returnValue(5);
            spyOn(container, "wrapWindow").and.returnValue(new MockWindow() as any);
            spyOn(container.browserWindow, "fromId").and.returnValue(innerWin);

            const options = await win.getOptions();
            expect(container.internalIpc.sendSync).toHaveBeenCalledWith("desktopJS.window-getOptions", { source: 5});
            expect(options).toEqual({ foo: "bar" });
        });

        describe("addListener", () => {
            it("calls underlying Electron window addListener", () => {
                spyOn(win.innerWindow, "addListener").and.callThrough()
                win.addListener("move", () => {});
                expect(win.innerWindow.addListener).toHaveBeenCalledWith("move", jasmine.any(Function));
            });
    
            describe("beforeunload", () => {
                it ("beforeunload attaches to underlying dom window", () => {
                    const window = jasmine.createSpyObj("window", ["addEventListener"]);
                    spyOn(container, "getCurrentWindow").and.returnValue({ id: "1"} as any);
                    win = new ElectronContainerWindow(innerWin, container, window);
                    spyOnProperty(win, "id", "get").and.returnValue("1");
                    win.addListener("beforeunload", () => {});
                    expect(window.addEventListener).toHaveBeenCalledWith("beforeunload", jasmine.any(Function));
                });
    
                it("beforeunload throws error if not current window", () => {
                    const window = jasmine.createSpyObj("window", ["addEventListener"]);
                    spyOn(container, "getCurrentWindow").and.returnValue({ id: "2"} as any);
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
            const window = {};
            const win = new ElectronContainerWindow(innerWin, container, <any>window);
            expect(win.nativeWindow).toEqual(<any>window);
        });
    });

    describe("window grouping", () => {
        it("allowGrouping is true", () => {
            expect(win.allowGrouping).toEqual(true);
        });

        it ("getGroup sends synchronous ipc message", async () => {
            spyOn(container.internalIpc, "sendSync").and.returnValue([ 1, 5, 2 ]);
            spyOnProperty(win, "id", "get").and.returnValue(5);
            spyOn(container, "wrapWindow").and.returnValue(new MockWindow() as any);
            spyOn(container.browserWindow, "fromId").and.returnValue(innerWin);

            const windows = await win.getGroup();
            expect(container.internalIpc.sendSync).toHaveBeenCalledWith("desktopJS.window-getGroup", { source: 5});
            expect(container.wrapWindow).toHaveBeenCalledTimes(2);
            expect(windows.length).toEqual(3);
        });

        it ("getGroup invokes method directly in main process", () => {
            container = new ElectronContainer({ BrowserWindow: { fromId(): any {  } } }, new MockMainIpc(), {});
            win = new ElectronContainerWindow(innerWin, container);
            (<any>container).windowManager = jasmine.createSpyObj("WindowManager", ["getGroup"]);
            (<any>container).windowManager.getGroup.and.returnValue([]);
            win.getGroup();
            expect((<any>container).windowManager.getGroup).toHaveBeenCalled();
        });

        it ("joinGroup sends ipc message", async () => {
            spyOn(container.internalIpc, "send").and.callThrough();
            spyOnProperty(win, "id", "get").and.returnValue(1);
            const targetWin = new ElectronContainerWindow(innerWin, container);
            spyOnProperty(targetWin, "id", "get").and.returnValue(2);

            await win.joinGroup(targetWin);
            expect(container.internalIpc.send).toHaveBeenCalledWith("desktopJS.window-joinGroup", { source: 1, target: 2 });
        });

        it ("joinGroup with source == target does not send ipc message", async () => {
            spyOn(container.internalIpc, "send").and.callThrough();
            spyOnProperty(win, "id", "get").and.returnValue(1);
            const targetWin = new ElectronContainerWindow(innerWin, container);
            spyOnProperty(targetWin, "id", "get").and.returnValue(1);

            await win.joinGroup(targetWin);
            expect(container.internalIpc.send).toHaveBeenCalledTimes(0);
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

        it ("leaveGroup sends ipc message", async () => {
            spyOn(container.internalIpc, "send").and.callThrough();
            spyOnProperty(win, "id", "get").and.returnValue(5);
            await win.leaveGroup();
            expect(container.internalIpc.send).toHaveBeenCalledWith("desktopJS.window-leaveGroup", { source: 5});
        });

        it ("leaveGroup invokes method directly in main process", async () => {
            container = new ElectronContainer({ BrowserWindow: { fromId(): any {  } } }, new MockMainIpc(), {});
            win = new ElectronContainerWindow(innerWin, container);
            (<any>container).windowManager = jasmine.createSpyObj("WindowManager", ["ungroupWindows"]);
            await win.leaveGroup();
            expect((<any>container).windowManager.ungroupWindows).toHaveBeenCalled();
        });
    });

    it ("bringToFront invokes underlying moveTop", async () => {
        spyOn(win.innerWindow, "moveTop").and.callThrough()
        await win.bringToFront();
        expect(innerWin.moveTop).toHaveBeenCalled();
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
            process: { versions: { electron: "1", chrome: "2" } },
        };

        container = new ElectronContainer(electron, new MockIpc(), globalWindow);
    });

    it("hostType is Electron", () => {
        expect(container.hostType).toEqual("Electron");
    });

    it ("getInfo invokes underlying version info", async () => {
        const info = await container.getInfo();
        expect(info).toEqual("Electron/1 Chrome/2");
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

    it("createWindow", async () => {
        spyOn<any>(container, "browserWindow").and.callThrough();
        await container.createWindow("url", { x: "x", taskbar: false, node: true });
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

    it("createWindow on main process invokes ElectronWindowManager.initializeWindow", async () => {
        (<any>container).isRemote = false;
        (<any>container).windowManager = new ElectronWindowManager({}, new MockMainIpc(), { fromId(): any {}, getAllWindows(): any {} })
        spyOn((<any>container).windowManager, "initializeWindow").and.callThrough();
        const options = { name: "name" };
        await container.createWindow("url", options);
        expect((<any>container).windowManager.initializeWindow).toHaveBeenCalledWith(jasmine.any(Object), "name", options);
    });

    it("createWindow pulls nodeIntegration default from container", async () => {
        const container = new ElectronContainer(electron, new MockIpc(), globalWindow, { node: true });
        spyOn<any>(container, "browserWindow").and.callThrough();
        await container.createWindow("url", { });
        expect(container.browserWindow).toHaveBeenCalledWith({ webPreferences: { nodeIntegration: true }});
    });

    it("createWindow with node specified ignores container default", async () => {
        const container = new ElectronContainer(electron, new MockIpc(), globalWindow, { node: true });
        spyOn<any>(container, "browserWindow").and.callThrough();
        await container.createWindow("url", { node: false });
        expect(container.browserWindow).toHaveBeenCalledWith({ webPreferences: { nodeIntegration: false }});
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

        it("requestPermission granted", async () => {
            await globalWindow["Notification"].requestPermission((permission) => {
                expect(permission).toEqual("granted");
            });
        });

        it("notification api delegates to showNotification", () => {
            spyOn(container, "showNotification").and.stub();
            new globalWindow["Notification"]("title", { body: "Test message" });
            expect(container.showNotification).toHaveBeenCalled();
        });
    });

    describe("LoginItemSettings", () => {
        it("options autoStartOnLogin to setLoginItemSettings", () => {
            electron.app.setLoginItemSettings = jasmine.createSpy().and.stub();
            const container = new ElectronContainer(electron, new MockMainIpc(), globalWindow, { autoStartOnLogin: true });
            expect(electron.app.setLoginItemSettings).toHaveBeenCalledWith({ openAtLogin: true });
        });
    
        it("options missing autoStartOnLogin does not invoke setLoginItemSettings", () => {
            electron.app.setLoginItemSettings = jasmine.createSpy().and.stub();
            const container = new ElectronContainer(electron, new MockMainIpc(), globalWindow, { });
            expect(electron.app.setLoginItemSettings).toHaveBeenCalledTimes(0);
        });

        it("setOptions allows the auto startup settings to be turned on", () => {
            electron.app.setLoginItemSettings = jasmine.createSpy().and.stub();
            container.setOptions({ autoStartOnLogin: true });
            expect(electron.app.setLoginItemSettings).toHaveBeenCalledWith({ openAtLogin: true });
        });
    
        it("setOptions errors out on setLoginItemSettings", () => {
            electron.app.setLoginItemSettings = jasmine.createSpy().and.callFake(() => {
                throw new Error("something went wrong");
            });
            spyOn(console, "error");
            container.setOptions({ autoStartOnLogin: true });
            expect(electron.app.setLoginItemSettings).toHaveBeenCalledWith({ openAtLogin: true });
            expect(console.error).toHaveBeenCalledTimes(1);
        });
    
        it("getOptions returns autoStartOnLogin status", async () => {
            electron.app.getLoginItemSettings = jasmine.createSpy().and.returnValue({ openAtLogin: true });
            const result = await container.getOptions();
            expect(electron.app.getLoginItemSettings).toHaveBeenCalled();
            expect(result.autoStartOnLogin).toEqual(true);
        });
    
        it("getOptions error out while fetching auto start info", async () => {
            electron.app.getLoginItemSettings = jasmine.createSpy().and.callFake(() => {
                throw new Error("something went wrong");
            });
            await expectAsync(container.getOptions()).toBeRejectedWithError("Error getting Container options. Error: something went wrong");
            expect(electron.app.getLoginItemSettings).toHaveBeenCalled();
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

        it("getAllWindows returns wrapped native windows", async () => {
            const wins = await container.getAllWindows();
            expect(wins).not.toBeNull();
            expect(wins.length).toEqual(windows.length);
        });

        describe("getWindow", () => {
            it("getWindowById returns wrapped window", async () => {
                spyOn(electron.BrowserWindow, "fromId").and.returnValue(new MockWindow());
                const win = await container.getWindowById("1");
                expect(electron.BrowserWindow.fromId).toHaveBeenCalledWith("1");
                expect(win).toBeDefined();
            });

            it ("getWindowById with unknown id returns null", async () => {
                const win = await container.getWindowById("DoesNotExist");
                expect(win).toBeNull();
            });

            it("getWindowByName returns wrapped window", async () => {
                const win = await container.getWindowByName("Name");
                expect(win).toBeDefined();
            });

            it ("getWindowByName with unknown name returns null", async () => {
                const win = await container.getWindowByName("DoesNotExist");
                expect(win).toBeNull();
            });
        });

        it("closeAllWindows excluding self skips current window", async () => {
            spyOn(electron, "getCurrentWindow").and.callThrough();
            spyOn(windows[0], "close").and.callThrough();
            spyOn(windows[1], "close").and.callThrough();
            await (<any>container).closeAllWindows(true);
            expect(electron.getCurrentWindow).toHaveBeenCalled();
            expect(windows[0].close).not.toHaveBeenCalled();
            expect(windows[1].close).toHaveBeenCalled();
        });

        it("closeAllWindows including self closes all", async () => {
            spyOn(electron, "getCurrentWindow").and.callThrough();
            spyOn(windows[0], "close").and.callThrough();
            spyOn(windows[1], "close").and.callThrough();
            await (<any>container).closeAllWindows();
            expect(electron.getCurrentWindow).not.toHaveBeenCalled();
            expect(windows[0].close).toHaveBeenCalled();
            expect(windows[1].close).toHaveBeenCalled();
        });

        it("saveLayout invokes underlying saveLayoutToStorage", async () => {
            container.browserWindow = {
                getAllWindows(): MockWindow[] { return windows; },
                fromId(): any { return {}; }
            };

            spyOn<any>(container.internalIpc, "sendSync").and.returnValue([ 1, 5, 2 ]);
            spyOn<any>(container, "saveLayoutToStorage").and.stub();
            spyOn<any>(container, "getMainWindow").and.returnValue(new MockWindow());
            const layout = await container.saveLayout("Test");
            expect(layout).toBeDefined();
            expect((<any>container).saveLayoutToStorage).toHaveBeenCalledWith("Test", layout);
        });

        it("buildLayout skips windows with persist false", async () => {
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
            const layout = await container.buildLayout();
            expect(layout).toBeDefined();
            expect(layout.windows.length).toEqual(1);
            expect(layout.windows[0].name === "win1")
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

    it("subscribe invokes underlying subscribe", async () => {
        spyOn(mockIpc, "on").and.callThrough();
        const subscriber = await bus.subscribe("topic", callback);
        expect(subscriber.listener).toEqual(jasmine.any(Function));
        expect(subscriber.topic).toEqual("topic");
        expect(mockIpc.on).toHaveBeenCalledWith("topic", jasmine.any(Function));
    });

    it("subscribe listener attached", async () => {
        const subscriber = await bus.subscribe("topic", callback);
        spyOn(subscriber, "listener").and.callThrough();
        subscriber.listener();
        expect(subscriber.listener).toHaveBeenCalled();
    });

    it("unsubscribe invokes underlying unsubscribe", async () => {
        spyOn(mockIpc, "removeListener").and.callThrough();
        await bus.unsubscribe({ topic: "topic", listener: callback });
        expect(mockIpc.removeListener).toHaveBeenCalledWith("topic", jasmine.any(Function));
    });

    it("publish invokes underling publish", async () => {
        const message: any = {};
        spyOn(mockIpc, "send").and.callThrough();
        spyOn(mockWindow.webContents, "send").and.callThrough();
        await bus.publish("topic", message);
        expect(mockIpc.send).toHaveBeenCalledWith("topic", message);
    });

    it("publish in main invokes callback in main", async () => {
        const message: any = {};
        const ipc = new MockMainIpc();
        spyOn(ipc, "listeners").and.callThrough();
        const localBus = new ElectronMessageBus(<any> ipc, mockWindow);
        await localBus.publish("topic", message);
        expect(ipc.listeners).toHaveBeenCalledWith("topic");
    });

    it("publish with optional name invokes underling send", async () => {
        const message: any = {};
        await bus.publish("topic", message, { name: "target" });
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
        it ("setname sets and returns supplied name", () => {
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

    it ("getAllDisplays", async () => {
        const displays = await container.screen.getAllDisplays();
        expect(displays).toBeDefined();
        expect(displays.length).toBe(2);
        expect(displays[0].id).toBe("primary");
        expect(displays[1].id).toBe("secondary");
    });

    it ("getMousePosition", async () => {
        const point = await container.screen.getMousePosition();
        expect(point).toEqual({ x: 1, y: 2});
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