import {} from "jasmine";
import { Guid } from "../../src/guid";

describe("Guid", () => {
    describe("newGuid()", () => {
        let guid: string = Guid.newGuid();

        it("Returns a value", () => {
            expect(guid).toBeDefined();
        });

        it ("Is correct format", () => {
            expect(guid.length).toEqual(36);
            expect(guid.charAt(14)).toEqual("4"); // Guid v4
        });

        it ("Next not equal to previous", () => {
            expect(Guid.newGuid()).not.toEqual(guid);            
        });
    });
});
