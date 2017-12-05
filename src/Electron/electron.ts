import * as ContainerRegistry from "../registry";
import { ContainerWindow, PersistedWindowLayout, PersistedWindow, Rectangle } from "../window";
import { Container, WebContainerBase } from "../container";
import { ObjectTransform, PropertyMap } from "../propertymapping";
import { NotificationOptions, ContainerNotification } from "../notification";
import { TrayIconDetails } from "../tray";
import { MenuItem } from "../menu";
import { Guid } from "../guid";
import { MessageBus, MessageBusSubscription, MessageBusOptions } from "../ipc";

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

const windowEventMap = {};

/**
 * @augments ContainerWindow
 */
export class ElectronContainerWindow extends ContainerWindow {
    public constructor(wrap: any) {
        super(wrap);
    }

    public get id(): string {
        return this.innerWindow.id;
    }

    public get name(): string {
        return this.innerWindow.name;
    }

    public focus(): Promise<void> {
        this.innerWindow.focus();
        return Promise.resolve();
    }

    public show(): Promise<void> {
        this.innerWindow.show();
        return Promise.resolve();
    }

    public hide(): Promise<void> {
        this.innerWindow.hide();
        return Promise.resolve();
    }

    public close(): Promise<void> {
        this.innerWindow.close();
        return Promise.resolve();
    }

    public isShowing(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            resolve(this.innerWindow.isVisible());
        });
    }

    public getSnapshot(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.innerWindow.capturePage((snapshot) => {
                resolve("data:image/png;base64," + snapshot.toPNG().toString("base64"));
            });
        });
    }

    public getBounds(): Promise<Rectangle> {
        return new Promise<Rectangle>(resolve => {
            resolve(this.innerWindow.getBounds());
        });
    }

    public setBounds(bounds: Rectangle): Promise<void> {
        return new Promise<void>(resolve => {
            this.innerWindow.setBounds(bounds);
            resolve();
        });
    }

    protected attachListener(eventName: string, listener: (...args: any[]) => void): void {
        this.innerWindow.addListener(windowEventMap[eventName] || eventName, listener);
    }

    protected detachListener(eventName: string, listener: (...args: any[]) => void): void {
        this.innerWindow.removeListener(windowEventMap[eventName] || eventName, listener);
    }
}

/**
 * @augments MessageBus
 */
export class ElectronMessageBus implements MessageBus {
    public ipc: NodeJS.EventEmitter;
    private browserWindow: any;

    public constructor(ipc: NodeJS.EventEmitter, browserWindow: any) {
        this.ipc = ipc;
        this.browserWindow = browserWindow;
    }

    public subscribe<T>(topic: string, listener: (event: any, message: T) => void, options?: MessageBusOptions): Promise<MessageBusSubscription> {
        return new Promise<MessageBusSubscription>((resolve, reject) => {
            const subscription: MessageBusSubscription = new MessageBusSubscription(topic, (event: any, message: any) => {
                listener({ topic: topic }, message);
            });
            this.ipc.on(topic, subscription.listener);
            resolve(subscription);
        });
    }

    public unsubscribe(subscription: MessageBusSubscription): Promise<void> {
        const { topic, listener, options } = subscription;
        return Promise.resolve(<any>this.ipc.removeListener(topic, listener));
    }

    public publish<T>(topic: string, message: T, options?: MessageBusOptions): Promise<void> {
        // Publish to main from renderer (send is not available on ipcMain)
        if (!options || !options.name) {
            if ((<any>this.ipc).send !== undefined) {
                // Publish to main from renderer (send is not available on ipcMain)
                (<any>this.ipc).send(topic, message);
            } else {
                // we are in main so invoke listener directly
                this.ipc.listeners(topic).forEach(cb => cb({ topic: topic }, message));
            }
        }

        // Broadcast to all windows or to the individual targeted window
        if (this.browserWindow && this.browserWindow.getAllWindows) {
            for (const window of (this.browserWindow).getAllWindows()) {
                if (options && options.name) {
                    if (options.name === window.name) {
                        window.webContents.send(topic, message);
                    }
                } else {
                    window.webContents.send(topic, message);
                }
            }
        }

        return Promise.resolve();
    }
}

/**
 * @extends ContainerBase
 */
export class ElectronContainer extends WebContainerBase {
    protected isRemote: Boolean = true;
    protected mainWindow: ElectronContainerWindow;
    protected electron: any;
    protected app: any;
    protected browserWindow: any;
    protected tray: any;
    protected menu: any;
    protected internalIpc: NodeJS.EventEmitter;

    /**
     * Gets or sets whether to replace the native web Notification API with a wrapper around showNotification.
     * @type {boolean}
     * @default true
     */
    public static replaceNotificationApi: boolean = true;

    public static readonly windowOptionsMap: PropertyMap = {
        taskbar: { target: "skipTaskbar", convert: (value: any, from: any, to: any) => { return !value; } }
    };

    public windowOptionsMap: PropertyMap = ElectronContainer.windowOptionsMap;

    public constructor(electron?: any, ipc?: NodeJS.EventEmitter | any, win?: any) {
        super(win);
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

            this.internalIpc = ipc || ((this.isRemote) ? require("electron").ipcRenderer : this.electron.ipcMain);
            this.ipc = new ElectronMessageBus(this.internalIpc, this.browserWindow);

            if (!this.isRemote) {
                this.internalIpc.on("setWindowName", (event: any, message: any) => {
                    const { id, name } = message;
                    this.browserWindow.fromId(id).name = name;
                    event.returnValue = name;
                });
            }
        } catch (e) {
            console.error(e);
        }

        this.registerNotificationsApi();
    }

    protected registerNotificationsApi() {
        if (ElectronContainer.replaceNotificationApi && typeof this.globalWindow !== "undefined" && this.globalWindow) {
            // Define owningContainer for closure to inner class
            const owningContainer: ElectronContainer = this; // tslint:disable-line

            this.globalWindow["Notification"] = class ElectronNotification extends ContainerNotification {
                constructor(title: string, options?: NotificationOptions) {
                    super(title, options);
                    options["notification"] = this;
                    owningContainer.showNotification(title, options);
                }
            };
        }
    }

    public getMainWindow(): ContainerWindow {
        if (!this.mainWindow) {
            let win = this.electron.getCurrentWindow();
            while (win.getParentWindow()) {
                win = win.getParentWindow();
            }
            this.mainWindow = this.wrapWindow(win);
        }

        return this.mainWindow;
    }

    public getCurrentWindow(): ContainerWindow {
        return this.wrapWindow(this.electron.getCurrentWindow());
    }

    protected getWindowOptions(options?: any): any {
        return ObjectTransform.transformProperties(options, this.windowOptionsMap);
    }

    protected wrapWindow(containerWindow: any) {
        return new ElectronContainerWindow(containerWindow);
    }

    public createWindow(url: string, options?: any): ContainerWindow {
        const newOptions = this.getWindowOptions(options);
        const electronWindow: any = new this.browserWindow(newOptions);
        const windowName = newOptions.name || Guid.newGuid();

        /*
            If we are in the renderer process, we need to ipc to the main process
            to set the window name. Otherwise it can not be seen from other renderer
            processes.

            This requires the main process to have desktopJS container listening
            either via desktopJS.resolveContainer() or new desktopJS.Electron.ElectronContainer();
            If it is not listening, this ipc call will hang indefinitely. If we are in the
            main process we can just directly set the name.
        */
        electronWindow["name"] = (this.isRemote)
            ? (<any>this.internalIpc).sendSync("setWindowName", { id: electronWindow.id, name: windowName })
            : windowName;

        electronWindow.loadURL(url);

        const newWindow = this.wrapWindow(electronWindow);
        this.emit("window-created", { sender: this, name: "window-created", window: newWindow, windowId: electronWindow.id, windowName: windowName });
        Container.emit("window-created", { name: "window-created", windowId: electronWindow.id, windowName: windowName });
        ContainerWindow.emit("window-created", { name: "window-created", windowId: electronWindow.id, windowName: windowName });
        return newWindow;
    }

    public showNotification(title: string, options?: NotificationOptions) {
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

    protected closeAllWindows(excludeSelf?: Boolean): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            for (const window of this.browserWindow.getAllWindows()) {
                if (!excludeSelf || window !== this.electron.getCurrentWindow()) {
                    window.close();
                }
            }
            resolve();
        });
    }

    public getAllWindows(): Promise<ContainerWindow[]> {
        return Promise.resolve(this.browserWindow.getAllWindows().map(window => this.wrapWindow(window)));
    }

    public getWindowById(id: string): Promise<ContainerWindow | null> {
        return new Promise<ContainerWindow>((resolve, reject) => {
            const win = this.browserWindow.fromId(id);
            resolve(win ? this.wrapWindow(win) : null);
        });
    }

    public getWindowByName(name: string): Promise<ContainerWindow | null> {
        return new Promise<ContainerWindow>((resolve, reject) => {
            const win = this.browserWindow.getAllWindows().find(window => window.name === name);
            resolve(win ? this.wrapWindow(win) : null);
        });
    }

    public saveLayout(name: string): Promise<PersistedWindowLayout> {
        const layout = new PersistedWindowLayout();

        return new Promise<PersistedWindowLayout>((resolve, reject) => {
            for (const window of this.browserWindow.getAllWindows()) {
                if (window !== this.electron.getCurrentWindow()) {
                    layout.windows.push({ name: window.name, url: window.webContents.getURL(), bounds: window.getBounds() });
                }
            }

            this.saveLayoutToStorage(name, layout);
            resolve(layout);
        });
    }
}
