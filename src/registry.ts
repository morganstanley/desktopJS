import { Container } from "./container";
import { DefaultContainer } from "./Default/default";

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

const registeredContainers: Map<string, ContainerRegistration> = new Map();

/** Clears all container registrations. */
export function clearRegistry() {
    registeredContainers.clear();
    container = undefined;
}

/** Register a container type in the registry.
 * @param {string} id Unique identifier of the container type (eg. Electron).
 * @param {ContainerRegistration} registration Registration details.
 */
export function registerContainer(id: string, registration: ContainerRegistration) {
    registeredContainers[id] = registration;
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
export function resolveContainer(force: boolean, options? :any): Container; // tslint:disable-line

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

    for (const entry in registeredContainers) {
        try {
            if (registeredContainers[entry].condition(options)) {
                return container = registeredContainers[entry].create(options);
            }
        } catch (e) {
            console.error("Error resolving container '" + entry + "': " + e.toString());
        }
    }

    return container = new DefaultContainer();
}
