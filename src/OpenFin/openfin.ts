import * as ContainerRegistry from "../registry";
import { ContainerWindow, PersistedWindowLayout, PersistedWindow, Rectangle } from "../window";
import { Container, WebContainerBase } from "../container";
import { ObjectTransform, PropertyMap } from "../propertymapping";
import { NotificationOptions, ContainerNotification } from "../notification";
import { TrayIconDetails } from "../tray";
import { MenuItem } from "../menu";
import { Guid } from "../guid";
import { MessageBus, MessageBusSubscription, MessageBusOptions } from "../ipc";

ContainerRegistry.registerContainer("OpenFin", {
    condition: () => typeof window !== "undefined" && "fin" in window && "desktop" in fin,
    create: () => new OpenFinContainer()
});

const windowEventMap = {
    move: "bounds-changing",
    resize: "bounds-changed",
    close: "close-requested",
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

    public setBounds(bounds: Rectangle): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.setBounds(bounds.x, bounds.y, bounds.width, bounds.height, resolve, reject);
        });
    }

    protected attachListener(eventName: string, listener: (...args: any[]) => void): void {
        this.innerWindow.addEventListener(windowEventMap[eventName] || eventName, listener);
    }

    protected detachListener(eventName: string, listener: (...args: any[]) => void): any {
        this.innerWindow.removeEventListener(windowEventMap[eventName] || eventName, listener);
    }
}

/**
 * @augments MessageBus
 */
export class OpenFinMessageBus implements MessageBus {
    private bus: fin.OpenFinInterApplicationBus;
    private uuid: string;

    public constructor(bus: fin.OpenFinInterApplicationBus, uuid: string) {
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
    private desktop: fin.OpenFinDesktop;
    private mainWindow: OpenFinContainerWindow;
    private menuItemRef: MenuItem[];

    // Offsets for tray icon mouse click to not show over icon
    private static readonly trayIconMenuLeftOffset: number = 4;
    private static readonly trayIconMenuTopOffset: number = 23;

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

    public constructor(desktop?: fin.OpenFinDesktop, win?: Window) {
        super(win);
        this.desktop = desktop || fin.desktop;
        this.hostType = "OpenFin";

        this.ipc = new OpenFinMessageBus(this.desktop.InterApplicationBus, (<any>this.desktop.Application.getCurrent()).uuid);
        this.registerNotificationsApi();
    }

    protected registerNotificationsApi() {
        if (OpenFinContainer.replaceNotificationApi && typeof this.globalWindow !== "undefined" && this.globalWindow) {
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

    protected wrapWindow(containerWindow: any) {
        return new OpenFinContainerWindow(containerWindow);
    }

    public createWindow(url: string, options?: any): ContainerWindow {
        const newOptions = this.getWindowOptions(options);
        newOptions.url = url; // createWindow param will always take precedence over any passed on options

        // OpenFin requires a name for the window to show
        if (!("name" in newOptions)) {
            newOptions.name = Guid.newGuid();
        }

        const newWindow = this.wrapWindow(new this.desktop.Window(newOptions));
        this.emit("window-created", { sender: this, name: "window-created", window: newWindow, windowId: newOptions.name, windowName: newOptions.name });
        Container.emit("window-created", { name: "window-created", windowId: newOptions.name, windowName: newOptions.name });
        ContainerWindow.emit("window-created", { name: "window-created", windowId: newOptions.name, windowName: newOptions.name });
        return newWindow;
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

    private showMenu(x: number, y: number, monitorInfo: fin.MonitorInfo, menuItems: MenuItem[]) {
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
                shadow: true
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
                const win = windows.find(window => window.name === name);
                resolve(win ? this.wrapWindow(win) : null);
            });
        });
    }

    public saveLayout(name: string): Promise<PersistedWindowLayout> {
        const layout = new PersistedWindowLayout();

        return new Promise<PersistedWindowLayout>((resolve, reject) => {
            this.desktop.Application.getCurrent().getChildWindows(windows => {
                const windowClosing: Promise<void>[] = [];

                windows.forEach(window => {
                    windowClosing.push(new Promise<void>((innerResolve, innerReject) => {
                        window.getBounds(bounds => {
                            window.getOptions(options => {
                                layout.windows.push({ name: window.name, url: options.url, bounds: { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height } });
                                innerResolve();
                            });
                        });
                    }));
                });

                Promise.all(windowClosing).then(() => {
                    this.saveLayoutToStorage(name, layout);
                    resolve(layout);
                });
            });
        });
    }
}
