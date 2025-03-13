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

import { describe, it, expect, beforeEach, vi } from 'vitest';
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
        return undefined;
    }

    async unsubscribe(subscription: MessageBusSubscription) {
        this.listener = undefined;
    }

    async publish<T>(topic: string, message: T, options?: MessageBusOptions) {
        this.listener?.({ topic: topic }, message);
    }
}

export class TestContainer extends ContainerBase {
    getMainWindow(): ContainerWindow {
        const win = {
            setBounds: vi.fn(),
            getState: vi.fn().mockResolvedValue({}),
            setState: vi.fn().mockResolvedValue(undefined),
            name: "1"
        };
        return win as unknown as ContainerWindow;
    }

    async getWindowByName(): Promise<ContainerWindow> {
        const win = {
            setBounds: vi.fn(),
            joinGroup: vi.fn(),
            id: "1"
        };
        return win as unknown as ContainerWindow;
    }

    async createWindow(url: string, options?: any): Promise<ContainerWindow> {
        const win = {
            id: options?.name || "1",
            name: options?.name || "1",
            getState: vi.fn().mockResolvedValue({}),
            setState: vi.fn().mockResolvedValue(undefined)
        };
        return win as unknown as ContainerWindow;
    }

    constructor() {
        super();
        this.ipc = new MockMessageBus();
        this.storage = {
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
        } as any;
    }

    public async closeAllWindows(excludeSelf?: boolean) { }
    public async getAllWindows(): Promise<ContainerWindow[]> { return undefined; }
    public getCurrentWindow(): ContainerWindow { return undefined; }
    public async getWindowById(): Promise<ContainerWindow> { return undefined; }
    public async buildLayout(): Promise<PersistedWindowLayout> { return undefined; }
    public async saveLayout(): Promise<PersistedWindowLayout> { return undefined; }
    public setOptions(options: any) { }
    public async getOptions(): Promise<any> { return {}; }
}

describe("container", () => {
    let container: TestContainer;

    beforeEach(() => {
        container = new TestContainer();
        (EventEmitter as any).staticEventListeners = new Map();
    });

    it("ipc is defined", () => {
        expect(container.ipc).toBeDefined();
    });

    it("ready resolves", () => container.ready());

    it("getInfo returns undefined", async () => {
        const info = await container.getInfo();
        expect(info).toBeUndefined();
    });

    describe("Static events", () => {
        it("addListener adds callback to listeners", () => {
            expect(Container.listeners("TestEvent").length).toBe(0);
            Container.addListener("TestEvent" as any, () => { });
            expect(Container.listeners("TestEvent").length).toBe(1);
        });

        it("removeListener removes callback to listeners", () => {
            expect(Container.listeners("TestEvent").length).toBe(0);
            const callback = () => { };
            Container.addListener("TestEvent" as any, callback);
            expect(Container.listeners("TestEvent").length).toBe(1);
            Container.removeListener("TestEvent" as any, callback);
            expect(Container.listeners("TestEvent").length).toBe(0);
        });

        it("emit invokes ipc publish", () => {
            const args = new EventArgs(undefined, "TestEvent", {});
            const publishSpy = vi.spyOn(container.ipc, "publish");
            Container.emit(args.name as any, args);
            expect(publishSpy).toHaveBeenCalledWith("desktopJS.static-event", { eventName: "container-" + args.name, eventArgs: args });
        });
    });

    describe("logging", () => {
        it("debug", () => {
            const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
            container.log("debug", "message");
            expect(consoleSpy).toHaveBeenCalledWith("message");
        });

        it("warn", () => {
            const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
            container.log("warn", "message");
            expect(consoleSpy).toHaveBeenCalledWith("message");
        });

        it("error", () => {
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            container.log("error", "message");
            expect(consoleSpy).toHaveBeenCalledWith("message");
        });

        it("info", () => {
            const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
            container.log("info", "message");
            expect(consoleSpy).toHaveBeenCalledWith("message");
        });
    });

    describe("ContainerBase", () => {
        describe("addTrayIcon", () => {
            it("Throws Not implemented", () => {
                expect(() => container.addTrayIcon(null)).toThrow(TypeError);
            });
        });

        describe("showNotification", () => {
            it("Throws Not implemented", () => {
                expect(() => container.showNotification(new NotificationOptions())).toThrow(TypeError);
            });
        });

        describe("window management", () => {
            it("window-created fires on EventEmitter", () => {
                const callback = vi.fn();
                container.addListener("window-created", callback);
                container.emit("window-created", { sender: container, name: "window-created", windowId: "2" });
                expect(callback).toHaveBeenCalled();
            });

            it.skip("window-created fires on Container", () => {
                const callback = vi.fn();
                Container.addListener("window-created", callback);
                container.emit("window-created", { sender: container, name: "window-created", windowId: "2" });
                expect(callback).toHaveBeenCalled();
            });

            it("window-created subscription is removed", () => {
                const callback = vi.fn();
                container.addListener("window-created", callback);
                container.removeListener("window-created", callback);
                container.emit("window-created", { sender: container, name: "window-created", windowId: "2" });
                expect(callback).not.toHaveBeenCalled();
            });
        });

        describe("Events", () => {
            it("addListener", async () => {
                const callback = vi.fn();
                container.addListener("window-created", callback);
                container.emit("window-created", { sender: container, name: "window-created", windowId: "2" });
                expect(callback).toHaveBeenCalled();
            });

            it("removeListener", () => {
                const callback = vi.fn();
                container.addListener("window-created", callback);
                container.removeListener("window-created", callback);
                container.emit("window-created", { sender: container, name: "window-created", windowId: "2" });
                expect(callback).not.toHaveBeenCalled();
            });
        });
    });
});
