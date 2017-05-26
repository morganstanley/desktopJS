import { OpenFinContainer, OpenFinContainerWindow, OpenFinMessageBus } from "../../../src/OpenFin/openfin";
import { MessageBusSubscription } from "../../../src/ipc";

class MockDesktop {
    Window(): MockWindow { return new MockWindow(); }
    Notification(): any { return {}; }
    InterApplicationBus(): any { return new MockInterApplicationBus(); }
    Application: any = { getCurrent() { return { uuid: "uuid" } } }
}

class MockInterApplicationBus {
    subscribe(uuid: string, name: string, topic: string, listener: (message: any, uuid: string, name: string) => void, callback?: () => void, errorCallback?: (reason: string) => void): void {
        callback();
    }

    unsubscribe(senderUuid: string, name: string, topic: string, listener: (message: any, uuid: string, name: string) => void, callback?: () => void, errorCallback?: (reason: string) => void): void {
        callback();
    }

    send(destinationUuid: string, name: string, topic: string, message: any, callback?: () => void, errorCallback?: (reason: string) => void): void {
        callback();
    }

    publish(topic: string, message: any, callback?: () => void, errorCallback?: (reason: string) => void): void {
        callback();
    }

    addSubscribeListener() { }
    addUnsubscribeListener() { }
    removeSubscribeListener() { }
    removeUnsubscribeListener() { }
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

describe("OpenFinContainerWindow", () => {
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
        container.showNotification({ title: "title", message: "Test message", url: "notification.html" });
        expect(desktop.Notification).toHaveBeenCalledWith({ url: "notification.html", message: { message: "Test message" } });
    });
});

describe("OpenFinMessageBus", () => {
    let mockBus: any;
    let bus: OpenFinMessageBus;

    function callback() { }

    beforeEach(() => {
        bus = new OpenFinMessageBus(<any>(mockBus = new MockInterApplicationBus()), "uuid");
    });

    it("subscribe invokes underlying subscribe", (done) => {
        spyOn(mockBus, "subscribe").and.callThrough();
        bus.subscribe("topic", callback).then((subscriber) => {
            expect(subscriber.listener).toEqual(jasmine.any(Function));
            spyOn(subscriber, "listener").and.callThrough();
            subscriber.listener();
            expect(subscriber.topic).toEqual("topic");
            expect(subscriber.listener).toHaveBeenCalled();
        }).then(done);
        expect(mockBus.subscribe).toHaveBeenCalledWith("*", undefined, "topic", jasmine.any(Function), jasmine.any(Function), jasmine.any(Function));
    });

    it("subscribe with options invokes underlying subscribe", (done) => {
        spyOn(mockBus, "subscribe").and.callThrough();
        bus.subscribe("topic", callback, { uuid: "uuid", name: "name" }).then(done);
        expect(mockBus.subscribe).toHaveBeenCalledWith("uuid", "name", "topic", jasmine.any(Function), jasmine.any(Function), jasmine.any(Function));
    });

    it("unsubscribe invokes underlying unsubscribe", (done) => {
        spyOn(mockBus, "unsubscribe").and.callThrough();
        bus.unsubscribe({ topic: "topic", listener: callback }).then(done);
        expect(mockBus.unsubscribe).toHaveBeenCalledWith("*", undefined, "topic", jasmine.any(Function), jasmine.any(Function), jasmine.any(Function));
    });

    it("unsubscribe with options invokes underlying unsubscribe", (done) => {
        spyOn(mockBus, "unsubscribe").and.callThrough();
        const sub: MessageBusSubscription = new MessageBusSubscription("topic", callback, { uuid: "uuid", name: "name" });
        bus.unsubscribe(sub).then(done);
        expect(mockBus.unsubscribe).toHaveBeenCalledWith("uuid", "name", "topic", jasmine.any(Function), jasmine.any(Function), jasmine.any(Function));
    });

    it("publish invokes underling publish", (done) => {
        let message: any = {};
        spyOn(mockBus, "publish").and.callThrough();
        bus.publish("topic", message).then(done);
        expect(mockBus.publish).toHaveBeenCalledWith("topic", message, jasmine.any(Function), jasmine.any(Function));
    });

    it("publish with optional uuid invokes underling send", (done) => {
        let message: any = {};
        spyOn(mockBus, "send").and.callThrough();
        bus.publish("topic", message, { uuid: "uuid" }).then(done);
        expect(mockBus.send).toHaveBeenCalledWith("uuid", undefined, "topic", message, jasmine.any(Function), jasmine.any(Function));
    });

    it("publish with optional name invokes underling send", (done) => {
        let message: any = {};
        spyOn(mockBus, "send").and.callThrough();
        bus.publish("topic", message, { uuid: "uuid", name: "name" }).then(done);
        expect(mockBus.send).toHaveBeenCalledWith("uuid", "name", "topic", message, jasmine.any(Function), jasmine.any(Function));
    });
});