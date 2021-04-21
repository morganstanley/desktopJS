import {} from "jasmine";
import { MessageBusSubscription } from "../../src/ipc";

describe("ipc", () => {
    describe("new MessageBusSubscription()", () => {
        it("parameters set on properties", () => {
            const options = {};
            const callback = jasmine.createSpy('callback');
            const sub = new MessageBusSubscription("topic", callback, options);

            expect(sub.topic).toEqual("topic");
            expect(sub.listener).toEqual(callback);
            expect(sub.options).toEqual(options);
        });
    });
});
