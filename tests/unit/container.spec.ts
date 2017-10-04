import { ContainerBase, WebContainerBase } from "../../src/container";
import { ContainerWindow, PersistedWindowLayout, PersistedWindow } from "../../src/window";
import { NotificationOptions } from "../../src/notification";

class MockContainer extends ContainerBase {
}

class TestContainer extends ContainerBase {
    getMainWindow(): ContainerWindow {
        return undefined;
    }

    createWindow(url: string, options?: any): ContainerWindow {
        return undefined;
    }

    constructor() {
        super();

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
        container = new TestContainer();;
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
