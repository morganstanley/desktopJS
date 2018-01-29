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
        return undefined;
    }

    createWindow(url: string, options?: any): Promise<ContainerWindow> {
        return Promise.resolve(undefined);
    }

    constructor() {
        super();

        this.ipc = new MockMessageBus();

        this.storage = <any> {
            getItem(key: string): string {
                const layout: PersistedWindowLayout = new PersistedWindowLayout();
                const win: PersistedWindow = new PersistedWindow();
                win.name = "name";
                win.url = "url";
                layout.windows.push(win);
                layout.name = "Test";
                const layouts: any = { "Test": layout };
                let test: string = JSON.stringify(layouts);
                return test;
            },
            setItem(key: string, value: any) {
                // no op
            }
        };
    }

    public saveLayoutToStorage(name: string, layout: PersistedWindowLayout) {
        super.saveLayoutToStorage(name, layout);
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
            it("loadLayout", (done) => {
                spyOn(container, "createWindow").and.callThrough();
                container.loadLayout("Test").then(layout => {
                    expect(layout).toBeDefined();
                    expect(container.createWindow).toHaveBeenCalledWith("url", { name: "name" });
                    done();
                });
            });

            it("loadLayout firews layout-loaded", (done) => {
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
