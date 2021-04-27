import {} from "jasmine";
import { MenuItem } from "../../src/menu";

describe('menu', () => {
    const item: MenuItem = new MenuItem();

    describe('id', () => {
        it("Set matches Get", () => {
            item.id = "ID";
            expect(item.id).toEqual("ID");
        });
    });

    describe('label', () => {
        it("Set matches Get", () => {
            item.label = "LABEL";
            expect(item.label).toEqual("LABEL");
        });
    });
});