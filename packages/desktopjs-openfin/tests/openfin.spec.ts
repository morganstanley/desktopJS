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
import { OpenFinContainer, OpenFinContainerWindow, OpenFinMessageBus } from "../src/openfin";
import { ContainerWindow, MessageBusSubscription, MenuItem } from "@morgan-stanley/desktopjs";

class MockDesktop {
    public static application: any = {
        eventListeners: new Map(),
        uuid: "uuid",
        getChildWindows(callback) { callback([MockWindow.singleton, new MockWindow("Window2", JSON.stringify({ persist: false }))]); },
        setTrayIcon() { },
        setShortcuts(config) { },
        getShortcuts(callback) { callback(); },
        getWindow() { return MockWindow.singleton; },
        addEventListener(eventName, listener) {
            (this.eventListeners[eventName] = this.eventListeners[eventName] || []).push(listener);
        },
        listeners(eventName: string): ((event: any) => void)[] {
            return (this.eventListeners[eventName] || []);
        },
        emit(eventName: string, ...eventArgs: any[]) {
            for (const listener of this.listeners(eventName)) {
                listener(...eventArgs);
            }
        },
        getManifest(callback) { callback(); }
    }
    main(callback): any { callback(); }
    GlobalHotkey: any = { };
    Window: any = MockWindow;
    InterApplicationBus: any = new MockInterApplicationBus();
    Application: any = {
        getCurrent() {
            return MockDesktop.application;
        }
    };
}

class MockInterApplicationBus {
    subscribe(uuid: string, name: string, topic: string, listener: (message: any, uuid: string, name: string) => void, callback?: () => void, errorCallback?: (reason: string) => void): void {
        callback?.();
    }

    unsubscribe(senderUuid: string, name: string, topic: string, listener: (message: any, uuid: string, name: string) => void, callback?: () => void, errorCallback?: (reason: string) => void): void {
        callback?.();
    }

    send(destinationUuid: string, name: string, topic: string, message: any, callback?: () => void, errorCallback?: (reason: string) => void): void {
        callback?.();
    }

    publish(topic: string, message: any, callback?: () => void, errorCallback?: (reason: string) => void): void {
        callback?.();
    }

    addSubscribeListener() { }
    addUnsubscribeListener() { }
    removeSubscribeListener() { }
    removeUnsubscribeListener() { }
}

class MockWindow {
    static singleton: MockWindow = new MockWindow("Singleton");
    public nativeWindow: Window = vi.fn(() => ({
        location: vi.fn(),
        getState: vi.fn(),
        setState: vi.fn()
    }))();
    private customData: string;

    constructor(name?: string, customData?: string) {
        this.name = name;
        this.customData = customData;
    }

    public name: string;

    static getCurrent(): any { return MockWindow.singleton; }

    getParentWindow(): any { return MockWindow.singleton; }

    getNativeWindow(): any { return this.nativeWindow; }

    navigate(url: string, callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }

    focus(callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }

    show(callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }

    close(force: boolean, callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }

    hide(callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }

    minimize(callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }

    maximize(callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }
    
    restore(callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }

    isShowing(callback: (showing: boolean) => void, error: (reason) => void): any {
        callback(true);
        return {};
    }

    getSnapshot(callback: (snapshot: string) => void, error: (reason) => void): any {
        callback("");
        return {};
    }

    getBounds(callback: (bounds: any) => void, error: (reason) => void): any {
        callback({ left: 0, top: 1, width: 2, height: 3 });
        return {};
    }

    setBounds(x: number, y: number, width: number, height: number, callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }

    flash(options: any, callback: () => void): void {
        callback();
    }

    stopFlashing(callback: () => void): void {
        callback();
    }

    getOptions(callback: (options: any) => void, error: (reason) => void): any {
        callback({ url: "url", customData: this.customData });
        return {};
    }

    bringToFront(callback:any, errorCallback: any) {
        callback();
    }

    addEventListener(eventName: string, listener: any): void { }

    removeEventListener(eventName: string, listener: any): void { }
}

describe("OpenFinContainerWindow", () => {
    let innerWin: any;
    let win: OpenFinContainerWindow;

    beforeEach(() => {
        innerWin = new MockWindow();
        win = new OpenFinContainerWindow(innerWin);
    });

    it("Wrapped window is retrievable", () => {
        expect(win).toBeDefined();
        expect(win.innerWindow).toBeDefined();
        expect(win.innerWindow).toEqual(innerWin);
    });

    it("id returns underlying name", () => {
        innerWin.name = "NAME";
        expect(win.id).toEqual("NAME");
    });

    it("name returns underlying name", () => {
        innerWin.name = "NAME";
        expect(win.name).toEqual("NAME");
    });

    it("nativeWindow invokes underlying getNativeWindow", () => {
        expect(win.nativeWindow).toBeDefined();
        expect(win.nativeWindow).toEqual(innerWin.nativeWindow);
    });

    describe("focus", () => {
        it("focus invokes underlying focus", async () => {
            const focusSpy = vi.spyOn(innerWin, 'focus');
            await win.focus();
            expect(focusSpy).toHaveBeenCalled();
        });
    });

    describe("show", () => {
        it("show invokes underlying show", async () => {
            const showSpy = vi.spyOn(innerWin, 'show');
            await win.show();
            expect(showSpy).toHaveBeenCalled();
        });
    });

    describe("hide", () => {
        it("hide invokes underlying hide", async () => {
            const hideSpy = vi.spyOn(innerWin, 'hide');
            await win.hide();
            expect(hideSpy).toHaveBeenCalled();
        });
    });

    describe("close", () => {
        it("close invokes underlying close", async () => {
            const closeSpy = vi.spyOn(innerWin, 'close');
            await win.close();
            expect(closeSpy).toHaveBeenCalled();
        });
    });
});

describe("OpenFinMessageBus", () => {
    let mockBus: MockInterApplicationBus;
    let bus: OpenFinMessageBus;

    beforeEach(() => {
        bus = new OpenFinMessageBus(mockBus = new MockInterApplicationBus() as any, "uuid");
    });

    it("subscribe invokes underlying subscribe", async () => {
        const subscribeSpy = vi.spyOn(mockBus, 'subscribe');
        await bus.subscribe("topic", () => {});
        expect(subscribeSpy).toHaveBeenCalledOnce();
    });

    it("unsubscribe invokes underlying unsubscribe", async () => {
        const unsubscribeSpy = vi.spyOn(mockBus, 'unsubscribe');
        await bus.unsubscribe("topic", () => {});
        expect(unsubscribeSpy).toHaveBeenCalledOnce();
    });

    it("publish invokes underlying publish", async () => {
        const publishSpy = vi.spyOn(mockBus, 'publish');
        await bus.publish("topic", "message");
        expect(publishSpy).toHaveBeenCalledOnce();
    });
});
