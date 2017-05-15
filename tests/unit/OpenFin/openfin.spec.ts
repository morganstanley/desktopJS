import { OpenFinContainer, OpenFinContainerWindow } from "../../../src/OpenFin/openfin";

class MockDesktop {
    Window(): MockWindow { return new MockWindow(); }
    Notification(): any { return {}; }
}

class MockWindow {
    static getCurrent(): any { return {}; }
    getParentWindow(): any { return {}; }

    focus(callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }

    show(callback: () => void, error: (reason) => void): any {
        callback();
        return {};
    }

    hide(callback: () => void, error: (reason) => void): any {
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
}

describe("OpenFinContianerWindow", () => {
    let innerWin: any;
    let win: OpenFinContainerWindow;

    beforeEach(() => {
        innerWin = new MockWindow;
        win = new OpenFinContainerWindow(innerWin);
    });

    it("Wrapped window is retrievable", () => {
        expect(win).toBeDefined();
        expect(win.containerWindow).toBeDefined();
        expect(win.containerWindow).toEqual(innerWin);
    });

    it("focus", (done) => {
        spyOn(innerWin, "focus").and.callThrough();
        win.focus().then(() => {
            expect(innerWin.focus).toHaveBeenCalled();
        }).then(done);
    });

    it("show", (done) => {
        spyOn(innerWin, "show").and.callThrough();
        win.show().then(() => {
            expect(innerWin.show).toHaveBeenCalled();
        }).then(done);
    });

    it("hide", (done) => {
        spyOn(innerWin, "hide").and.callThrough();
        win.hide().then(() => {
            expect(innerWin.hide).toHaveBeenCalled();
        }).then(done);
    });

    it("isShowing", (done) => {
        spyOn(innerWin, "isShowing").and.callThrough();
        let success: boolean = false;

        win.isShowing().then((showing) => {
            success = true;
            expect(showing).toBeDefined();
            expect(showing).toEqual(true);
        }).then(() => {
            expect(success).toEqual(true);
            expect(innerWin.isShowing).toHaveBeenCalled();
        }).then(done);
    });

    describe("getSnapshot", () => {
        it("getSnapshot invokes underlying getSnapshot", (done) => {
            spyOn(innerWin, "getSnapshot").and.callThrough();
            let success: boolean = false;

            win.getSnapshot().then((snapshot) => {
                success = true;
                expect(snapshot).toBeDefined();
                expect(snapshot).toEqual("data:image/png;base64,");
            }).then(() => {
                expect(success).toEqual(true);
                expect(innerWin.getSnapshot).toHaveBeenCalled();
            }).then(done);
        });

        it("getSnapshot propagates internal error to promise reject", (done) => {
            spyOn(innerWin, "getSnapshot").and.callFake((callback, reject) => reject("Error"));
            let success: boolean = false;

            win.getSnapshot().catch((error) => {
                success = true;
                expect(error).toBeDefined();
            }).then(() => {
                expect(success).toEqual(true);
            }).then(done);
        });
    });
});

describe("OpenFinContainer", () => {
    let desktop: any;
    let container: OpenFinContainer;

    beforeEach(() => {
        desktop = new MockDesktop();
        container = new OpenFinContainer(desktop);
    });

    it("hostType is OpenFin", () => {
        expect(container.hostType).toEqual("OpenFin");
    });

    describe("showWindow", () => {
        beforeEach(() => {
            spyOn(desktop, "Window").and.stub();
        });

        it("defaults", () => {
            let win: OpenFinContainerWindow = container.showWindow("url");
            expect(win).toBeDefined();
            expect(desktop.Window).toHaveBeenCalledWith({ autoShow: true, url: "url", name: "url" });
        });

        it("showWindow defaults", () => {
            spyOn<any>(container, "ensureAbsoluteUrl").and.returnValue("absoluteIcon");

            let win: OpenFinContainerWindow = container.showWindow("url",
                {
                    x: "x",
                    y: "y",
                    height: "height",
                    width: "width",
                    taskbar: "taskbar",
                    center: "center",
                    icon: "icon"
                });

            expect(win).toBeDefined();
            expect(desktop.Window).toHaveBeenCalledWith(
                {
                    defaultLeft: "x",
                    defaultTop: "y",
                    defaultHeight: "height",
                    defaultWidth: "width",
                    showTaskbarIcon: "taskbar",
                    defaultCentered: "center",
                    icon: "absoluteIcon",
                    autoShow: true,
                    saveWindowState: false,
                    url: "url",
                    name: "url"
                }
            );
        });
    });


    it("showNotification passes message and invokes underlying notification api", () => {
        spyOn(desktop, "Notification").and.stub();
        container.showNotification({ tile: "title", message: "Test message", url: "notification.html" });
        expect(desktop.Notification).toHaveBeenCalledWith({ url: "notification.html", message: { message: "Test message" } });
    });
});