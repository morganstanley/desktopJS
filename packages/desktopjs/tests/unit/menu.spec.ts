import {} from "jasmine";
import { MenuItem } from "../../src/menu";

describe("menu", () => {
  const item: MenuItem = new MenuItem();

  describe("id", () => {
    it("Set matches Get", () => {
      expect((item.id = "ID")).toEqual("ID");
    });
  });

  describe("label", () => {
    it("Set matches Get", () => {
      expect((item.label = "LABEL")).toEqual("LABEL");
    });
  });
});
