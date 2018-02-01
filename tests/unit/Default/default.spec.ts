import { DefaultContainerWindow, DefaultContainer, DefaultMessageBus } from "../../../src/Default/default";

class MockWindow {
    public listener: any;

    public focus(): void { };
    public show(): void { };
    public close(): Promise<void> { return Promise.resolve(); };
    public open(url?: string, target?: string, features?: string, replace?: boolean): any { return new MockWindow(); }
    public addEventListener(type: string, listener: any): void { this.listener = listener; }
    public removeEventListener(type: string, listener: any): void { }
    public postMessage(message: string, origin: string): void { };
    public moveTo(x: number, y: number): void { };
    public resizeTo(width: number, height: number): void { }
    public screenX: any = 0;
    public screenY: any = 1;
    public outerWidth: any = 2;
    public outerHeight: any = 3;
    location: any = { origin: "origin" };
}

describe("DefaultContainerWindow", () => {
    const mockWindow = new MockWindow();
    let win: DefaultContainerWindow;

    beforeEach(() => {
        win = new DefaultContainerWindow(mockWindow);
    });

    describe("focus", () => {
        it("Invokes underlying window focus and resolves promise", () => {
            spyOn(mockWindow, 'focus');
            win.focus();

            expect(mockWindow.focus).toHaveBeenCalled();
        });
    });

    it ("id returns underlying id", () => {
        mockWindow[DefaultContainer.windowUuidPropertyKey] = "UUID";
        expect(win.id).toEqual("UUID");
    });

    it ("name returns underlying name", () => {
        mockWindow[DefaultContainer.windowNamePropertyKey] = "NAME";
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
        win.setBounds({ x: 0, y: 1, width: 2, height: 3 }).then(() => {
            expect(win.innerWindow.moveTo).toHaveBeenCalledWith(0, 1);
            expect(win.innerWindow.resizeTo).toHaveBeenCalledWith(2, 3);
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
            expect(new DefaultContainerWindow(null).allowGrouping).toEqual(false);
        });

        it ("getGroup returns empty array", (done) => {
            new DefaultContainerWindow(null).getGroup().then(windows => {
                expect(windows).toBeDefined();
                expect(windows.length).toEqual(0);
            }).then(done);
        });

        it ("joinGroup not supported", (done) => {
            new DefaultContainerWindow(null).joinGroup(null).catch(reason => {
                expect(reason).toEqual("Not supported");
            }).then(done);
        });

        it ("leaveGroup resolves", (done) => {
            new DefaultContainerWindow(null).leaveGroup().then(() => {
                done();
            });
        });
    });
});

describe("DefaultContainer", () => {
    let window: any;

    beforeEach(() => {
        window = new MockWindow();
    });

    it("hostType is Default", () => {
        let container: DefaultContainer = new DefaultContainer();
        expect(container.hostType).toEqual("Default");
    });

    describe("createWindow", () => {
        let container: DefaultContainer;

        beforeEach(() => {
            window = new MockWindow();
            container = new DefaultContainer(window);
        });

        it("Returns a DefaultContainerWindow and invokes underlying window.open", () => {
            spyOn(window, "open").and.callThrough();
            let newWin: DefaultContainerWindow = container.createWindow("url");
            expect(window.open).toHaveBeenCalledWith("url", "_blank", undefined);
        });

        it("Options target property maps to open target parameter", () => {
            spyOn(window, "open").and.callThrough();
            let newWin: DefaultContainerWindow = container.createWindow("url", { target: "MockTarget" });
            expect(window.open).toHaveBeenCalledWith("url", "MockTarget", "target=MockTarget,");
        });

        it("Options parameters are converted to features", () => {
            spyOn(window, "open").and.callThrough();
            let newWin: DefaultContainerWindow = container.createWindow("url",
                {
                    x: "x0",
                    y: "y0"
                });
            expect(window.open).toHaveBeenCalledWith("url", "_blank", "left=x0,top=y0,");
        });

        it("Window is added to windows", (done) => {
            container.createWindow("url").then(win => {
                const newWin = win.innerWindow;
                expect(newWin[DefaultContainer.windowUuidPropertyKey]).toBeDefined();
                expect(newWin[DefaultContainer.windowsPropertyKey]).toBeDefined();
                expect(newWin[DefaultContainer.windowsPropertyKey][newWin[DefaultContainer.windowUuidPropertyKey]]).toBeDefined();
                done();
            });
        });

        it("Window is removed from windows on close", (done) => {
            container.createWindow("url").then(win => {
                const newWin = win.innerWindow;
                expect(newWin[DefaultContainer.windowsPropertyKey][newWin[DefaultContainer.windowUuidPropertyKey]]).toBeDefined();
                newWin.listener("beforeunload", {});
                newWin.listener("unload", {});
                expect(newWin[DefaultContainer.windowsPropertyKey][newWin[DefaultContainer.windowUuidPropertyKey]]).toBeUndefined();
                done();
            });
        });

        it("createWindow fires window-created", (done) => {
            container.addListener("window-created", () => done());
            container.createWindow("url");
        });
    });

    it("getMainWindow returns DefaultContainerWindow wrapping scoped window", () => {
        let container: DefaultContainer = new DefaultContainer(window);
        let win: DefaultContainerWindow = container.getMainWindow();
        expect(win).toBeDefined();
        expect(win.innerWindow).toEqual(window);
    });

    it("getCurrentWindow returns DefaultContainerWindow wrapping scoped window", () => {
        let container: DefaultContainer = new DefaultContainer(window);
        let win: DefaultContainerWindow = container.getCurrentWindow();
        expect(win).toBeDefined();
        expect(win.innerWindow).toEqual(window);
    });

    describe("Notifications", () => {
        it("showNotification warns about not being implemented", () => {
            let container: DefaultContainer = new DefaultContainer(window);
            spyOn(console, "warn");
            container.showNotification({ title: "title", message: "message" });
            expect(console.warn).toHaveBeenCalledWith("Notifications not supported");
        });

        it("showNotification warns about not being permitted", () => {
            let window = {
                Notification: {
                    requestPermission(callback: (permission: string) => {}) { callback("denied"); }
                }
            };

            spyOn(console, "warn");
            let container: DefaultContainer = new DefaultContainer(<any>window);
            container.showNotification({});
            expect(console.warn).toHaveBeenCalledWith("Notifications not permitted");
        });
    });

    describe("window management", () => {
        it("getAllWindows returns wrapped native windows", (done) => {
            window[DefaultContainer.windowsPropertyKey] = {
                "1": new MockWindow(),
                "2": new MockWindow()
            };

            let container: DefaultContainer = new DefaultContainer(window);
            container.getAllWindows().then(wins => {
                expect(wins).not.toBeNull();
                expect(wins.length).toEqual(2);
                done();
            });
        });

        describe("getWindow", () => {
            let container: DefaultContainer;

            beforeEach(() => {
                container = new DefaultContainer(window);
            });

            it("getWindowById returns wrapped window", (done) => {
                window[DefaultContainer.windowsPropertyKey] = {
                    "1": new MockWindow(),
                    "2": new MockWindow(),
                    "3": new MockWindow()
                };

                container.getWindowById("1").then(win => {
                    expect(win).toBeDefined();
                    expect(win.innerWindow).toEqual(window[DefaultContainer.windowsPropertyKey]["1"]);
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
                window[DefaultContainer.windowsPropertyKey] = {
                    "1": new MockWindow(),
                    "2": new MockWindow(),
                    "3": new MockWindow()
                };

                window[DefaultContainer.windowsPropertyKey]["1"][DefaultContainer.windowNamePropertyKey] = "Name";

                container.getWindowByName("Name").then(win => {
                    expect(win).toBeDefined();
                    expect(win.innerWindow).toEqual(window[DefaultContainer.windowsPropertyKey]["1"]);
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
            let container: DefaultContainer = new DefaultContainer(window);
            spyOn(window, "close").and.callThrough();
            (<any>container).closeAllWindows().then(done);
            expect(window.close).toHaveBeenCalled();
        });

        it("saveLayout invokes underlying saveLayoutToStorage", (done) => {
            window[DefaultContainer.windowsPropertyKey] = {
                "1": new MockWindow(),
                "2": new MockWindow()
            };

            let container: DefaultContainer = new DefaultContainer(window);
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

describe("DefaultMessageBus", () => {
    let container: DefaultContainer;
    let mockWindow: any;
    let bus: DefaultMessageBus;

    function callback() { }

    beforeEach(() => {
        mockWindow = new MockWindow();
        container = new DefaultContainer(mockWindow);
        bus = new DefaultMessageBus(container);
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
        bus.subscribe("topic", callback).then((subscriber) => {
            subscriber.listener({ origin: "origin", data: JSON.stringify({ source: "desktopJS", topic: "topic", message: "message" }) });
        }).then(done);
    });

    it("unsubscribe invokes underlying unsubscribe", (done) => {
        spyOn(mockWindow, "removeEventListener").and.callThrough();
        bus.unsubscribe({ topic: "topic", listener: callback }).then(done);
        expect(mockWindow.removeEventListener).toHaveBeenCalledWith("message", jasmine.any(Function));
    });

    it("publish invokes underling publish", (done) => {
        let message: any = { data: "data" };
        spyOn(mockWindow, "postMessage").and.callThrough();
        bus.publish("topic", message).then(done);
        expect(mockWindow.postMessage).toHaveBeenCalledWith(JSON.stringify({ source: "desktopJS", topic: "topic", message: message }), "origin");
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

        mockWindow[DefaultContainer.windowsPropertyKey] = {
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