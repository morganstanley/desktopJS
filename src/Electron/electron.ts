import * as ContainerRegistry from "../registry";
import { ContainerWindow } from "../window";
import { ContainerBase } from "../container";
import { ObjectTransform, PropertyMap } from "../propertymapping";
import { NotificationOptions } from "../notification";
import { TrayIconDetails } from "../tray";
import { MenuItem } from "../menu";

ContainerRegistry.registerContainer("Electron", {
    condition: () => {
        try {
            return typeof require !== "undefined" && (require("electron") || require("electron").remote);
        } catch (e) {
            return false;
        }
    },
    create: () => new ElectronContainer()
});

/**
 * @augments ContainerWindow
 */
export class ElectronContainerWindow implements ContainerWindow {
    public containerWindow: any;

    public constructor(wrap: any) {
        this.containerWindow = wrap;
    }

    public focus(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.containerWindow.focus();
            resolve();
        });
    }

    public show(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.containerWindow.show();
            resolve();
        });
    }

    public hide(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.containerWindow.hide();
            resolve();
        });
    }

    public isShowing(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            resolve(this.containerWindow.isVisible());
        });
    }

    public getSnapshot(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.containerWindow.capturePage((snapshot) => {
                resolve("data:image/png;base64," + snapshot.toPNG().toString("base64"));
            });
        });
    }
}

/**
 * @extends ContainerBase
 */
export class ElectronContainer extends ContainerBase {
    protected isRemote: Boolean = true;
    protected mainWindow: ElectronContainerWindow;
    protected electron: any;
    protected app: any;
    protected browserWindow: any;
    protected tray: any;
    protected menu: any;

    public static readonly windowOptionsMap: PropertyMap = {
        taskbar: { target: "skipTaskbar", convert: (value: any, from: any, to: any) => { return !value; } }
    };

    public windowOptionsMap: PropertyMap = ElectronContainer.windowOptionsMap;

    public constructor(electron?: any) {
        super();
        this.hostType = "Electron";

        try {
            if (electron) {
                this.electron = electron;
            } else {
                // Check if we are in renderer or main by first accessing remote, if undefined switch to main
                this.electron = require("electron").remote;
                if (typeof this.electron === "undefined") {
                    this.electron = require("electron");
                    this.isRemote = false;
                }
            }

            this.app = this.electron.app;
            this.browserWindow = this.electron.BrowserWindow;
            this.tray = this.electron.Tray;
            this.menu = this.electron.Menu;
        } catch (e) {
            console.error(e);
        }
    }

    public getMainWindow(): ContainerWindow {
        if (!this.mainWindow) {
            let win = this.electron.getCurrentWindow();
            while (win.getParentWindow()) {
                win = win.getParentWindow();
            }
            this.mainWindow = new ElectronContainerWindow(win);
        }

        return this.mainWindow;
    }

    protected getWindowOptions(options?: any): any {
        return ObjectTransform.transformProperties(options, this.windowOptionsMap);
    }

    protected wrapWindow(containerWindow: any) {
        return new ElectronContainerWindow(containerWindow);
    }

    public showWindow(url: string, options?: any): ContainerWindow {
        const newOptions = this.getWindowOptions(options);
        const electronWindow = new this.browserWindow(newOptions);
        electronWindow.loadURL(url);

        return this.wrapWindow(electronWindow);
    }

    public showNotification(options: NotificationOptions) {
        throw new TypeError("showNotification requires an implementation.");
    }

    public addTrayIcon(details: TrayIconDetails, listener: () => void, menuItems?: MenuItem[]) {
        const tray = new this.tray(details.icon);

        if (details.text) {
            tray.setToolTip(details.text);
        }

        if (menuItems) {
            tray.setContextMenu(this.menu.buildFromTemplate(menuItems));
        }

        if (listener) {
            tray.on("click", listener);
        }
    }
}
