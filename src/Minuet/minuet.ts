import * as ContainerRegistry from "../registry";
import { ContainerWindow } from "../window";
import { ContainerBase } from "../container";
import { ObjectTransform, PropertyMap } from "../propertymapping";
import { DefaultContainer, DefaultContainerWindow } from "../Default/default";

declare var paragon: any;

ContainerRegistry.registerContainer("Minuet", { condition: () => (typeof paragon !== "undefined" && paragon), create: () => new MinuetContainer() });

/**
 * @extends DefaultContainer
 */
export class MinuetContainer extends DefaultContainer { // tslint:disable-line
    private app: any;

    public static readonly windowOptionsMap: PropertyMap = {
    };

    public windowOptionsMap: PropertyMap = MinuetContainer.windowOptionsMap;

    public constructor(app?: any) {
        super();
        this.app = app || paragon.app;
        this.hostType = "Minuet/Paragon";
    }

    protected getWindowOptions(options?: any): any {
        return ObjectTransform.transformProperties(options, this.windowOptionsMap);
    }

    protected wrapWindow(containerWindow: any) {
        return new DefaultContainerWindow(containerWindow);
    }

    public createWindow(url: string, options?: any): ContainerWindow {
        const newOptions = this.getWindowOptions(options);
        return this.wrapWindow(this.app.window.create(url, newOptions));
    }
}
