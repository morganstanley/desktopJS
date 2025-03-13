
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
import { describe, it, expect, beforeEach, vi } from 'vitest';

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
        expect(win.innerWindow).toBe(innerWin);
    });

    it("id returns underlying id", () => {
        innerWin.id = "ID";
        expect(win.id).toBe("ID");
    });

    it("name returns underlying name", () => {
        innerWin.name = "NAME";
        expect(win.name).toBe("NAME");
    });

    describe("Window members", () => {
        it("load", async () => {
            const loadSpy = vi.spyOn(innerWin, "loadURL");
            await win.load("url");
            expect(loadSpy).toHaveBeenCalledWith("url");
        });

        it("load with options", async () => {
            const loadSpy = vi.spyOn(innerWin, "loadURL");
            const options = { prop: "value" };
            await win.load("url", options);
            expect(loadSpy).toHaveBeenCalledWith("url", options);
        });

        it("focus", async () => {
            const focusSpy = vi.spyOn(innerWin, "focus");
            await win.focus();
            expect(focusSpy).toHaveBeenCalled();
        });

        it("show", async () => {
            const showSpy = vi.spyOn(innerWin, "show");
            await win.show();
            expect(showSpy).toHaveBeenCalled();
        });

        it("hide", async () => {
            const hideSpy = vi.spyOn(innerWin, "hide");
            await win.hide();
            expect(hideSpy).toHaveBeenCalled();
        });

        it("close", async () => {
            const closeSpy = vi.spyOn(innerWin, "close");
            await win.close();
            expect(closeSpy).toHaveBeenCalled();
        });

        it("minimize", async () => {
            const browserWindow = { minimize: vi.fn() };
            await new ElectronContainerWindow(browserWindow, null).minimize();
            expect(browserWindow.minimize).toHaveBeenCalledTimes(1);
        });

        it("maximize", async () => {
            const browserWindow = { maximize: vi.fn() };
            await new ElectronContainerWindow(browserWindow, null).maximize();
            expect(browserWindow.maximize).toHaveBeenCalledTimes(1);
        });
        
        it("restore", async () => {
            const browserWindow = { restore: vi.fn() };
            await new ElectronContainerWindow(browserWindow, null).restore();
            expect(browserWindow.restore).toHaveBeenCalledTimes(1);
        });

        it("isShowing", async () => {
            const isVisibleSpy = vi.spyOn(innerWin, "isVisible");
            const showing = await win.isShowing();
            expect(showing).toBeDefined();
            expect(showing).toBe(true);
            expect(isVisibleSpy).toHaveBeenCalled();
        });

        describe("getState", () => {
            it("getState undefined", async () => {
                const state = await win.getState();
                expect(state).toBeUndefined();
            });
        });

        it("setState invokes underlying window", async () => {
            const executeJavaScriptSpy = vi.spyOn(win.innerWindow.webContents, "executeJavaScript");
            await win.setState({ value: "123" });
            expect(executeJavaScriptSpy).toHaveBeenCalled();
        });

        it("getBounds gets underlying window position", async () => {
            const getBoundsSpy = vi.spyOn(win.innerWindow, "getBounds");
            const bounds = await win.getBounds();
            expect(getBoundsSpy).toHaveBeenCalled();
            expect(bounds).toBeDefined();
            expect(bounds.x).toBe(0);
            expect(bounds.y).toBe(1);
            expect(bounds.width).toBe(2);
            expect(bounds.height).toBe(3);
        });

        it("setBounds sets underlying window position", async () => {
            const setBoundsSpy = vi.spyOn(win.innerWindow, "setBounds");
            const bounds = { x: 0, y: 1, width: 2, height: 3 };
            await win.setBounds(bounds);
            expect(setBoundsSpy).toHaveBeenCalledWith(bounds);
        });
    });

    describe("window grouping", () => {
        it("allowGrouping is true", () => {
            expect(win.allowGrouping).toBe(true);
        });

        it("getGroup calls container windowManager", () => {
            win = new ElectronContainerWindow(innerWin, container);
            vi.spyOn(win, "isRemote", "get").mockReturnValue(false);
            (container as any).windowManager = { getGroup: vi.fn().mockReturnValue([]) };
            const spy = vi.spyOn((container as any).windowManager, "getGroup");
            win.getGroup();
            expect(spy).toHaveBeenCalled();
        });

        it("joinGroup invokes windowManager", () => {
            win = new ElectronContainerWindow(innerWin, container);
            vi.spyOn(win, "isRemote", "get").mockReturnValue(false);
            (container as any).windowManager = { groupWindows: vi.fn() };
            const targetWin = new ElectronContainerWindow(innerWin, container);
            vi.spyOn(targetWin, "id", "get").mockReturnValue("2");
            win.joinGroup(targetWin);
            expect((container as any).windowManager.groupWindows).toHaveBeenCalled();
        });

        it("leaveGroup invokes windowManager", async () => {
            win = new ElectronContainerWindow(innerWin, container);
            vi.spyOn(win, "isRemote", "get").mockReturnValue(false);
            (container as any).windowManager = { ungroupWindows: vi.fn() };
            await win.leaveGroup();
            expect((container as any).windowManager.ungroupWindows).toHaveBeenCalled();
        });
    });
});
