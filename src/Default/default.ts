import { WebContainerBase } from "../container";
import { ContainerWindow } from "../window";
import { NotificationOptions } from "../notification";
import { ObjectTransform, PropertyMap } from "../propertymapping";

/**
 * @augments ContainerWindow
 */
export class DefaultContainerWindow implements ContainerWindow {
    public containerWindow: any;

    public constructor(wrap: any) {
        this.containerWindow = wrap;
    }

    public focus(): Promise<void> {
        this.containerWindow.focus();
        return Promise.resolve();
    }

    public show(): Promise<void> {
        return Promise.resolve();
    }

    public hide(): Promise<void> {
        return Promise.resolve();
    }

    public isShowing(): Promise<boolean> {
        // https://github.com/ai/visibilityjs ?
        return Promise.resolve(true);
    }

    public getSnapshot(): Promise<string> {
        return Promise.reject("getSnapshot requires an implementation.");
    }
}

declare var Notification: any;

/**
 * @augments WebContainerBase
 */
export class DefaultContainer extends WebContainerBase {
    private mainWindow: ContainerWindow;

    public static readonly defaultWindowOptionsMap: PropertyMap = {
        x: { target: "left" },
        y: { target: "top" }
    };

    public windowOptionsMap: PropertyMap = DefaultContainer.defaultWindowOptionsMap;

    public constructor(win?: Window) {
        super(win);
        this.hostType = "Default";
    }

    public getMainWindow(): ContainerWindow {
        if (!this.mainWindow) {
            this.mainWindow = new DefaultContainerWindow(this.globalWindow);
        }

        return this.mainWindow;
    }

    protected getWindowOptions(options?: any): any {
        return ObjectTransform.transformProperties(options, this.windowOptionsMap);
    }

    protected wrapWindow(containerWindow: any) {
        return new DefaultContainerWindow(containerWindow);
    }

    public showWindow(url: string, options?: any): ContainerWindow {
        let features: string;
        let target = "_blank";

        const newOptions = this.getWindowOptions(options);

        if (newOptions) {
            for (const prop in newOptions) {
                features = (features ? features : "") + prop + "=" + newOptions[prop] + ",";
            }

            if (newOptions && "target" in newOptions) {
                target = newOptions.target;
            }
        }

        return this.wrapWindow(this.globalWindow.open(url, target, features));
    }

    public showNotification(options: NotificationOptions) {
        if (!("Notification" in this.globalWindow)) {
            console.warn("Notifications not supported");
            return;
        }

        (<any>this.globalWindow).Notification.requestPermission(permission => {
            if (permission === "denied") {
                console.warn("Notifications not permitted");
            } else if (permission === "granted") {
                new (<any>this.globalWindow).Notification(options.title, { body: options.message }); // tslint:disable-line
            }
        });
    }
}