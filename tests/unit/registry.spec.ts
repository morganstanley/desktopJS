import * as registry from "../../src/registry";
import { Container } from "../../src/container";
import { DefaultContainer } from "../../src/Default/default";

class TestContainer extends DefaultContainer {
    static condition(options?: any): boolean {
        return options && options.hostType === "Test";
    }

    static create(): Container {
        return new TestContainer();
    }

    constructor() {
        super();
        this.hostType = "Test";
    }
}

describe("registry", () => {
    describe("resolveContainer", () => {
        beforeEach(() => {
            registry.clearRegistry();
        });

        it("No matching condition resolves default", () => {
            let container: Container = registry.resolveContainer(true);
            expect(container).toBeDefined();
            expect(container.hostType).toEqual("Default");
        });

        it("Subsequent call returns from cache", () => {
            let container: Container = registry.resolveContainer(true);
            spyOn(registry, "container").and.returnValue(container);
            let container2: Container = registry.resolveContainer(); // Specifically testing cached value
            expect(container2).toBeDefined();
            expect(container2.uuid).toEqual(container.uuid);
        });

        it("Resolves registered test container", () => {
            registry.registerContainer("Test", { condition: TestContainer.condition, create: TestContainer.create });

            let container: Container = registry.resolveContainer(true, {hostType: "Test"});
            expect(container).toBeDefined();
            expect(container.hostType).toEqual("Test");
        });

        it("Error on resolve logs to console", () => {
            spyOn(console, "error");
            registry.registerContainer("Test", { condition: () => { throw new Error("Forced Error") }, create: TestContainer.create });
            let container: Container = registry.resolveContainer(true);
            expect(console.error).toHaveBeenCalledWith("Error resolving container 'Test': Error: Forced Error");
        });

        it ("resolveContainer passes options", () => {
            const providedOptions = {};
            let condition: boolean = false;
            let create: boolean = false;

            registry.registerContainer("Test",
            {
                condition: (options) => { return condition = (options === providedOptions) },
                create: (options) => { create = (options === providedOptions); return new TestContainer() }
            });

            let container: Container = registry.resolveContainer(true, providedOptions);

            expect(condition).toBeTruthy();
            expect(create).toBeTruthy();
        });
    });
});
