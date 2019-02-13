import {} from "jasmine";
import { TrayIconDetails } from "../../src/tray";

describe("tray", () => {
    it ("create", () => {
        expect(new TrayIconDetails()).toBeDefined();
    });
});