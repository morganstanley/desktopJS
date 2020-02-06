/**
 * @module @morgan-stanley/desktopjs
 */

import { Container } from "./container";
import { Default } from "./Default/default";

/** Represents the registration details of a container. */
export class ContainerRegistration {
    /** Callback used to uniquely identify whether the current scope is for this type of container.
     * @param {any} options (Optional) Options provided to {@link resolveContainer}.
     */
    condition: (options?: any) => boolean;

    /** Factory callback used to create this type of container.
     * @param {any} options (Optional) Options provided to {@link resolveContainer}.
     */
    create: (options?: any) => Container;
}

const registeredContainers: { id: string, registration: ContainerRegistration }[] = [];

/** Clears all container registrations. */
export function clearRegistry() {
    registeredContainers.splice(0, registeredContainers.length);
    container = undefined;
}

/** Register a container type in the registry.
 * @param {string} id Unique identifier of the container type (eg. Electron).
 * @param {ContainerRegistration} registration Registration details.
 */
export function registerContainer(id: string, registration: ContainerRegistration) {
    registeredContainers.push({ id: id, registration: registration });
}

export let container: Container;

/** Resolve the current container.
 * @param {boolean} force (Optional) Determines whether to always create a new instance or returned the cached instance.
 * @returns {Container} Current concrete container.  If no match is found, a DefaultContainer.
 */
export function resolveContainer(force?: boolean): Container; // tslint:disable-line

/** Resolve the current container.
 * @param {any} options (Optional) Options to pass through to condition and create factory method.
 * @returns {Container} Current concrete container.  If no match is found, a DefaultContainer.
 */
export function resolveContainer(options?: any): Container; // tslint:disable-line

/** Resolve the current container.
 * @param {boolean} force Determines whether to always create a new instance or returned the cached instance.
 * @param {any} options (Optional) Options to pass through to condition and create factory method.
 * @returns {Container} Current concrete container.  If no match is found, a DefaultContainer.
 */
export function resolveContainer(force: boolean, options?: any): Container; // tslint:disable-line

export function resolveContainer(param1?: boolean | any, param2?: any): Container {
    let force = false;
    let options = param2;

    if (typeof param1 === "boolean") {
        force = param1;
    } else {
        options = param1;
    }

    if (!force && container) {
        return container;
    }
    let registration: ContainerRegistration, containerId: string;
    try {
        for (let i: number = 0; i < registeredContainers.length; i++) { // tslint:disable-line
            containerId = registeredContainers[i].id;
            const testReg: ContainerRegistration = registeredContainers[i].registration;
            registration = testReg.condition(options) ? testReg : registration;
        }
        container = registration ? registration.create(options) : undefined;
    } catch (e) {
        console.error(`Error resolving container '${containerId}' : ${e.toString()}`);
    } finally {
        container = container || new Default.DefaultContainer();
    }

    return container;
}
