import {} from "jasmine";
import * as desktopJS from "../../src/desktop";

describe("desktop", () => {
    it ("module exports", () => {
        expect(desktopJS.registerContainer).toBeDefined();
        expect(desktopJS.version).toBeDefined();
    });
});