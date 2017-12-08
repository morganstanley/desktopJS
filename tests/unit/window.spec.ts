import { Container } from "../../src/container";
import { ContainerWindow, WindowEventType, WindowEventArgs } from "../../src/window";
import { EventArgs, EventEmitter } from "../../src/events";
import { TestContainer, MockMessageBus } from "./container.spec";

class MockWindow extends ContainerWindow {
}

describe ("static events", () => {
    let container: TestContainer;

    beforeEach(() => {
        container = new TestContainer();
        (<any>EventEmitter).staticEventListeners = new Map();
    });

    it("addListener adds callback to listeners", () => {
        expect(ContainerWindow.listeners("window-created").length).toEqual(0);
        ContainerWindow.addListener("window-created", (event: EventArgs) => { /* empty */ });
        expect(ContainerWindow.listeners("window-created").length).toEqual(1);
    });

    it("removeListener removes callback to listeners", () => {
        expect(ContainerWindow.listeners("window-created").length).toEqual(0);
        const callback = (event: EventArgs) => { /* empty */ };
        ContainerWindow.addListener("window-created", callback);
        expect(ContainerWindow.listeners("window-created").length).toEqual(1);
        ContainerWindow.removeListener("window-created", callback);
        expect(ContainerWindow.listeners("window-created").length).toEqual(0);
    });

    it("emit invokes ipc publish", () => {
        const args = new EventArgs(undefined, "window-created", {});
        spyOn(container.ipc, "publish").and.callThrough();
        ContainerWindow.emit(<WindowEventType> args.name, <WindowEventArgs> args);
        expect(container.ipc.publish).toHaveBeenCalledWith("desktopJS.static-event", { eventName: "containerwindow-" + args.name, eventArgs: args });
    });
});

describe("window grouping", () => {
    it("allowGrouping is false", () => {
        expect(new MockWindow(null).allowGrouping).toEqual(false);
    });

    it ("getGroup returns empty array", (done) => {
        new MockWindow(null).getGroup().then(windows => {
            expect(windows).toBeDefined();
            expect(windows.length).toEqual(0);
        }).then(done);
    });

    it ("joinGroup not supported", (done) => {
        new MockWindow(null).joinGroup(null).catch(reason => {
            expect(reason).toEqual("Not supported");
        }).then(done);
    });

    it ("leaveGroup resolves", (done) => {
        new MockWindow(null).leaveGroup().then(() => {
            done();
        });
    });
});