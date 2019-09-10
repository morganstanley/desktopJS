import {} from "jasmine";
import * as registry from "../../src/registry";
import { Container } from "../../src/container";
import { Default } from "../../src/Default/default";

describe("registry", () => {
    describe("resolveContainer", () => {
        let mockContainer: jasmine.SpyObj<Container>;

        // tslint:disable-next-line: mocha-no-side-effect-code
        const setUpContainer = (registration?: registry.ContainerRegistration, id: string = "Test", hostType: string = "Test") => {
            mockContainer = jasmine.createSpyObj<Container>("Container", ["createWindow"]);
            mockContainer.hostType = hostType;

            registration = registration || {
                condition: (options?: any): boolean => true,
                create: (): Container => mockContainer
            };
            registry.registerContainer(id, registration );
        };

        beforeEach(() => {
            registry.clearRegistry();
            setUpContainer();
        });

        it("ClearRegistry should clear all", () => {
            setUpContainer();
            registry.resolveContainer();

            expect(registry.container).toBeDefined();
            registry.clearRegistry();
            expect(registry.container).not.toBeDefined();
        });

        it("No matching condition resolves default", () => {
            registry.clearRegistry();
            registry.registerContainer("Test", { condition: () => false, create: () => mockContainer });
            const container: Container = registry.resolveContainer(true);
            expect(container).toBeDefined();
            expect(container.hostType).toEqual("Default");
        });

        // tslint:disable-next-line: mocha-no-side-effect-code
        it("Subsequent call returns from cache", () => {
            const container: Container = registry.resolveContainer(true);
            spyOn(registry, "container").and.returnValue(container);
            const container2: Container = registry.resolveContainer(); // Specifically testing cached value
            expect(container2).toBeDefined();
            expect(container2.uuid).toEqual(container.uuid);
        });

        it("Resolves registered test container", () => {
            const container: Container = registry.resolveContainer(true);
            expect(container).toBeDefined();
            expect(container.hostType).toEqual("Test");
        });

        it("Error on resolve logs to console", () => {
            spyOn(console, "error");
            setUpContainer({ condition: () => { throw new Error("Forced Error"); }, create: () => mockContainer });
            const container: Container = registry.resolveContainer(true);
            expect(console.error).toHaveBeenCalledWith("Error resolving container 'Test' : Error: Forced Error" );
        });

        it ("resolveContainer passes options", () => {
            const providedOptions = {};
            let condition: boolean = false;
            let create: boolean = false;

            registry.registerContainer("TestContainer",
            {
                condition: (options) => { 
                    console.log('condition', (options === providedOptions)); // tslint:disable-line
                    return condition = (options === providedOptions);
                },
                create: (options) => { create = (options === providedOptions); return mockContainer; }
            });

            const container: Container = registry.resolveContainer(true, providedOptions);

            expect(condition).toBeTruthy();
            expect(create).toBeTruthy();
        });

        it ("resolveContainer resolves in order", () => {
            const hostType: string = "AnotherContainer";
            let mockContainer2;
            setUpContainer({ condition: () => true, create: () => mockContainer });
            registry.registerContainer("Test", { condition: () => true, create: () => {
                mockContainer2 = jasmine.createSpyObj<Container>("Container", ["createWindow"]);
                mockContainer2.hostType = hostType;
                return mockContainer2;
            } });

            const container: Container = registry.resolveContainer(true);
            expect(container.hostType).toBe(hostType);
        });
    });
});
