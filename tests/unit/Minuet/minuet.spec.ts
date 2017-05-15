import { MinuetContainer } from "../../../src/Minuet/minuet";

class MockApp {
    window: any = new MockWindow();
}

class MockWindow {
    create(url: string, options: any): any {
        return {}
    };
}

describe("MinuetContainer", () => {
    let container: MinuetContainer;
    let mockApp: MockApp;
    let mockWindow: MockWindow;

    beforeEach(() => {
        mockApp = new MockApp();
        mockWindow = mockApp.window;
        container = new MinuetContainer(mockApp);
    });

    it("hostType is Minuet/Paragon", () => {
        expect(container.hostType).toEqual("Minuet/Paragon");
    });

    it("showWindow", () => {
        spyOn<any>(mockWindow, "create").and.callThrough();
        container.showWindow("url");
        expect(mockWindow.create).toHaveBeenCalledWith("url", {});
    });
});
