/**
 * @module @morgan-stanley/desktopjs-electron
 */

import {
    registerContainer, ContainerWindow, PersistedWindowLayout, Rectangle, Container, WebContainerBase,
    ScreenManager, Display, Point, ObjectTransform, PropertyMap, NotificationOptions, ContainerNotification,
    TrayIconDetails, MenuItem, Guid, MessageBus, MessageBusSubscription, MessageBusOptions, GlobalShortcutManager,
    EventArgs, WindowEventArgs
} from "@morgan-stanley/desktopjs";

registerContainer("Electron", {
    condition: () => {
        try {
            return typeof require !== "undefined" && (require("electron") || require("electron").remote);
        } catch (e) {
            return false;
        }
    },
    create: (options) => new ElectronContainer(null, null, null, options)
});

class InternalMessageType {
    public static readonly initialize: string = "desktopJS.window-initialize";
    public static readonly getGroup: string = "desktopJS.window-getGroup";
    public static readonly joinGroup: string = "desktopJS.window-joinGroup";
    public static readonly leaveGroup: string = "desktopJS.window-leaveGroup";
    public static readonly getOptions: string = "desktopJS.window-getOptions";
}

const windowEventMap = {};

/**
 * @augments ContainerWindow
 */
export class ElectronContainerWindow extends ContainerWindow {
    private readonly container: ElectronContainer;
    private readonly window: Window;

    public constructor(wrap: any, container: ElectronContainer, win?: Window) {
        super(wrap);
        this.container = container;
        this.window = win;
    }

    private get isRemote(): boolean {
        return ((<any> this.container.internalIpc).send);
    }

    public get id(): string {
        return this.innerWindow.id || this.innerWindow.guestId;
    }

    public get name(): string {
        return this.innerWindow.name;
    }

    public load(url: string, options?: any) : Promise<void> {
        return new Promise<void>(resolve => {
            if (options) {
                this.innerWindow.loadURL(url, options);
            } else {
                this.innerWindow.loadURL(url);
            }
            resolve();
        });
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

    public maximize(): Promise<void> {
        return new Promise<void>(resolve => {
            this.innerWindow.maximize();
            resolve();
        });
    }

    public minimize(): Promise<void> {
        return new Promise<void>(resolve => {
            this.innerWindow.minimize();
            resolve();
        });
    }

    public restore(): Promise<void> {
        return new Promise<void>(resolve => {
            this.innerWindow.restore();
            resolve();
        });
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

    public flash(enable: boolean, options?: any): Promise<void> {
        this.innerWindow.flashFrame(enable);
        return Promise.resolve();
    }

    public getBounds(): Promise<Rectangle> {
        return new Promise<Rectangle>(resolve => {
            const { x, y, width, height } = this.innerWindow.getBounds();
            resolve(new Rectangle(x, y, width, height));
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
            const ids = (this.isRemote)
                ? (<any>this.container.internalIpc).sendSync(InternalMessageType.getGroup, { source: this.id })
                : (<any>this.container).windowManager.getGroup(this.innerWindow);

            resolve(ids.map(id => {return (id === this.id) ? this : this.container.wrapWindow(this.container.browserWindow.fromId(id)); }));
        });
    }

    public joinGroup(target: ContainerWindow): Promise<void> {
        if (!target || target.id === this.id) {
            return Promise.resolve();
        }

        if (this.isRemote) {
            (<any>this.container.internalIpc).send(InternalMessageType.joinGroup, { source: this.id, target: target.id });
        } else {
            (<any>this.container).windowManager.groupWindows(target.innerWindow, this.innerWindow);
        }

        return Promise.resolve();
    }

    public leaveGroup(): Promise<void> {
        if (this.isRemote) {
            (<any>this.container.internalIpc).send(InternalMessageType.leaveGroup, { source: this.id });
        } else {
            (<any>this.container).windowManager.ungroupWindows(this.innerWindow);
        }

        return Promise.resolve();
    }

    public bringToFront(): Promise<void> {
        return new Promise<void>(resolve => {
            this.innerWindow.moveTop();
            resolve();
        });
    }

    public getOptions(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const options = (this.isRemote)
                ? (<any>this.container.internalIpc).sendSync(InternalMessageType.getOptions, { source: this.id })
                : this.innerWindow[Container.windowOptionsPropertyKey];

            resolve(options);
        });
    }

    public getState(): Promise<any> {
        if (this.innerWindow && this.innerWindow.webContents) {
            return this.innerWindow.webContents.executeJavaScript("window.getState ? window.getState() : undefined");
        } else {
            return Promise.resolve(undefined);
        }
    }

    public setState(state: any): Promise<void> {
        const promise = (this.innerWindow && this.innerWindow.webContents)
            ? this.innerWindow.webContents.executeJavaScript(`if (window.setState) { window.setState(JSON.parse(\`${JSON.stringify(state)}\`)); }`)
            : Promise.resolve();

        return promise.then(() => {
            this.emit("state-changed", <EventArgs> { name: "state-changed", sender: this, state: state });
            ContainerWindow.emit("state-changed", <WindowEventArgs> { name: "state-changed", windowId: this.id, state: state } );
        });
    }

    protected attachListener(eventName: string, listener: (...args: any[]) => void): void {
        if (eventName === "beforeunload") {
            const win = this.window || window;
            if (win && this.id === this.container.getCurrentWindow().id) {
                win.addEventListener("beforeunload", listener);
            } else {
                throw new Error("Event handler for 'beforeunload' can only be added on current window");
            }
        } else {
            this.innerWindow.addListener(windowEventMap[eventName] || eventName, listener);
        }
    }

    protected detachListener(eventName: string, listener: (...args: any[]) => void): void {
        this.innerWindow.removeListener(windowEventMap[eventName] || eventName, listener);
    }

    public get nativeWindow(): Window {
        // For Electron we can only return in and for current renderer
        return this.window || window;
    }
}

/**
 * @augments MessageBus
 */
export class ElectronMessageBus implements MessageBus {
    public ipc: any;
    private browserWindow: any;

    public constructor(ipc: any, browserWindow: any) {
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
    protected electron: any;
    protected app: any;
    public browserWindow: any;
    protected tray: any;
    protected menu: any;
    public internalIpc: any;
    private windowManager: ElectronWindowManager;
    private nodeIntegration: boolean;

    /**
     * Gets or sets whether to replace the native web Notification API with a wrapper around showNotification.
     * @type {boolean}
     * @default true
     */
    public static replaceNotificationApi: boolean = true;

    public static readonly windowOptionsMap: PropertyMap = {
        taskbar: { target: "skipTaskbar", convert: (value: any, from: any, to: any) => { return !value; } },
        node: {
            target: "webPreferences", convert: (value: any, from: any, to: any) => {
                return Object.assign(to.webPreferences || {}, { nodeIntegration: value });
            }
        }
    };

    public windowOptionsMap: PropertyMap = ElectronContainer.windowOptionsMap;

    public constructor(electron?: any, ipc?: any, win?: any, options?: any) {
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
            this.ipc = this.createMessageBus();

            if (!this.isRemote || (options && typeof options.isRemote !== "undefined" && !options.isRemote)) {
                this.windowManager = new ElectronWindowManager(this.app, this.internalIpc, this.browserWindow);

                this.app.on("browser-window-created", (event, window) => {
                    setImmediate(() => {
                        Container.emit("window-created", { name: "window-created", windowId: window.webContents.id });
                        ContainerWindow.emit("window-created", { name: "window-created", windowId: window.webContents.id });
                    });
                });
            }
        } catch (e) {
            console.error(e);
        }

        let replaceNotificationApi = ElectronContainer.replaceNotificationApi;
        if (options && typeof options.replaceNotificationApi !== "undefined") {
            replaceNotificationApi = options.replaceNotificationApi;
        }

        if (replaceNotificationApi) {
            this.registerNotificationsApi();
        }

        this.nodeIntegration = (options && options.node != null) ? options.node : null;

        this.screen = new ElectronDisplayManager(this.electron);

        this.globalShortcut = new ElectronGlobalShortcutManager(this.electron);
    }

    protected createMessageBus() : MessageBus {
        return new ElectronMessageBus(this.internalIpc, this.browserWindow);
    }

    protected registerNotificationsApi() {
        if (typeof this.globalWindow !== "undefined" && this.globalWindow) {
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

    public getInfo(): Promise<string | undefined> {
        return Promise.resolve(`Electron/${this.electron.process.versions.electron} Chrome/${this.electron.process.versions.chrome}`);
    }

    public getMainWindow(): ContainerWindow {
        for (const window of this.browserWindow.getAllWindows()) {
            if (window[Container.windowOptionsPropertyKey] && window[Container.windowOptionsPropertyKey].main) {
                return this.wrapWindow(window);
            }
        }

        // No windows were marked as main so fallback to the first window created as being main
        const win = this.browserWindow.fromId(1);
        return win ? this.wrapWindow(win) : undefined;
    }

    public getCurrentWindow(): ContainerWindow {
        return this.wrapWindow(this.electron.getCurrentWindow());
    }

    protected getWindowOptions(options?: any): any {
        // If we have any container level node default, apply it here if no preference is specified in the options
        if (this.nodeIntegration != null && !("node" in options)) {
            options.node = this.nodeIntegration;
        }

        return ObjectTransform.transformProperties(options, this.windowOptionsMap);
    }

    public wrapWindow(containerWindow: any) {
        return new ElectronContainerWindow(containerWindow, this);
    }

    public createWindow(url: string, options?: any): Promise<ContainerWindow> {
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
        if (this.isRemote) {
            electronWindow["name"] = (<any>this.internalIpc).sendSync(InternalMessageType.initialize, { id: electronWindow.id, name: windowName, options: newOptions });
            electronWindow[Container.windowOptionsPropertyKey] = options;
        } else {
            this.windowManager.initializeWindow(electronWindow, windowName, newOptions);
        }

        electronWindow.loadURL(this.ensureAbsoluteUrl(url));

        const newWindow = this.wrapWindow(electronWindow);
        this.emit("window-created", { sender: this, name: "window-created", window: newWindow, windowId: electronWindow.id, windowName: windowName });
        return Promise.resolve(newWindow);
    }

    public showNotification(title: string, options?: NotificationOptions) {
        const Notification = this.electron.Notification;
        const notify = new Notification(Object.assign(options || {}, { title: title }));
        if (options["onClick"]) {
            notify.addListener("click", options["onClick"]);
        }
        if (options["notification"]) {
            notify.once("show", () => notify.addListener("click", options["notification"]["onclick"]));
        }

        notify.show();
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

    public buildLayout(): Promise<PersistedWindowLayout> {
        const layout = new PersistedWindowLayout();
        const mainWindow = this.getMainWindow().innerWindow;
        const promises: Promise<void>[] = [];

        return new Promise<PersistedWindowLayout>((resolve, reject) => {
            this.getAllWindows().then(windows => {
                windows.forEach(window => {
                    const options = window.innerWindow[Container.windowOptionsPropertyKey];
                    if (options && "persist" in options && !options.persist) {
                        return;
                    }

                    promises.push(new Promise<void>(innerResolve => {
                        window.getGroup().then(async group => {
                            layout.windows.push(
                                {
                                    id: window.id,
                                    name: window.name,
                                    url: window.innerWindow.webContents.getURL(),
                                    main: (mainWindow === window.innerWindow),
                                    state: await window.getState(),
                                    options: options,
                                    bounds: window.innerWindow.getBounds(),
                                    group: group.map(win => win.id)
                                });
                            innerResolve();
                        });
                    }));
                });

                Promise.all(promises).then(() => {
                    resolve(layout);
                }).catch(reject);
            });
        });
    }
}

export class ElectronWindowManager {
    private app: any;
    private ipc: NodeJS.EventEmitter;
    private browserWindow: any;

    private lastBounds: Map<number, Rectangle> = new Map(); // BrowserWindow.id -> Rectangle
    private ignoredWindows: number[] = []; // Array of BrowserWindow.id

    public constructor(app?: any, ipc?: any, browserWindow?: any) {
        this.app = app || require("electron").app;
        this.ipc = ipc || require("electron").ipcMain;
        this.browserWindow = browserWindow || require("electron").BrowserWindow;

        this.ipc.on(InternalMessageType.initialize, (event: any, message: any) => {
            const { id, name, options } = message;
            const win = this.browserWindow.fromId(id);
            this.initializeWindow(win, name, options);
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
            event.returnValue = this.getGroup(this.browserWindow.fromId(sourceId));
        });

        this.ipc.on(InternalMessageType.getOptions, (event: any, message: any) => {
            const { "source": sourceId } = message;
            event.returnValue = this.browserWindow.fromId(sourceId)[Container.windowOptionsPropertyKey];
        });
    }

    public initializeWindow(win: any, name: string, options: any) {
        win.name = name;
        win[Container.windowOptionsPropertyKey] = options;

        if (options && options.main && (!("quitOnClose" in options) || options.quitOnClose)) {
            win.on("closed", () => {
                this.app.quit();
            });
        }
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

    public getGroup(window: any): any[] {
        return (window.group)
            ? this.browserWindow.getAllWindows().filter(win => { return (win.group === window.group); }).map(win => win.id)
            : [];
    }

    public groupWindows(target: any, ...windows: any[]) {
        for (const win of windows) {
            win.group = target.group || (target.group = Guid.newGuid());
            this.registerWindowEvents(win);

            ContainerWindow.emit("window-joinGroup", { name: "window-joinGroup", windowId: win.id, targetWindowId: target.id });
        }

        this.registerWindowEvents(target);
    }

    public ungroupWindows(...windows: any[]) {
        // Unhook and clear group of all provided windows
        for (const win of windows) {
            this.unregisterWindowEvents(win);
            win.group = null;
            ContainerWindow.emit("window-leaveGroup", { name: "window-leaveGroup", windowId: win.id });
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
                    groupedWindow.setBounds({ x: targetBounds.x - diff.x, y: targetBounds.y - diff.y, width: targetBounds.width, height: targetBounds.height }, true);
                    this.ignoredWindows.splice(this.ignoredWindows.indexOf(groupedWindow.id), 1);
                });
            }
        }
    }

    private groupBy<T>(array: T[], groupBy: any): { key: any, values: T[] }[] {
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

/** @private */
class ElectronDisplayManager implements ScreenManager {
    private readonly electron: any;

    public constructor(electron: any) {
        this.electron = electron;
    }

    createDisplay(monitorDetails: any) {
        const display = new Display();
        display.id = monitorDetails.id;
        display.scaleFactor = monitorDetails.scaleFactor;

        display.bounds = new Rectangle(monitorDetails.bounds.x,
            monitorDetails.bounds.y,
            monitorDetails.bounds.width,
            monitorDetails.bounds.height);

        display.workArea = new Rectangle(monitorDetails.workArea.x,
            monitorDetails.workArea.y,
            monitorDetails.workArea.width,
            monitorDetails.workArea.height);

        return display;
    }

    public getPrimaryDisplay(): Promise<Display> {
        return new Promise<Display>((resolve, reject) => {
            resolve(this.createDisplay(this.electron.screen.getPrimaryDisplay()));
        });
    }

    public getAllDisplays(): Promise<Display[]> {
        return new Promise<Display[]>((resolve, reject) => {
            resolve(this.electron.screen.getAllDisplays().map(this.createDisplay));
        });
    }

    public getMousePosition(): Promise<Point> {
        return new Promise<Point>((resolve, reject) => {
            resolve(this.electron.screen.getCursorScreenPoint());
        });
    }
}

/** @private */
class ElectronGlobalShortcutManager extends GlobalShortcutManager {
    private readonly electron: any;

    public constructor(electron: any) {
        super();
        this.electron = electron;
    }

    public register(shortcut: string, callback: () => void): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.electron.globalShortcut.register(shortcut, callback);
            resolve();
        });
    }

    public isRegistered(shortcut: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            resolve(this.electron.globalShortcut.isRegistered(shortcut));
        });
    }

    public unregister(shortcut: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.electron.globalShortcut.unregister(shortcut);
            resolve();
        });
    }

    public unregisterAll(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.electron.globalShortcut.unregisterAll();
            resolve();
        });
    }
}