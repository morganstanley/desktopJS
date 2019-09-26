/**
 * @module @morgan-stanley/desktopjs-openfin
 */

import {
    registerContainer, ContainerWindow, PersistedWindowLayout, Rectangle, Container, WebContainerBase,
    ScreenManager, Display, Point, ObjectTransform, PropertyMap, NotificationOptions, ContainerNotification,
    TrayIconDetails, MenuItem, Guid, MessageBus, MessageBusSubscription, MessageBusOptions, EventArgs,
    GlobalShortcutManager, WindowEventArgs
} from "@morgan-stanley/desktopjs";

registerContainer("OpenFin", {
    condition: () => typeof window !== "undefined" && "fin" in window && "desktop" in (<any>window).fin,
    create: (options) => <any>new OpenFinContainer(null, null, options)
});

const windowEventMap = {
    move: "bounds-changing",
    resize: "bounds-changing",
    close: "closing",
    focus: "focused",
    blur: "blurred",
    maximize: "maximized",
    minimize: "minimized",
    restore: "restored"
};

/**
 * @augments ContainerWindow
 */
export class OpenFinContainerWindow extends ContainerWindow {
    public constructor(wrap: any) {
        super(wrap);
    }

    public get id(): string {
        return this.name;  // Reuse name since it is the unique identifier
    }

    public get name(): string {
        return this.innerWindow.name;
    }

    public load(url: string, options?: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.navigate(url, resolve, reject);
        });
    }

    public focus(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.focus(resolve, reject);
        });
    }

    public show(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.show(resolve, reject);
        });
    }

    public hide(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.hide(resolve, reject);
        });
    }

    public close(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.close(false, resolve, reject);
        });
    }

    public minimize(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.minimize(resolve, reject);
        });
    }

    public maximize(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.maximize(resolve, reject);
        });
    }

    public restore(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.restore(resolve, reject);
        });
    }

    public isShowing(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.innerWindow.isShowing(resolve, reject);
        });
    }

    public getSnapshot(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.innerWindow.getSnapshot(
                (snapshot) => resolve("data:image/png;base64," + snapshot),
                (reason) => reject(reason)
            );
        });
    }

    public getBounds(): Promise<Rectangle> {
        return new Promise<Rectangle>((resolve, reject) => {
            this.innerWindow.getBounds(
                bounds => resolve(new Rectangle(bounds.left, bounds.top, bounds.width, bounds.height)),
                reject);
        });
    }

    public flash(enable: boolean, options?: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (enable) {
                this.innerWindow.flash(options, resolve, reject);
            } else {
                this.innerWindow.stopFlashing(resolve, reject);
            }
        });
    }

    public setBounds(bounds: Rectangle): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.setBounds(bounds.x, bounds.y, bounds.width, bounds.height, resolve, reject);
        });
    }

    public get allowGrouping() {
        return true;
    }

    public getGroup(): Promise<ContainerWindow[]> {
        return new Promise<ContainerWindow[]>((resolve, reject) => {
            this.innerWindow.getGroup(windows => {
                resolve(windows.map(window => new OpenFinContainerWindow(window)));
            }, reject);
        });
    }

    public joinGroup(target: ContainerWindow): Promise<void> {
        if (!target || target.id === this.id) {
            return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
            this.innerWindow.joinGroup(target.innerWindow, () => {
                ContainerWindow.emit("window-joinGroup", { name: "window-joinGroup", windowId: this.id, targetWindowId: target.id } );
                resolve();
            }, reject);
        });
    }

    public leaveGroup(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.leaveGroup(() => {
                ContainerWindow.emit("window-leaveGroup", { name: "window-leaveGroup", windowId: this.id } );
                resolve();
            }, reject);
        });
    }

    public bringToFront(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.bringToFront(resolve, reject);
        });
    }

    public getOptions(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.innerWindow.getOptions(options => resolve(options.customData ? JSON.parse(options.customData) : undefined), reject);
        });
    }

    public getState(): Promise<any> {
        return new Promise<any>(resolve => {
            (this.nativeWindow && (<any>this.nativeWindow).getState) ? resolve((<any>this.nativeWindow).getState()) : resolve(undefined);
        });
    }

    public setState(state: any): Promise<void> {
        return new Promise<void>(resolve => {
            if (this.nativeWindow && (<any>this.nativeWindow).setState) {
                (<any>this.nativeWindow).setState(state);
            }

            resolve();
        }).then(() => {
            this.emit("state-changed", <EventArgs> { name: "state-changed", sender: this, state: state });
            ContainerWindow.emit("state-changed", <WindowEventArgs> { name: "state-changed", windowId: this.id, state: state } );
        });
    }

    protected attachListener(eventName: string, listener: (...args: any[]) => void): void {
        if (eventName === "beforeunload") {
            this.innerWindow.addEventListener("close-requested", (e) => {
                const args = new EventArgs(this, "beforeunload", e);
                listener(args);
                if (typeof args.returnValue === "undefined") {
                    this.innerWindow.close(true);
                }
            });
        } else {
            this.innerWindow.addEventListener(windowEventMap[eventName] || eventName, listener);
        }
    }

    protected wrapListener(eventName: string, listener: (event: EventArgs) => void): (event: EventArgs) => void {
        // Split OpenFin bounds-changed event to separate resize/move events
        if (eventName === "resize") {
            return (event) => {
                if ((<any>event).changeType >= 1) {
                    listener(new EventArgs(this, eventName, event));
                }
            };
        } else if (eventName === "move") {
            return (event) => {
                if ((<any>event).changeType === 0) {
                    listener(new EventArgs(this, eventName, event));
                }
            };
        } else {
            return super.wrapListener(eventName, listener);
        }
    }

    protected detachListener(eventName: string, listener: (...args: any[]) => void): any {
        this.innerWindow.removeEventListener(windowEventMap[eventName] || eventName, listener);
    }

    public get nativeWindow(): Window {
        return this.innerWindow.getNativeWindow();
    }
}

/**
 * @augments MessageBus
 */
export class OpenFinMessageBus implements MessageBus {
    private bus: any;
    private uuid: string;

    public constructor(bus: any, uuid: string) {
        this.bus = bus;
        this.uuid = uuid;
    }

    public subscribe<T>(topic: string, listener: (event: any, message: T) => void, options?: MessageBusOptions): Promise<MessageBusSubscription> {
        return new Promise<MessageBusSubscription>((resolve, reject) => {
            const subscription: MessageBusSubscription = new MessageBusSubscription(topic, (message: any, uuid: string, name: string) => {
                listener( /* Event */ { topic: topic }, message);
            }, options);

            this.bus.subscribe(options && options.uuid || "*",      // senderUuid
                options && options.name || undefined,               // name
                subscription.topic,                                 // topic
                subscription.listener,                              // listener
                () => resolve(subscription),                        // callback
                reject);                                            // errorCallback
        });
    }

    public unsubscribe(subscription: MessageBusSubscription): Promise<void> {
        const { topic, listener, options } = subscription;
        return new Promise<void>((resolve, reject) => {
            this.bus.unsubscribe(options && options.uuid || "*",    // senderUuid
                options && options.name || undefined,               // name
                topic,                                              // topic
                listener,                                           // listener
                resolve,                                            // callback
                reject);                                            // errorCallback
        });
    }

    public publish<T>(topic: string, message: T, options?: MessageBusOptions): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // If publisher has targets defined, use OpenFin send vs broadcast publish
            // If name is specified but not uuid, assume the user wants current app uuid
            if ((options && options.uuid) || (options && options.name)) {
                this.bus.send(options.uuid || this.uuid,            // destinationUuid
                    options.name || undefined,                      // name
                    topic,                                          // topic
                    message,                                        // message
                    resolve,                                        // callback
                    reject);                                        // errorCallback

            } else {
                this.bus.publish(topic,                             // topic
                    message,                                        // message
                    resolve,                                        // callback
                    reject);                                        // errorCallback
            }
        });
    }
}

/**
 * @extends WebContainerBase
 */
export class OpenFinContainer extends WebContainerBase {
    private desktop: any;
    private mainWindow: OpenFinContainerWindow;
    private menuItemRef: MenuItem[];

    // Offsets for tray icon mouse click to not show over icon
    private static readonly trayIconMenuLeftOffset: number = 4;
    private static readonly trayIconMenuTopOffset: number = 23;

    private static readonly notificationGuid: string = "A21B62E0-16B1-4B10-8BE3-BBB6B489D862";

    /**
     * Gets or sets whether to replace the native web Notification API with OpenFin notifications.
     * @type {boolean}
     * @default true
     */
    public static replaceNotificationApi: boolean = true;

    public static readonly windowOptionsMap: PropertyMap = {
        x: { target: "defaultLeft" },
        y: { target: "defaultTop" },
        height: { target: "defaultHeight" },
        width: { target: "defaultWidth" },
        taskbar: { target: "showTaskbarIcon" },
        center: { target: "defaultCentered" },
        show: { target: "autoShow" }
    };

    public windowOptionsMap: PropertyMap = OpenFinContainer.windowOptionsMap;

    public static readonly notificationOptionsMap: PropertyMap = {
        body: { target: "message" }
    };

    public notificationOptionsMap: PropertyMap = OpenFinContainer.notificationOptionsMap;

    /* tslint:disable */
    public static menuHtml: string =
        `<html>
        <head>
            <style>
                body:before, body:after {
                    position: fixed;
                    background: silver;
                }
                body {
                    margin: 0px;
                    overflow: hidden;
                }
                .context-menu {
                    list-style: none;
                    padding: 1px 0 1px 0;
                }
                .context-menu-item {
                    display: block;
                    cursor: default;
                    font-family: Arial, Helvetica, sans-serif;
                    font-size: 9pt;
                    margin-bottom: 2px;
                    padding: 4px 0 4px 4px;
                    white-space: nowrap;
                }
                .context-menu-item span {
                    display: inline-block;
                    min-width: 20px;
                }
                .context-menu-item:last-child {
                    margin-bottom: 0;
                }                        
                .context-menu-item:hover {
                    color: #fff;
                    background-color: #0066aa;
                }
                .context-menu-image {
                    width: 16px;
                    height: 16px;
                    margin-top: -1px;
                    margin-right: 4px;
                }                        
            </style>
            <script>
                document.addEventListener('keydown', (event) => {
                    if (event.keyCode == 27) {
                        window.close();
                    }
                }, false);
            <\/script>
        </head>
        <body>
            <ul class="context-menu" id="contextMenu"></ul>
        </body>
    </html>`;
    /* tslint:enable */

    public constructor(desktop?: any, win?: Window, options?: any) {
        super(win);
        this.desktop = desktop || (<any>window).fin.desktop;
        this.hostType = "OpenFin";

        if (options && options.userName && options.appName) {
            this.desktop.Application.getCurrent().registerUser(options.userName, options.appName);
        }

        this.ipc = this.createMessageBus();

        let replaceNotificationApi = OpenFinContainer.replaceNotificationApi;
        if (options && typeof options.replaceNotificationApi !== "undefined") {
            replaceNotificationApi = options.replaceNotificationApi;
        }

        if (replaceNotificationApi) {
            this.registerNotificationsApi();
        }

        this.desktop.Application.getCurrent().addEventListener("window-created", (event: any) => {
            this.emit("window-created", { sender: this, name: "window-created", windowId: event.name, windowName: event.name });
            Container.emit("window-created", { name: "window-created", windowId: event.name, windowName: event.name });
            ContainerWindow.emit("window-created", { name: "window-created", windowId: event.name, windowName: event.name });
        });

        this.screen = new OpenFinDisplayManager(this.desktop);

        if (this.desktop.GlobalHotkey) {
            this.globalShortcut = new OpenFinGlobalShortcutManager(this.desktop);
        } else {
            console.warn("Global shortcuts require minimum OpenFin runtime of 9.61.32.34");
        }
    }

    protected createMessageBus(): MessageBus {
        return new OpenFinMessageBus(this.desktop.InterApplicationBus, (<any>this.desktop.Application.getCurrent()).uuid);
    }

    protected registerNotificationsApi() {
        if (typeof this.globalWindow !== "undefined" && this.globalWindow) {
            // Define owningContainer for closure to inner class
            const owningContainer: OpenFinContainer = this; // tslint:disable-line

            this.globalWindow["Notification"] = class OpenFinNotification extends ContainerNotification {
                constructor(title: string, options?: NotificationOptions) {
                    super(title, options);

                    options["notification"] = this;

                    // Forward OpenFin notification events back to Notification API
                    options["onClick"] = (event) => { if (this.onclick) { this.onclick(event); } };
                    options["onError"] = (event) => { if (this.onerror) { this.onerror(event); } };

                    owningContainer.showNotification(title, options);
                }
            };
        }
    }

    public getInfo(): Promise<string | undefined> {
        return new Promise<string | undefined>((resolve, reject) => {
            this.desktop.System.getRvmInfo(rvmInfo => {
                this.desktop.System.getRuntimeInfo(runtimeInfo => {
                    console.log(runtimeInfo); // tslint:disable-line
                    resolve(`RVM/${rvmInfo.version} Runtime/${runtimeInfo.version}`);
                }, reject);
            }, reject);
        });
    }

    public log(level: "debug" | "info" | "warn" | "error", message: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.desktop.System.log(level, message, resolve, reject);
        });
    }

    public ready(): Promise<void> {
        return new Promise(resolve => this.desktop.main(resolve));
    }

    public getMainWindow(): ContainerWindow {
        if (!this.mainWindow) {
            this.mainWindow = this.wrapWindow(this.desktop.Application.getCurrent().getWindow());
        }

        return this.mainWindow;
    }

    public getCurrentWindow(): ContainerWindow {
        return this.wrapWindow(this.desktop.Window.getCurrent());
    }

    protected getWindowOptions(options?: any): any {
        const newOptions = ObjectTransform.transformProperties(options, this.windowOptionsMap);
        newOptions.customData = options ? JSON.stringify(options) : undefined;

        // Default behavior is to show window so if there is no override in options, show the window
        if (!("autoShow" in newOptions)) {
            newOptions.autoShow = true;
        }

        // Change default of window state saving to false
        if (!("saveWindowState" in newOptions) && ("defaultLeft" in newOptions || "defaultTop" in newOptions)) {
            newOptions.saveWindowState = false;
        }

        if ("icon" in newOptions) {
            newOptions.icon = this.ensureAbsoluteUrl(newOptions.icon);
        }

        return newOptions;
    }

    public wrapWindow(containerWindow: any) {
        return new OpenFinContainerWindow(containerWindow);
    }

    public createWindow(url: string, options?: any): Promise<ContainerWindow> {
        const newOptions = this.getWindowOptions(options);
        newOptions.url = url; // createWindow param will always take precedence over any passed on options

        // OpenFin requires a name for the window to show
        if (!("name" in newOptions)) {
            newOptions.name = Guid.newGuid();
        }

        return new Promise<ContainerWindow>((resolve, reject) => {
            const ofWin = new this.desktop.Window(newOptions, win => {
                resolve(this.wrapWindow(ofWin));
            }, reject);
        });
    }

    public showNotification(title: string, options?: NotificationOptions) {
        const msg = new this.desktop.Notification(ObjectTransform.transformProperties(options, this.notificationOptionsMap));
    }

    protected getMenuHtml() {
        return OpenFinContainer.menuHtml;
    }

    protected getMenuItemHtml(item: MenuItem) {
        const imgHtml: string = (item.icon)
            ? `<span><img align="absmiddle" class="context-menu-image" src="${this.ensureAbsoluteUrl(item.icon)}" /></span>`
            : "<span>&nbsp;</span>";

        return `<li class="context-menu-item" onclick="fin.desktop.InterApplicationBus.send('${(<any>this.desktop.Application.getCurrent()).uuid}`
            + `', null, 'TrayIcon_ContextMenuClick_${this.uuid}', { id: '${item.id}' });this.close()\">${imgHtml}${item.label}</li>`;
    }

    private showMenu(x: number, y: number, monitorInfo: any, menuItems: MenuItem[]) {
        this.menuItemRef = menuItems;

        const contextMenu = new this.desktop.Window(
            <any>{
                name: `trayMenu${Guid.newGuid()}`,
                saveWindowState: false,
                autoShow: false,
                defaultWidth: 150,
                defaultHeight: 100,
                showTaskbarIcon: false,
                frame: false,
                contextMenu: true,
                resizable: false,
                alwaysOnTop: true,
                shadow: true,
                smallWindow: true
            }
            , () => {
                const win: Window = contextMenu.getNativeWindow();
                win.document.open("text/html", "replace");
                win.document.write(this.getMenuHtml());
                win.document.close();

                let menuItemHtml: string = "";
                for (const item of menuItems.filter(value => value.label)) {
                    if (!item.id) {
                        item.id = Guid.newGuid();
                    }

                    menuItemHtml += this.getMenuItemHtml(item);
                }

                const contextMenuElement: HTMLElement = win.document.getElementById("contextMenu");
                contextMenuElement.innerHTML = menuItemHtml; // tslint:disable-line

                // Size <ul> to fit
                const { "offsetWidth": width, "offsetHeight": height } = contextMenuElement;
                contextMenu.resizeTo(width, height, "top-left");

                // If the menu will not fit on the monitor as right/down from x, y then show left/up
                const left = (x + width) > monitorInfo.primaryMonitor.monitorRect.right
                    ? x - width - OpenFinContainer.trayIconMenuLeftOffset
                    : x;
                const top = (y + height) > monitorInfo.primaryMonitor.monitorRect.bottom
                    ? y - height - OpenFinContainer.trayIconMenuTopOffset
                    : y;

                contextMenu.addEventListener("blurred", () => contextMenu.close());
                contextMenu.showAt(left, top, false, () => contextMenu.focus());
            });
    }

    public addTrayIcon(details: TrayIconDetails, listener: () => void, menuItems?: MenuItem[]) {
        this.desktop.Application.getCurrent()
            .setTrayIcon(this.ensureAbsoluteUrl(details.icon), (clickInfo) => {
                if (clickInfo.button === 0 && listener) { // Passthrough left click to addTrayIcon listener callback
                    listener();
                } else if (clickInfo.button === 2) { // handle right click ourselves to display context menu
                    this.showMenu(clickInfo.x + OpenFinContainer.trayIconMenuLeftOffset,
                        clickInfo.y + OpenFinContainer.trayIconMenuTopOffset,
                        clickInfo.monitorInfo,
                        menuItems);
                }
            }, () => {
                // Append desktopJS container instance uuid to topic so communication is unique to this tray icon and window
                this.desktop.InterApplicationBus.subscribe((<any>this.desktop.Application.getCurrent()).uuid,
                    "TrayIcon_ContextMenuClick_" + this.uuid, (message, uuid) => {
                        for (const prop in this.menuItemRef) {
                            const item = this.menuItemRef[prop];
                            if (item.id === message.id && item.click) {
                                item.click(item);
                            }
                        }
                    });

            }, (error) => { console.error(error); });
    }

    protected closeAllWindows(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const windowClosing: Promise<void>[] = [];

            this.desktop.Application.getCurrent().getChildWindows(windows => {
                windows.forEach(window => {
                    windowClosing.push(new Promise<void>((innerResolve, innerReject) => window.close(true, innerResolve, innerReject)));
                });

                Promise.all(windowClosing).then(() => resolve());
            }, reject);
        });
    }

    public getAllWindows(): Promise<ContainerWindow[]> {
        return new Promise<ContainerWindow[]>((resolve, reject) => {
            this.desktop.Application.getCurrent().getChildWindows(windows => {
                windows.push(this.desktop.Application.getCurrent().getWindow());
                resolve(windows.map(window => this.wrapWindow(window)));
            }, reject);
        });
    }

    public getWindowById(id: string): Promise<ContainerWindow | null> {
        return this.getWindowByName(id);
    }

    public getWindowByName(name: string): Promise<ContainerWindow | null> {
        return new Promise<ContainerWindow>((resolve, reject) => {
            this.desktop.Application.getCurrent().getChildWindows(windows => {
                windows.push(this.desktop.Application.getCurrent().getWindow());
                const win = windows.find(window => window.name === name);
                resolve(win ? this.wrapWindow(win) : null);
            });
        });
    }

    public buildLayout(): Promise<PersistedWindowLayout> {
        const layout = new PersistedWindowLayout();

        return new Promise<PersistedWindowLayout>(async (resolve, reject) => {
            const windows = await this.getAllWindows();
            const mainWindow = this.getMainWindow();
            const promises: Promise<void>[] = [];

            windows.filter(window => window.name !== "queueCounter" && !window.name.startsWith(OpenFinContainer.notificationGuid))
                .forEach(djsWindow => {
                    promises.push(new Promise<void>(async (innerResolve, innerReject) => {
                        const state = await djsWindow.getState();
                        const window = djsWindow.innerWindow;
                        window.getBounds(bounds => {
                            window.getOptions(options => {
                                // If window was created with persist: false, skip from layout
                                const customData: any = (options.customData ? JSON.parse(options.customData) : undefined);
                                if (customData && "persist" in customData && !customData.persist) {
                                    innerResolve();
                                } else {
                                    delete (<any>options).show; // show is an undocumented option that interferes with the createWindow mapping of show -> autoShow
                                    window.getGroup(group => {
                                        layout.windows.push(
                                            {
                                                name: window.name,
                                                id: window.name,
                                                url: window.getNativeWindow() ? window.getNativeWindow().location.toString() : options.url,
                                                main: (mainWindow && (mainWindow.name === window.name)),
                                                options: options,
                                                state: state,
                                                bounds: { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height },
                                                group: group.map(win => win.name)
                                            });
                                        innerResolve();
                                    }, innerReject);
                                }
                            }, innerReject);
                        }, innerReject);
                    }));
                });

            Promise.all(promises).then(() => {
                resolve(layout);
            }).catch(reject);
        });
    }
}

/** @private */
class OpenFinDisplayManager implements ScreenManager {
    private readonly desktop: any;

    public constructor(desktop: any) {
        this.desktop = desktop;
    }

    createDisplay(monitorDetails: any) {
        const display = new Display();
        display.id = monitorDetails.name;
        display.scaleFactor = monitorDetails.deviceScaleFactor;

        display.bounds = new Rectangle(monitorDetails.monitorRect.left,
            monitorDetails.monitorRect.top,
            monitorDetails.monitorRect.right - monitorDetails.monitorRect.left,
            monitorDetails.monitorRect.bottom - monitorDetails.monitorRect.top);

        display.workArea = new Rectangle(monitorDetails.availableRect.left,
            monitorDetails.availableRect.top,
            monitorDetails.availableRect.right - monitorDetails.availableRect.left,
            monitorDetails.availableRect.bottom - monitorDetails.availableRect.top);

        return display;
    }

    public getPrimaryDisplay(): Promise<Display> {
        return new Promise<Display>((resolve, reject) => {
            this.desktop.System.getMonitorInfo(monitorInfo => {
                resolve(this.createDisplay(monitorInfo.primaryMonitor));
            }, reject);
        });
    }

    public getAllDisplays(): Promise<Display[]> {
        return new Promise<Display[]>((resolve, reject) => {
            this.desktop.System.getMonitorInfo(monitorInfo => {
                resolve([monitorInfo.primaryMonitor].concat(monitorInfo.nonPrimaryMonitors).map(this.createDisplay));
            }, reject);
        });
    }

    public getMousePosition(): Promise<Point> {
        return new Promise<Point>((resolve, reject) => {
            this.desktop.System.getMousePosition(position => {
                resolve({ x: position.left, y: position.top });
            }, reject);
        });
    }
}

/** @private */
class OpenFinGlobalShortcutManager extends GlobalShortcutManager {
    private readonly desktop: any;

    public constructor(desktop: any) {
        super();
        this.desktop = desktop;
    }

    public register(shortcut: string, callback: () => void): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.desktop.GlobalHotkey.register(shortcut, callback, resolve, reject);
        });
    }

    public isRegistered(shortcut: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.desktop.GlobalHotkey.isRegistered(shortcut, resolve, reject);
        });
    }

    public unregister(shortcut: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.desktop.GlobalHotkey.unregister(shortcut, resolve, reject);
        });
    }

    public unregisterAll(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.desktop.GlobalHotkey.unregisterAll(resolve, reject);
        });
    }
}