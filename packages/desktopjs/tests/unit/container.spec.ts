import {} from "jasmine";
import { Container, ContainerBase } from "../../src/container";
import { ContainerWindow, PersistedWindowLayout } from "../../src/window";
import { NotificationOptions } from "../../src/notification";
import { MessageBus, MessageBusSubscription, MessageBusOptions } from "../../src/ipc";
import { EventArgs, EventEmitter } from "../../src/events";



class MockContainer extends ContainerBase {
    protected closeAllWindows(excludeSelf?: boolean): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public buildLayout(): Promise<PersistedWindowLayout> {
        throw new Error("Method not implemented.");
    }
    public getMainWindow(): ContainerWindow {
        throw new Error("Method not implemented.");
    }
    public getCurrentWindow(): ContainerWindow {
        throw new Error("Method not implemented.");
    }
    public createWindow(url: string, options?: any): Promise<ContainerWindow> {
        throw new Error("Method not implemented.");
    }
    public getAllWindows(): Promise<ContainerWindow[]> {
        throw new Error("Method not implemented.");
    }
    public getWindowById(id: string): Promise<ContainerWindow> {
        throw new Error("Method not implemented.");
    }
    public getWindowByName(name: string): Promise<ContainerWindow> {
        throw new Error("Method not implemented.");
    }
}

export class MockMessageBus implements MessageBus { 
    private listener: any;

    subscribe<T>(topic: string, listener: (event: any, message: T) => void, options?: MessageBusOptions): Promise<MessageBusSubscription> {
        this.listener = listener;
        return Promise.resolve(undefined);
    }

    unsubscribe(subscription: MessageBusSubscription): Promise<void> {
        this.listener = undefined;
        return Promise.resolve();
    }

    publish<T>(topic: string, message: T, options?: MessageBusOptions): Promise<void> {
        this.listener({ topic: topic }, message);
        return Promise.resolve();
    }
}

export class TestContainer extends ContainerBase {
    getMainWindow(): ContainerWindow {
        const win = jasmine.createSpyObj("ContainerWindow", ["setBounds", "getState", "setState"]);
        Object.defineProperty(win, "name", { value: "1" });
        win.getState.and.returnValue(Promise.resolve({}));
        win.setState.and.returnValue(Promise.resolve());
        return win;
    }

    getWindowByName(): Promise<ContainerWindow> {
        const win = jasmine.createSpyObj("ContainerWindow", ["setBounds", "joinGroup"]);
        Object.defineProperty(win, "id", { value: "1" });
        return Promise.resolve(win);
    }

    createWindow(url: string, options?: any): Promise<ContainerWindow> {
        const win = jasmine.createSpyObj("ContainerWindow", ["id", "getState", "setState"]);
        Object.defineProperty(win, "name", { value: options.name || "1" });
        Object.defineProperty(win, "id", { value: options.name || "1" });
        win.getState.and.returnValue(Promise.resolve({}));
        win.setState.and.returnValue(Promise.resolve());
        return Promise.resolve(win);
    }

    constructor() {
        super();

        this.ipc = new MockMessageBus();

        this.storage = <any> {
            getItem(): string {
                const layout: PersistedWindowLayout = new PersistedWindowLayout();
                layout.windows.push({ name: "1", id: "1", url: "url", bounds: {}, state: { "value": "foo" }, group: ["1", "2", "3"]});
                layout.windows.push({ name: "2", id: "2", main: true, url: "url", bounds: {}, group: ["1", "2", "3"]});
                layout.windows.push({ name: "3", id: "3", url: "url", bounds: {}, group: ["1", "2", "3"]});
                layout.name = "Test";
                return JSON.stringify({ "Test": layout });
            },
            setItem() {
                // no op
            }
        };
    }

    public closeAllWindows(excludeSelf?: boolean): Promise<void> {
        return Promise.resolve();
    }

    public getAllWindows(): Promise<ContainerWindow[]> { return Promise.resolve(undefined) }

    public getCurrentWindow(): ContainerWindow { return undefined; }

    public getWindowById(): Promise<ContainerWindow> { return Promise.resolve(undefined); }

    public buildLayout(): Promise<PersistedWindowLayout> { return Promise.resolve(undefined); }

    public saveLayout(): Promise<PersistedWindowLayout> { return Promise.resolve(undefined); }
}

describe("container", () => {
    let container: TestContainer;

    beforeEach(() => {
        container = new TestContainer();
        (<any>EventEmitter).staticEventListeners = new Map();
    });

    it("ipc is defined", () => {
        expect(container.ipc).toBeDefined();
    });

    it("ready resolves", (done) => {
        container.ready().then(done);
    });

    it ("getInfo returns undefined", (done) => {
        container.getInfo().then(info => {
            expect(info).toBeUndefined();
        }).then(done);
    });

    describe("Static events", () => {
        it("addListener adds callback to listeners", () => {
            expect(Container.listeners("TestEvent").length).toEqual(0);
            Container.addListener(<any>"TestEvent", () => { });
            expect(Container.listeners("TestEvent").length).toEqual(1);
        });

        it("removeListener removes callback to listeners", () => {
            expect(Container.listeners("TestEvent").length).toEqual(0);
            const callback = () => { };
            Container.addListener(<any>"TestEvent", callback);
            expect(Container.listeners("TestEvent").length).toEqual(1);
            Container.removeListener(<any>"TestEvent", callback);
            expect(Container.listeners("TestEvent").length).toEqual(0);
        });

        it("emit invokes ipc publish", () => {
            const args = new EventArgs(undefined, "TestEvent", {});
            spyOn(container.ipc, "publish").and.callThrough();
            Container.emit(<any>args.name, args);
            expect(container.ipc.publish).toHaveBeenCalledWith("desktopJS.static-event", { eventName: "container-" + args.name, eventArgs: args });
        });
    });

    describe("logging", () => {
        it("debug", () => {
            spyOn(console, "debug").and.stub();
            container.log("debug", "message");
            expect(console.debug).toHaveBeenCalledWith("message");
        });

        it("warn", () => {
            spyOn(console, "warn").and.stub();
            container.log("warn", "message");
            expect(console.warn).toHaveBeenCalledWith("message");
        });

        it("error", () => {
            spyOn(console, "error").and.stub();
            container.log("error", "message");
            expect(console.error).toHaveBeenCalledWith("message");
        });

        it("info", () => {
            spyOn(console, "log").and.stub();
            container.log("info", "message");
            expect(console.log).toHaveBeenCalledWith("message");
        });
    });

    describe("ContainerBase", () => {
        describe("addTrayIcon", () => {
            it("Throws Not implemented", () => {
                expect(() => container.addTrayIcon(null)).toThrowError(TypeError);
            });
        });

        describe("showNotification", () => {
            it("Throws Not implemented", () => {
                expect(() => container.showNotification(<any>new NotificationOptions())).toThrowError(TypeError);
            });
        });

        describe("storage", () => {
            it("returns undefined", () => {
                expect(new MockContainer().storage).toBeUndefined();
            });
        });

        describe("window management", () => {
            beforeEach(() => {
                spyOn(container, "createWindow").and.returnValue(jasmine.createSpyObj("window", ["joinGroup"]));
            });

            it("loadLayout by name", (done) => {
                container.loadLayout("Test").then(layout => {
                    expect(layout).toBeDefined();
                    expect(container.createWindow).toHaveBeenCalledWith("url", { name: "1" });
                    done();
                });
            });

            it ("loadLayout by unknown name rejects", (done) => {
                container.loadLayout("Unknown").catch(error => {
                    expect(error).toEqual("Layout does not exist or is invalid");
                }).then(done);
            });

            it("loadLayout fires layout-loaded", (done) => {
                container.addListener("layout-loaded", () => {
                    done();
                });

                container.loadLayout("Test");
            });

            it ("loadLayout with layout creates window", async () => {
                const layoutToLoad: PersistedWindowLayout =  new PersistedWindowLayout("Test");
                layoutToLoad.windows.push({ name: "1", id: "1", url: "url", bounds: {}, state: { "value": "foo" }, group: ["1", "2", "3"]});
               
                const layout = await container.loadLayout(layoutToLoad);
                expect(container.createWindow).toHaveBeenCalledTimes(1);
                expect(container.createWindow).toHaveBeenCalledWith("url", {name: "1"});
                expect(layout).toBeDefined();
                expect(layout.name).toEqual("Test");
            });

            it ("loadLayout by unknown name rejects", (done) => {
                container.loadLayout("Unknown").catch(error => {
                    expect(error).toEqual("Layout does not exist or is invalid");
                }).then(done);
            });

            it ("loadLayout with no windows rejects", (done) => {
                container.loadLayout(new PersistedWindowLayout("Test")).catch(error => {
                    expect(error).toEqual("Layout does not exist or is invalid");
                }).then(done);
            });

            it ("loadLayout with poorly constructed layout still creates windows", async () => {
                const layoutToLoad: PersistedWindowLayout =  new PersistedWindowLayout();
                layoutToLoad.windows.push(<any>{ });
               
                const layout = await container.loadLayout(layoutToLoad);
                expect(container.createWindow).toHaveBeenCalledTimes(1);
                expect(container.createWindow).toHaveBeenCalledWith(undefined, {name: undefined});
                expect(layout).toBeDefined();
                expect(layout.name).toEqual(undefined);
            });

            it("saveLayoutToStorage", () => {
                const layout: PersistedWindowLayout = new PersistedWindowLayout();
                (<any>container).saveLayoutToStorage("Test", layout);
            });

            it("saveLayoutToStorage fires layout-saved", (done) => {
                const layout: PersistedWindowLayout = new PersistedWindowLayout();
                container.addListener("layout-saved", (e) => {
                    expect((<any>e).layout).toEqual(layout);
                    done();
                });
                (<any>container).saveLayoutToStorage("Test", layout);
            });

            it("deleteLayout fires layout-deleted", async (done) => {
                container.addListener("layout-deleted", async () => {
                    done();
                });
                container.deleteLayout("Test");
            });

            it("getLayouts", (done) => {
                container.getLayouts().then(layouts => {
                    expect(layouts).toBeDefined();
                    done();
                });
            });
        });

        describe("instance events", () => {
            it("addListener", done => {
                container.addListener("window-created", () => done());
                container.emit("window-created", { sender: this, name: "window-created" });
            });

            it("removeListener", () => {
                const callback = () => fail();
                container.addListener("window-created", callback);
                container.removeListener("window-created", callback);
                container.emit("window-created", { sender: this, name: "window-created" });
            });
        });
    });
});
