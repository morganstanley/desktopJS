import * as registry from "../../src/registry";
import { Container } from "../../src/container";
import { DefaultContainer } from "../../src/Default/default";

function registerCallback(): boolean {
    return true;
}

function createCallback(): DefaultContainer {
    return new TestContainer();
}

class TestContainer extends DefaultContainer {
    constructor() {
        super();
        this.hostType = "Test";
    }
}

describe("registry", () => {
    describe("resolveContainer", () => {
        let container: Container = registry.resolveContainer();

        it("No matching condition resolves default", () => {
            expect(container).toBeDefined();
            expect(container.hostType).toEqual("Default");
        });

        it("Subsequent call returns from cache", () => {
            let container2: Container = registry.resolveContainer();
            expect(container2).toBeDefined();
            expect(container2).toEqual(container);
        });

        it("Resolves registered test container", () => {
            registry.registerContainer("Test", { condition: registerCallback, create: createCallback });

            let container: Container = registry.resolveContainer(true);
            expect(container).toBeDefined();
            expect(container.hostType).toEqual("Test");
        });

        it("Error on resolve logs to console", () => {
            spyOn(console, "error");
            registry.registerContainer("Test", { condition: () => { throw new Error("Forced Error") }, create: createCallback });
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
