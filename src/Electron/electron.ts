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

class InternalMessageType {
    public static readonly setName: string = "desktopJS.window-setname";
    public static readonly getGroup: string = "desktopJS.window-getGroup";
    public static readonly joinGroup: string = "desktopJS.window-joinGroup";
    public static readonly leaveGroup: string = "desktopJS.window-leaveGroup";
}

const windowEventMap = {};

/**
 * @augments ContainerWindow
 */
export class ElectronContainerWindow extends ContainerWindow {
    private readonly container: ElectronContainer;

    public constructor(wrap: any, container: ElectronContainer) {
        super(wrap);
        this.container = container;
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

    public get allowGrouping() {
        return true;
    }

    public getGroup(): Promise<any[]> {
        return new Promise<ContainerWindow[]>(resolve => {
            resolve((<any>this.container.internalIpc).sendSync(InternalMessageType.getGroup, { source: this.id }).map(id => {
                return (id === this.id) ? this : this.container.wrapWindow(this.container.browserWindow.fromId(id));
            }));
        });
    }

    public joinGroup(target: ContainerWindow): Promise<void> {
        if (!target || target.id === this.id) {
            return Promise.resolve();
        }

        (<any>this.container.internalIpc).send(InternalMessageType.joinGroup, { source: this.id, target: target.id });
        return Promise.resolve();
    }

    public leaveGroup(): Promise<void> {
        (<any>this.container.internalIpc).send(InternalMessageType.leaveGroup, { source: this.id });
        return Promise.resolve();
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
        // If publisher is targeting a window, do not send to main
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
    public browserWindow: any;
    protected tray: any;
    protected menu: any;
    public internalIpc: NodeJS.EventEmitter;
    private windowManager: ElectronWindowManager;

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
                this.windowManager = new ElectronWindowManager(this.internalIpc, this.browserWindow);
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

    public wrapWindow(containerWindow: any) {
        return new ElectronContainerWindow(containerWindow, this);
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
            ? (<any>this.internalIpc).sendSync(InternalMessageType.setName, { id: electronWindow.id, name: windowName })
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

export class ElectronWindowManager {
    private ipc: NodeJS.EventEmitter;
    private browserWindow: any;

    private lastBounds: Map<number, Rectangle> = new Map(); // BrowserWindow.id -> Rectangle
    private ignoredWindows: number[] = []; // Array of BrowserWindow.id

    public constructor(ipc?: NodeJS.EventEmitter, browserWindow?: any) {
        this.ipc = ipc || require("electron").ipcMain;
        this.browserWindow = browserWindow || require("electron").BrowserWindow;

        this.ipc.on(InternalMessageType.setName, (event: any, message: any) => {
            const { id, name } = message;
            this.browserWindow.fromId(id).name = name;
            event.returnValue = name;
        });

        this.ipc.on(InternalMessageType.joinGroup, (event: any, message: any) => {
            const { "source": sourceId, "target": targetId } = message;
            const source = this.browserWindow.fromId(sourceId);
            const target = this.browserWindow.fromId(targetId);

            this.groupWindows(target, source);
        });

        this.ipc.on(InternalMessageType.leaveGroup, (event: any, message: any) => {
            const { "source": sourceId } = message;
            this.ungroupWindows(this.browserWindow.fromId(sourceId));
        });

        this.ipc.on(InternalMessageType.getGroup, (event: any, message: any) => {
            const { "source": sourceId } = message;
            const group: string = this.browserWindow.fromId(sourceId).group;

            event.returnValue = (group)
                                    ? this.browserWindow.getAllWindows().filter(win => { return (win.group === group); }).map(win => win.id )
                                    : [];
        });
    }

    private registerWindowEvents(win: any) {
        if (win && !win.moveHandler) {
            this.lastBounds.set(win.id, win.getBounds());
            win.moveHandler = (e) => this.handleMove(win);
            win.on("move", win.moveHandler);
        }
    }

    private unregisterWindowEvents(win: any) {
        if (win && win.moveHandler) {
            this.lastBounds.delete(win.id);
            win.removeListener("move", win.moveHandler);
            delete win.moveHandler;
        }
    }

    public groupWindows(target: any, ...windows: any[]) {
        for (const win of windows) {
            win.group = target.group || (target.group = Guid.newGuid());
            this.registerWindowEvents(win);
        }

        this.registerWindowEvents(target);
    }

    public ungroupWindows(...windows: any[]) {
        // Unhook and clear group of all provided windows
        for (const win of windows) {
            this.unregisterWindowEvents(win);
            win.group = null;
        }

        // Group all windows by group and for any group consisting of one window unhook and clear the group
        this.groupBy<any>(this.browserWindow.getAllWindows(), "group").filter(group => group.key && group.values && group.values.length === 1).forEach(group => {
            for (const win of group.values) {
                this.unregisterWindowEvents(win);
                win.group = null;
            }
        });
    }

    private handleMove(win: any): void {
        // Grab the last bounds we had and the current and then store the current
        const oldBounds = this.lastBounds.get(win.id);
        const newBounds = win.getBounds();
        this.lastBounds.set(win.id, newBounds);

        // If the height or width change this is a resize and we should just exit out
        if (oldBounds.width !== newBounds.width || oldBounds.height !== newBounds.height) {
            return;
        }

        // Prevent cycles
        if (this.ignoredWindows.indexOf(win.id) >= 0) {
            return;
        }

        if (win.group) {
            // Get all windows other windows in same group
            const groupedWindows = this.browserWindow.getAllWindows().filter(window => { return (window.group === win.group && window.id !== win.id); });

            if (groupedWindows && groupedWindows.length > 0) {
                const diff = { x: oldBounds.x - newBounds.x, y: oldBounds.y - newBounds.y };

                groupedWindows.forEach(groupedWindow => {
                    const targetBounds = groupedWindow.getBounds();
                    this.ignoredWindows.push(groupedWindow.id);
                    groupedWindow.setBounds( { x: targetBounds.x - diff.x, y: targetBounds.y - diff.y, width: targetBounds.width, height: targetBounds.height }, true);
                    this.ignoredWindows.splice(this.ignoredWindows.indexOf(groupedWindow.id), 1);
                });
            }
        }
    }

    private groupBy<T>(array: T[], groupBy: any): { key: any, values: T[]}[] {
        return array.reduce((accumulator, current) => {
            const key = groupBy instanceof Function ? groupBy(current) : current[groupBy];
            const group = accumulator.find((r) => r && r.key === key);

            if (group) {
                group.values.push(current);
            } else {
                accumulator.push({ key: key, values: [current] });
            }

            return accumulator;
        }, []);
     }
}