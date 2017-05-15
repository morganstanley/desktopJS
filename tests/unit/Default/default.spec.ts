import { DefaultContainerWindow, DefaultContainer } from "../../../src/Default/default";

class TestWindow {
    public focus(): void { };
    public show(): void { };
}

describe("DefaultContainerWindow", () => {
    const mockWindow = new TestWindow();
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
});

describe("DefaultContainer", () => {
    let window: Window;

    beforeEach(() => {
        window = jasmine.createSpyObj<Window>("window", ["open"]);
    });

    it("hostType is Default", () => {
        let container: DefaultContainer = new DefaultContainer();
        expect(container.hostType).toEqual("Default");
    });

    describe("showWindow", () => {
        let container: DefaultContainer;

        beforeEach(() => {
            container = new DefaultContainer(window)
        });

        it("Returns a DefaultContainerWindow and invokes underlying window.open", () => {
            let newWin: DefaultContainerWindow = container.showWindow("url");
            expect(window.open).toHaveBeenCalledWith("url", "_blank", undefined);
        });

        it("Options target property maps to open target parameter", () => {
            let newWin: DefaultContainerWindow = container.showWindow("url", { target: "MockTarget" });
            expect(window.open).toHaveBeenCalledWith("url", "MockTarget", "target=MockTarget,");
        });

        it("Options parameters are converted to features", () => {
            let newWin: DefaultContainerWindow = container.showWindow("url",
                {
                    x: "x0",
                    y: "y0"
                });
            expect(window.open).toHaveBeenCalledWith("url", "_blank", "left=x0,top=y0,");
        });
    });

    it("getMainWindow returns DefaultContainerWindow wrapping scoped window", () => {
        let container: DefaultContainer = new DefaultContainer(window);
        let win: DefaultContainerWindow = container.getMainWindow();
        expect(win).toBeDefined();
        expect(win.containerWindow).toEqual(window);
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
});
