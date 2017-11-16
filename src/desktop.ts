import { resolveContainer, registerContainer, ContainerRegistration, container } from "./registry";
import { Container } from "./container";
import { ContainerWindow } from "./window";
import * as Default from "./Default/default";
import * as Electron from "./Electron/electron";
import * as OpenFin from "./OpenFin/openfin";

const exportDesktopJS = {
    Container,
    ContainerWindow,
    container,
    registerContainer,
    resolveContainer,
    Default,
    Electron,
    OpenFin
};

export default exportDesktopJS; // tslint:disable-line
