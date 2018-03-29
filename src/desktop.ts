import { resolveContainer, registerContainer, ContainerRegistration } from "./registry";
import { Container } from "./container";
import { ContainerNotification } from "./notification";
import { ObjectTransform } from "./propertymapping";
import { ContainerWindow, WindowStateTracking, GroupWindowManager, SnapAssistWindowManager } from "./window";
import * as Default from "./Default/default";
import * as Electron from "./Electron/electron";
import * as OpenFin from "./OpenFin/openfin";

export default class Desktop { //tslint:disable-line
    static get version(): string { return "PACKAGE_VERSION"; }
    static get Container(): typeof Container { return Container; }
    static get ContainerWindow(): typeof ContainerWindow { return ContainerWindow; }
    static get registerContainer(): typeof registerContainer { return registerContainer; }
    static get resolveContainer(): typeof resolveContainer { return resolveContainer; }
    static get ContainerNotification(): typeof ContainerNotification { return ContainerNotification; }
    static get ObjectTransform(): typeof ObjectTransform { return ObjectTransform; }
    static get Default(): typeof Default { return Default; }
    static get Electron(): typeof Electron { return Electron; }
    static get OpenFin(): typeof OpenFin { return OpenFin; }
    static get WindowStateTracking(): typeof WindowStateTracking { return WindowStateTracking; }
    static get GroupWindowManager(): typeof GroupWindowManager { return GroupWindowManager; }
    static get SnapAssistWindowManager(): typeof SnapAssistWindowManager { return SnapAssistWindowManager; }
}
