import * as desktopJS from "../../src/desktop";

describe("desktop", () => {
    it ("module exports", () => {
        expect(desktopJS.default.registerContainer).toBeDefined();
    });
});