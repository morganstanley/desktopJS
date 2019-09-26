import {} from "jasmine";
import { Default } from "../../../src/Default/default";
import { ContainerWindow } from "../../../src/window";
import { Container } from "../../../src/container";

class MockWindow {
    public listener: any;

    public name: string = "Name";
    public focus(): void { };
    public show(): void { };
    public close(): Promise<void> { return Promise.resolve(); };
    public open(url?: string, target?: string, features?: string, replace?: boolean): any { return new MockWindow(); }
    public addEventListener(type: string, listener: any): void { this.listener = listener; }
    public removeEventListener(type: string, listener: any): void { }
    public postMessage(message: string, origin: string): void { };
    public moveTo(x: number, y: number): void { };
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
            spyOn(mockWindow, 'focus');
            win.focus();

            expect(mockWindow.focus).toHaveBeenCalled();
        });
    });

    it ("load invokes underlying location.replace", (done) => {
        spyOn(mockWindow.location, 'replace').and.callThrough();
        win.load("url").then(() => {
            expect(mockWindow.location.replace).toHaveBeenCalledWith("url");
        }).then(done);
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
        it("getState undefined", (done) => {
            let mockWindow = new MockWindow();
            delete mockWindow.getState;            
            let win = new Default.DefaultContainerWindow(mockWindow);

            win.getState().then(state => {
                expect(state).toBeUndefined();
            }).then(done);
        });

        it("getState defined", (done) => {
            const mockState = { value: "Foo" };
            spyOn(win.innerWindow, "getState").and.returnValue(Promise.resolve(mockState));
            win.getState().then(state => {
                expect(win.innerWindow.getState).toHaveBeenCalled();
                expect(state).toEqual(mockState);
            }).then(done);
        });
    });        

    xdescribe("setState", () => {
        it("setState undefined", (done) => {
            let mockWindow = new MockWindow();
            delete mockWindow.setState;            
            let win = new Default.DefaultContainerWindow(mockWindow);
            
            win.setState({}).then(done);
        });

        it("setState defined", (done) => {
            const mockState = { value: "Foo" };
            spyOn(win.innerWindow, "setState").and.returnValue(Promise.resolve());
            
            win.setState(mockState).then(() => {
                expect(win.innerWindow.setState).toHaveBeenCalledWith(mockState);
            }).then(done);      
        });
    });

    it("getSnapshot rejects", (done) => {
        let success: boolean = false;

        win.getSnapshot().then(() => {
            fail();
        }).catch((error) => {
            success = true;
            expect(error).toBeDefined();
        }).then(() => {
            expect(success).toEqual(true);
        }).then(done);
    });

    it("close", (done) => {
        spyOn(win, "close").and.callThrough();
        win.close().then(() => {
            expect(win.close).toHaveBeenCalled();
        }).then(done);
    });

    it("minimize", (done) => {
        const innerWindow = jasmine.createSpyObj("BrowserWindow", ["minimize"]);
        new Default.DefaultContainerWindow(innerWindow).minimize().then(() => {
            expect(innerWindow.minimize).toHaveBeenCalledTimes(1);
        }).then(done);
    });

    it("maximize", (done) => {
        const innerWindow = jasmine.createSpyObj("BrowserWindow", ["maximize"]);
        new Default.DefaultContainerWindow(innerWindow).maximize().then(() => {
            expect(innerWindow.maximize).toHaveBeenCalledTimes(1);
        }).then(done);
    });
    
    it("restore", (done) => {
        const innerWindow = jasmine.createSpyObj("BrowserWindow", ["restore"]);
        new Default.DefaultContainerWindow(innerWindow).restore().then(() => {
            expect(innerWindow.restore).toHaveBeenCalledTimes(1);
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
        spyOn(win.innerWindow, "moveTo").and.callThrough()
        spyOn(win.innerWindow, "resizeTo").and.callThrough();
        win.setBounds(<any>{ x: 0, y: 1, width: 2, height: 3 }).then(() => {
            expect(win.innerWindow.moveTo).toHaveBeenCalledWith(0, 1);
            expect(win.innerWindow.resizeTo).toHaveBeenCalledWith(2, 3);
        }).then(done);
    });

    it("flash resolves with not supported", (done) => {
        win.flash(true).then(() => {
            fail("Reject is not thrown");
            done();
        }).catch(reason => {
            expect(reason).toEqual("Not supported");
            done();
        });
    });

    it("getOptions", async (done) => {
        const win = await new Default.DefaultContainer(<any>new MockWindow()).createWindow("url", { a: "foo" });
        win.getOptions().then(options => {
            expect(options).toBeDefined();
            expect(options).toEqual({ a: "foo"});
        }).then(done);
    });    

    describe("addListener", () => {
        it("addListener calls underlying window addEventListener with mapped event name", () => {
            spyOn(win.innerWindow, "addEventListener").and.callThrough()
            win.addListener("close", () => { });
            expect(win.innerWindow.addEventListener).toHaveBeenCalledWith("unload", jasmine.any(Function));
        });

        it("addListener calls underlying window addEventListener with unmapped event name", () => {
            const unmappedEvent = "resize";
            spyOn(win.innerWindow, "addEventListener").and.callThrough()
            win.addListener(unmappedEvent, () => { });
            expect(win.innerWindow.addEventListener).toHaveBeenCalledWith(unmappedEvent, jasmine.any(Function));
        });
    });

    describe("removeListener", () => {
        it("removeListener calls underlying window removeEventListener with mapped event name", () => {
            spyOn(win.innerWindow, "removeEventListener").and.callThrough()
            win.removeListener("close", () => { });
            expect(win.innerWindow.removeEventListener).toHaveBeenCalledWith("unload", jasmine.any(Function));
        });

        it("removeListener calls underlying window removeEventListener with unmapped event name", () => {
            const unmappedEvent = "resize";
            spyOn(win.innerWindow, "removeEventListener").and.callThrough()
            win.removeListener(unmappedEvent, () => { });
            expect(win.innerWindow.removeEventListener).toHaveBeenCalledWith(unmappedEvent, jasmine.any(Function));
        });
    });

    describe("window grouping", () => {
        it("allowGrouping is false", () => {
            expect(new Default.DefaultContainerWindow(null).allowGrouping).toEqual(false);
        });

        it ("getGroup returns empty array", (done) => {
            new Default.DefaultContainerWindow(null).getGroup().then(windows => {
                expect(windows).toBeDefined();
                expect(windows.length).toEqual(0);
            }).then(done);
        });

        it ("joinGroup not supported", (done) => {
            new Default.DefaultContainerWindow(null).joinGroup(null).catch(reason => {
                expect(reason).toEqual("Not supported");
            }).then(done);
        });

        it ("leaveGroup resolves", (done) => {
            new Default.DefaultContainerWindow(null).leaveGroup().then(() => {
                done();
            });
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
        let container: Default.DefaultContainer = new Default.DefaultContainer();
        expect(container.hostType).toEqual("Default");
    });

    it ("getInfo returns underlying navigator appversion", (done) => {
        const window = new MockWindow();
        window["navigator"] = { appVersion: "useragent" };
        const container: Default.DefaultContainer = new Default.DefaultContainer(<any>window);
        container.getInfo().then(info => {
            expect(info).toEqual("useragent");
        }).then(done);
    });

    describe("createWindow", () => {
        let container: Default.DefaultContainer;

        beforeEach(() => {
            window = new MockWindow();
            container = new Default.DefaultContainer(window);
        });

        it("Returns a DefaultContainerWindow and invokes underlying window.open", async () => {
            spyOn(window, "open").and.callThrough();
            let newWin: ContainerWindow = await container.createWindow("url");
            expect(window.open).toHaveBeenCalledWith("url", "_blank", undefined);
        });

        it("Options target property maps to open target parameter", async () => {
            spyOn(window, "open").and.callThrough();
            let newWin: ContainerWindow = await container.createWindow("url", { target: "MockTarget" });
            expect(window.open).toHaveBeenCalledWith("url", "MockTarget", "target=MockTarget,");
        });

        it("Options parameters are converted to features", async () => {
            spyOn(window, "open").and.callThrough();
            let newWin: ContainerWindow = await container.createWindow("url",
                {
                    x: "x0",
                    y: "y0"
                });
            expect(window.open).toHaveBeenCalledWith("url", "_blank", "left=x0,top=y0,");
        });

        it("Window is added to windows", (done) => {
            container.createWindow("url").then(win => {
                const newWin = win.innerWindow;
                expect(newWin[Default.DefaultContainer.windowUuidPropertyKey]).toBeDefined();
                expect(newWin[Default.DefaultContainer.windowsPropertyKey]).toBeDefined();
                expect(newWin[Default.DefaultContainer.windowsPropertyKey][newWin[Default.DefaultContainer.windowUuidPropertyKey]]).toBeDefined();
                done();
            });
        });

        it("Window is removed from windows on close", (done) => {
            container.createWindow("url").then(win => {
                const newWin = win.innerWindow;
                expect(newWin[Default.DefaultContainer.windowsPropertyKey][newWin[Default.DefaultContainer.windowUuidPropertyKey]]).toBeDefined();
                newWin.listener("beforeunload", {});
                newWin.listener("unload", {});
                expect(newWin[Default.DefaultContainer.windowsPropertyKey][newWin[Default.DefaultContainer.windowUuidPropertyKey]]).toBeUndefined();
                done();
            });
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
    });

    it("getMainWindow returns DefaultContainerWindow wrapping scoped window", () => {
        let container: Default.DefaultContainer = new Default.DefaultContainer(window);
        let win: ContainerWindow = container.getMainWindow();
        expect(win).toBeDefined();
        expect(win.id).toEqual("root");
        expect(win.innerWindow).toEqual(window);
    });

    it("getCurrentWindow returns DefaultContainerWindow wrapping scoped window", () => {
        let container:Default. DefaultContainer = new Default.DefaultContainer(window);
        let win: ContainerWindow = container.getCurrentWindow();
        expect(win).toBeDefined();
        expect(win.innerWindow).toEqual(window);
    });

    describe("Notifications", () => {
        it("showNotification warns about not being implemented", () => {
            let container: Default.DefaultContainer = new Default.DefaultContainer(window);
            spyOn(console, "warn");
            container.showNotification("message", {});
            expect(console.warn).toHaveBeenCalledWith("Notifications not supported");
        });

        it("showNotification warns about not being permitted", () => {
            let window = {
                Notification: {
                    requestPermission(callback: (permission: string) => {}) { callback("denied"); }
                }
            };

            spyOn(console, "warn");
            let container: Default.DefaultContainer = new Default.DefaultContainer(<any>window);
            container.showNotification("message", {});
            expect(console.warn).toHaveBeenCalledWith("Notifications not permitted");
        });
    });

    describe("window management", () => {
        it("getAllWindows returns wrapped native windows", (done) => {
            window[Default.DefaultContainer.windowsPropertyKey] = {
                "1": new MockWindow(),
                "2": new MockWindow()
            };

            let container: Default.DefaultContainer = new Default.DefaultContainer(window);
            container.getAllWindows().then(wins => {
                expect(wins).not.toBeNull();
                expect(wins.length).toEqual(2);
                wins.forEach(win => expect(win instanceof Default.DefaultContainerWindow).toBeTruthy("Window is not of type DefaultContainerWindow"));
                done();
            });
        });

        describe("getWindow", () => {
            let container: Default.DefaultContainer;

            beforeEach(() => {
                container = new Default.DefaultContainer(window);
            });

            it("getWindowById returns wrapped window", (done) => {
                window[Default.DefaultContainer.windowsPropertyKey] = {
                    "1": new MockWindow(),
                    "2": new MockWindow(),
                    "3": new MockWindow()
                };

                container.getWindowById("1").then(win => {
                    expect(win).toBeDefined();
                    expect(win.innerWindow).toEqual(window[Default.DefaultContainer.windowsPropertyKey]["1"]);
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
                window[Default.DefaultContainer.windowsPropertyKey] = {
                    "1": new MockWindow(),
                    "2": new MockWindow(),
                    "3": new MockWindow()
                };

                window[Default.DefaultContainer.windowsPropertyKey]["1"][Default.DefaultContainer.windowNamePropertyKey] = "Name";

                container.getWindowByName("Name").then(win => {
                    expect(win).toBeDefined();
                    expect(win.innerWindow).toEqual(window[Default.DefaultContainer.windowsPropertyKey]["1"]);
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
            let container: Default.DefaultContainer = new Default.DefaultContainer(window);
            spyOn(window, "close").and.callThrough();
            (<any>container).closeAllWindows().then(done);
            expect(window.close).toHaveBeenCalled();
        });

        it("saveLayout invokes underlying saveLayoutToStorage", (done) => {
            window[Default.DefaultContainer.windowsPropertyKey] = {
                "1": new MockWindow(),
                "2": new MockWindow()
            };

            let container: Default.DefaultContainer = new Default.DefaultContainer(window);
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
            window[Default.DefaultContainer.windowsPropertyKey] = {
                "1": new MockWindow(),
                "2": new MockWindow()
            };

            window[Default.DefaultContainer.windowsPropertyKey]["1"][Default.DefaultContainer.windowNamePropertyKey] = "win1";
            window[Default.DefaultContainer.windowsPropertyKey]["1"][Container.windowOptionsPropertyKey] = { persist: false };
            window[Default.DefaultContainer.windowsPropertyKey]["2"][Default.DefaultContainer.windowNamePropertyKey] = "win2";

            let container: Default.DefaultContainer = new Default.DefaultContainer(window);
            container.buildLayout().then(layout => {
                expect(layout).toBeDefined();
                expect(layout.windows.length).toEqual(1);
                expect(layout.windows[0].name).toEqual("win2");
            }).then(done);
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

    it("subscribe invokes underlying subscriber", (done) => {
        spyOn(mockWindow, "addEventListener").and.callThrough();
        bus.subscribe("topic", callback).then((subscriber) => {
            expect(subscriber.listener).toEqual(jasmine.any(Function));
            expect(subscriber.topic).toEqual("topic");
        }).then(done);
        expect(mockWindow.addEventListener).toHaveBeenCalledWith("message", jasmine.any(Function));
    });

    it("listener callback attached", (done) => {
        const handler = (e, data) => {
            expect(e.topic).toEqual("topic");
            expect(data).toEqual("message");
            done();
        };

        bus.subscribe("topic", handler).then((subscriber) => {
            subscriber.listener({ origin: "origin", data: { source: "desktopJS", topic: "topic", message: "message" } });
        });
    });

    it("unsubscribe invokes underlying unsubscribe", (done) => {
        spyOn(mockWindow, "removeEventListener").and.callThrough();
        bus.unsubscribe({ topic: "topic", listener: callback }).then(done);
        expect(mockWindow.removeEventListener).toHaveBeenCalledWith("message", jasmine.any(Function));
    });

    it("publish invokes underling publish", (done) => {
        let message: any = { data: "data" };
        spyOn(mockWindow, "postMessage").and.callThrough();
        bus.publish("topic", message).then(() => {
            expect(mockWindow.postMessage).toHaveBeenCalledWith({ source: "desktopJS", topic: "topic", message: message }, "origin");
        }).then(done);
    });

    it("publish with non matching optional name does not invoke underling send", (done) => {
        let message: any = {};
        spyOn(mockWindow, "postMessage").and.callThrough();
        bus.publish("topic", message, { name: "target" }).then(done);
        expect(mockWindow.postMessage).toHaveBeenCalledTimes(0);
    });

    it("publish with non matching origin skips and continues", (done) => {
        let message: any = { data: "data" };

        const mockWindow2 = new MockWindow();
        const mockWindow3 = new MockWindow();

        mockWindow[Default.DefaultContainer.windowsPropertyKey] = {
            "1": mockWindow,
            "2": mockWindow2,
            "3": mockWindow3
        };

        mockWindow2.location.origin = "OtherOrigin";

        spyOn(mockWindow, "postMessage").and.callThrough();
        spyOn(mockWindow2, "postMessage").and.callThrough();
        spyOn(mockWindow3, "postMessage").and.callThrough();

        bus.publish("topic", message).then(done);

        expect(mockWindow.postMessage).toHaveBeenCalled();
        expect(mockWindow2.postMessage).toHaveBeenCalledTimes(0);
        expect(mockWindow3.postMessage).toHaveBeenCalled();
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

    it("getPrimaryMonitor", (done) => {
        container.screen.getPrimaryDisplay().then(display => {
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
        }).then(done);
    });

    it ("getAllDisplays", (done) => {
        container.screen.getAllDisplays().then(displays => {
            expect(displays).toBeDefined();
            expect(displays.length).toBe(1);
            expect(displays[0].id).toBe("Current");
        }).then(done);
    });

    it ("getMousePosition", (done) => {
        container.screen.getMousePosition().then(point => {
            expect(point).toEqual({ x: 1, y: 2});
        }).then(done);
    });    
});