import { Container, ContainerBase, WebContainerBase } from "../../src/container";
import { ContainerWindow, PersistedWindowLayout, PersistedWindow } from "../../src/window";
import { NotificationOptions } from "../../src/notification";
import { MessageBus, MessageBusSubscription, MessageBusOptions } from "../../src/ipc";
import { EventArgs, EventEmitter } from "../../src/events";

class MockContainer extends ContainerBase {
}

export class MockMessageBus implements MessageBus { // tslint:disable-line
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
        const win = jasmine.createSpyObj("ContainerWindow", ["setBounds"]);
        Object.defineProperty(win, "name", { value: "1" });
        return win;
    }

    getWindowByName(): Promise<ContainerWindow> {
        const win = jasmine.createSpyObj("ContainerWindow", ["setBounds", "joinGroup"]);
        Object.defineProperty(win, "id", { value: "1" });
        return Promise.resolve(win);
    }

    createWindow(url: string, options?: any): Promise<ContainerWindow> {
        const win = jasmine.createSpyObj("ContainerWindow", ["id"]);
        Object.defineProperty(win, "name", { value: options.name || "1" });
        Object.defineProperty(win, "id", { value: options.name || "1" });
        return Promise.resolve(win);
    }

    constructor() {
        super();

        this.ipc = new MockMessageBus();

        this.storage = <any> {
            getItem(key: string): string {
                const layout: PersistedWindowLayout = new PersistedWindowLayout();
                layout.windows.push({ name: "1", id: "1", url: "url", bounds: {}, group: ["1", "2", "3"]});
                layout.windows.push({ name: "2", id: "2", main: true, url: "url", bounds: {}, group: ["1", "2", "3"]});
                layout.windows.push({ name: "3", id: "3", url: "url", bounds: {}, group: ["1", "2", "3"]});
                layout.name = "Test";
                return JSON.stringify({ "Test": layout });
            },
            setItem(key: string, value: any) {
                // no op
            }
        };
    }

    public closeAllWindows(excludeSelf?: Boolean): Promise<void> {
        return Promise.resolve();
    }
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

    describe("Static events", () => {
        it("addListener adds callback to listeners", () => {
            expect(Container.listeners("TestEvent").length).toEqual(0);
            Container.addListener("TestEvent", (event: EventArgs) => { });
            expect(Container.listeners("TestEvent").length).toEqual(1);
        });

        it("removeListener removes callback to listeners", () => {
            expect(Container.listeners("TestEvent").length).toEqual(0);
            const callback = (event: EventArgs) => { };
            Container.addListener("TestEvent", callback);
            expect(Container.listeners("TestEvent").length).toEqual(1);
            Container.removeListener("TestEvent", callback);
            expect(Container.listeners("TestEvent").length).toEqual(0);
        });

        it("emit invokes ipc publish", () => {
            const args = new EventArgs(undefined, "TestEvent", {});
            spyOn(container.ipc, "publish").and.callThrough();
            Container.emit(args.name, args);
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
                expect(() => container.showNotification(new NotificationOptions())).toThrowError(TypeError);
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

            it("loadLayout", (done) => {
                container.loadLayout("Test").then(layout => {
                    expect(layout).toBeDefined();
                    expect(container.createWindow).toHaveBeenCalledWith("url", { name: "1" });
                    done();
                });
            });

            it("loadLayout fires layout-loaded", (done) => {
                container.addListener("layout-loaded", (e) => {
                    done();
                });

                container.loadLayout("Test");
            });

            it("saveLayoutToStorage", () => {
                const layout: PersistedWindowLayout = new PersistedWindowLayout();
                container.saveLayoutToStorage("Test", layout);
            });

            it("saveLayoutToStorage fires layout-saved", (done) => {
                const layout: PersistedWindowLayout = new PersistedWindowLayout();
                container.addListener("layout-saved", (e) => {
                    expect((<any>e).layout).toEqual(layout);
                    done();
                });
                container.saveLayoutToStorage("Test", layout);
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
                container.addListener("window-created", e => done());
                container.emit("window-created", { sender: this, name: "window-created" });
            });

            it("removeListener", () => {
                const callback = e => fail();
                container.addListener("window-created", callback);
                container.removeListener("window-created", callback);
                container.emit("window-created", { sender: this, name: "window-created" });
            });
        });
    });
});
