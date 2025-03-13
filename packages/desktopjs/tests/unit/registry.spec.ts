/*
 * Morgan Stanley makes this available to you under the Apache License,
 * Version 2.0 (the "License"). You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0.
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Unless required by applicable law or agreed
 * to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as registry from "../../src/registry";
import { Container } from "../../src/container";

describe("registry", () => {
    describe("resolveContainer", () => {
        let mockContainer: Container;
        const setUpContainer = (registration?: registry.ContainerRegistration, id = "Test", hostType = "Test") => {
            mockContainer = {
                createWindow: vi.fn(),
                hostType
            } as unknown as Container;

            registration = registration || {
                condition: (_options?: any): boolean => true,
                create: (): Container => mockContainer
            };
            registry.registerContainer(id, registration);
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
            expect(container.hostType).toBe("Default");
        });

        it("Subsequent call returns from cache", () => {
            const container: Container = registry.resolveContainer(true);
            vi.spyOn(registry, "container", "get").mockReturnValue(container);
            const container2: Container = registry.resolveContainer(); // Specifically testing cached value
            expect(container2).toBeDefined();
            expect(container2.uuid).toBe(container.uuid);
        });

        it("Resolves registered test container", () => {
            const container: Container = registry.resolveContainer(true);
            expect(container).toBeDefined();
            expect(container.hostType).toBe("Test");
        });

        it("Error on resolve logs to console", () => {
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            setUpContainer({ condition: () => { throw new Error("Forced Error"); }, create: () => mockContainer });
            const container: Container = registry.resolveContainer(true);
            expect(consoleSpy).toHaveBeenCalledWith("Error resolving container 'Test' : Error: Forced Error");
        });

        it("resolveContainer passes options", () => {
            const providedOptions = {};
            let condition = false;
            let create = false;

            registry.registerContainer("TestContainer",
            {
                condition: (options) => condition = (options === providedOptions),
                create: (options) => { create = (options === providedOptions); return mockContainer; }
            });

            const container: Container = registry.resolveContainer(true, providedOptions);

            expect(condition).toBe(true);
            expect(create).toBe(true);
        });

        it("resolveContainer resolves in order", () => {
            const hostType = "AnotherContainer";
            let mockContainer2: Container;
            setUpContainer({ condition: () => true, create: () => mockContainer });
            registry.registerContainer("Test", { 
                condition: () => true, 
                create: () => {
                    mockContainer2 = {
                        createWindow: vi.fn(),
                        hostType
                    } as unknown as Container;
                    return mockContainer2;
                } 
            });

            const container: Container = registry.resolveContainer(true);
            expect(container.hostType).toBe(hostType);
        });
    });
});
