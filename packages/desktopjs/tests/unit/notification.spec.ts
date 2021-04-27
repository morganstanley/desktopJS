import {} from "jasmine";
import { ContainerNotification } from "../../src/notification";

class TestNotification extends ContainerNotification {
}

describe('notification', () => {
    it("ctor", () => {
        const options = {};
        const notification = new TestNotification("title", options);
        expect(notification).toBeDefined();
    });

    it("permission defaulted to granted", () => {
        expect (ContainerNotification.permission).toEqual("granted");
    });

    it ("requestPermission invokes callback", (done) => {
        ContainerNotification.requestPermission(done);
    });

    it ("requestPermission resolves the returned Promise", async () => {
        await ContainerNotification.requestPermission();
    });
});