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

import { Container, ContainerBase } from "../../src/container";
import { ContainerWindow, PersistedWindowLayout } from "../../src/window";
import { NotificationOptions } from "../../src/notification";
import { MessageBus, MessageBusSubscription, MessageBusOptions } from "../../src/ipc";
import { EventArgs, EventEmitter } from "../../src/events";

// Import the global jest types
import { jest } from '@jest/globals';

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

    public getOptions(): Promise<any> {
        throw new Error("Method not implemented.");
    }

    public setOptions(options: any) {
        throw new Error("Method not implemented.");
    }
}

export class MockMessageBus implements MessageBus { 
    private listener: any;

    async subscribe<T>(topic: string, listener: (event: any, message: T) => void, options?: MessageBusOptions): Promise<MessageBusSubscription> {
        this.listener = listener;
        return {} as MessageBusSubscription;
    }

    async unsubscribe(subscription: MessageBusSubscription) {
        this.listener = undefined;
    }

    async publish<T>(topic: string, message: T, options?: MessageBusOptions) {
        this.listener({ topic: topic }, message);
    }
}

export class TestContainer extends ContainerBase {
    getMainWindow(): ContainerWindow {
        const win = {
            setBounds: jest.fn(),
            getState: jest.fn().mockResolvedValue({}),
            setState: jest.fn().mockResolvedValue(undefined),
            name: "1"
        } as unknown as ContainerWindow;
        return win;
    }

    async getWindowByName(): Promise<ContainerWindow> {
        const win = {
            setBounds: jest.fn(),
            joinGroup: jest.fn(),
            id: "1"
        } as unknown as ContainerWindow;
        return win;
    }

    async createWindow(url: string, options?: any): Promise<ContainerWindow> {
        const win = {
            getState: jest.fn().mockResolvedValue({}),
            setState: jest.fn().mockResolvedValue(undefined),
            name: options?.name || "1",
            id: options?.name || "1"
        } as unknown as ContainerWindow;
        return win;
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

    public async closeAllWindows(excludeSelf?: boolean) {
    }

    public async getAllWindows(): Promise<ContainerWindow[]> { return [] as ContainerWindow[]; }

    public getCurrentWindow(): ContainerWindow { return {} as ContainerWindow; }

    public async getWindowById(): Promise<ContainerWindow> { return {} as ContainerWindow; }

    public async buildLayout(): Promise<PersistedWindowLayout> { return {} as PersistedWindowLayout; }

    public async saveLayout(): Promise<PersistedWindowLayout> { return {} as PersistedWindowLayout; }

    public setOptions(options: any) { }

    public async getOptions(): Promise<any> { return {}; }
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

    it("ready resolves", () => container.ready());

    it ("getInfo returns undefined", async () => {
        const info = await container.getInfo();
        expect(info).toBeUndefined();
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
            jest.spyOn(container.ipc, "publish");
            Container.emit(<any>args.name, args);
            expect(container.ipc.publish).toHaveBeenCalledWith("desktopJS.static-event", { eventName: "container-" + args.name, eventArgs: args });
        });
    });

    describe("logging", () => {
        // eslint-disable-next-line no-console
        it("debug", () => {
            // eslint-disable-next-line no-console
            jest.spyOn(console, "debug").mockImplementation(() => {});
            // eslint-disable-next-line no-console
            container.log("debug", "message");
            // eslint-disable-next-line no-console
            expect(console.debug).toHaveBeenCalledWith("message");
        });

        // eslint-disable-next-line no-console
        it("warn", () => {
            // eslint-disable-next-line no-console
            jest.spyOn(console, "warn").mockImplementation(() => {});
            // eslint-disable-next-line no-console
            container.log("warn", "message");
            // eslint-disable-next-line no-console
            expect(console.warn).toHaveBeenCalledWith("message");
        });

        // eslint-disable-next-line no-console
        it("error", () => {
            // eslint-disable-next-line no-console
            jest.spyOn(console, "error").mockImplementation(() => {});
            // eslint-disable-next-line no-console
            container.log("error", "message");
            // eslint-disable-next-line no-console
            expect(console.error).toHaveBeenCalledWith("message");
        });

        // eslint-disable-next-line no-console
        it("info", () => {
            // eslint-disable-next-line no-console
            jest.spyOn(console, "log").mockImplementation(() => {});
            // eslint-disable-next-line no-console
            container.log("info", "message");
            // eslint-disable-next-line no-console
            expect(console.log).toHaveBeenCalledWith("message");
        });
    });

    describe("ContainerBase", () => {
        describe("addTrayIcon", () => {
            it("Throws Not implemented", () => {
                expect(() => container.addTrayIcon({} as any)).toThrow(TypeError);
            });
        });

        describe("showNotification", () => {
            it("Throws Not implemented", () => {
                expect(() => container.showNotification(<any>new NotificationOptions())).toThrow(TypeError);
            });
        });

        describe("storage", () => {
            it("returns undefined", () => {
                const mockContainer = new MockContainer();
                // Override the storage property to be undefined
                Object.defineProperty(mockContainer, 'storage', {
                    value: undefined
                });
                expect(mockContainer.storage).toBeUndefined();
            });
        });

        describe("window management", () => {
            beforeEach(() => {
                jest.spyOn(container, "createWindow").mockImplementation(() => {
                    const mockWindow = {
                        joinGroup: jest.fn()
                    } as unknown as ContainerWindow;
                    return Promise.resolve(mockWindow);
                });
            });

            it("loadLayout by name", async () => {
                const layout = await container.loadLayout("Test");
                expect(layout).toBeDefined();
                expect(container.createWindow).toHaveBeenCalledWith("url", { name: "1" });
            });

            it ("loadLayout by unknown name rejects", async () => {
                await expect(container.loadLayout("Unknown")).rejects.toThrow("Layout does not exist or is invalid");
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

            it ("loadLayout by unknown name rejects", async () => {
                await expect(container.loadLayout("Unknown")).rejects.toThrow("Layout does not exist or is invalid");
            });

            it ("loadLayout with no windows rejects", async () => {
                await expect(container.loadLayout({ name: "Test", windows: null } as any)).rejects.toThrow("Layout does not exist or is invalid");
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

            it("deleteLayout fires layout-deleted", (done) => {
                container.addListener("layout-deleted", () => {
                    done();
                });
                container.deleteLayout("Test");
            });

            it("getLayouts", async () => {
                const layouts = await container.getLayouts();
                expect(layouts).toBeDefined();
            });
        });

        describe("instance events", () => {
            it("addListener", done => {
                container.addListener("window-created", () => done());
                container.emit("window-created", { sender: this, name: "window-created", windowId: "1" });
            });

            it("removeListener", () => {
                const callback = () => fail("This should not be called");
                container.addListener("window-created", callback);
                container.removeListener("window-created", callback);
                container.emit("window-created", { sender: this, name: "window-created", windowId: "2" });
            });
        });
    });
});
