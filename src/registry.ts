import { Container } from "./container";
import { DefaultContainer } from "./Default/default";

/** Represents the registration details of a container. */
export class ContainerRegistration {
    /** Callback used to uniquely identify whether the current scope is for this type of container. */
    condition: () => boolean;

    /** Factory callback used to create this type of container. */
    create: () => Container;
}

const registeredContainers: { [id: string]: ContainerRegistration } = {};

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
export function resolveContainer(force?: boolean): Container {
    if (!force && container) {
        return container;
    }

    for (const entry in registeredContainers) {
        try {
            if (registeredContainers[entry].condition()) {
                return container = registeredContainers[entry].create();
            }
        } catch (e) {
            console.error("Error resolving container '" + entry + "': " + e.toString());
        }
    }

    return container = new DefaultContainer();
}
