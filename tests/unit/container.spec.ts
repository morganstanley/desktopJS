import { ContainerBase, WebContainerBase } from "../../src/container";
import { ContainerWindow } from "../../src/window";
import { NotificationOptions } from "../../src/notification";

class TestContainer extends ContainerBase {
    getMainWindow(): ContainerWindow {
        return undefined;
    }

    showWindow(url: string, options?: any): ContainerWindow {
        return undefined;
    }
}

describe("container", () => {
    describe("ContainerBase", () => {
        let container: ContainerBase = new TestContainer();

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
    });
});
