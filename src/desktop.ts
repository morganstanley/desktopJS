import { resolveContainer, registerContainer, ContainerRegistration, container } from "./registry";
import * as Container from "./container";
import * as Default from "./Default/default";
import * as Electron from "./Electron/electron";
import * as OpenFin from "./OpenFin/openfin";

const exportDesktopJS = {
    container,
    registerContainer,
    resolveContainer,
    Default,
    Electron,
    OpenFin
};

export default exportDesktopJS; // tslint:disable-line
