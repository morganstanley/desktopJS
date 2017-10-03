import { ContainerWindowManager, ContainerWindow, PersistedWindowLayout, PersistedWindow } from "./window";
import { ContainerNotificationManager } from "./notification";
import { EventEmitter, EventArgs } from "./events";
import { MessageBus } from "./ipc";
import { TrayIconDetails } from "./tray";
import { MenuItem } from "./menu";
import { Guid } from "./guid";

export type ContainerEventType =
    "window-created" |
    "layout-loaded" |
    "layout-saved";

export class WindowEventArgs extends EventArgs {
    public readonly window: ContainerWindow;
}

export class LayoutEventArgs extends EventArgs {
    public readonly layout: PersistedWindowLayout;
}

export type ContainerEventArgs = EventArgs | WindowEventArgs | LayoutEventArgs;

/**
 * Represents a concrete container.
 * @extends ContainerWindowManager
 * @extends ContainerNotificationManager
 */
export interface Container extends ContainerWindowManager, ContainerNotificationManager {
    /**
     * Display type of current Container.
     * @type {string}
     */
    hostType: string;

    /**
     * Unique v4 GUID for this Container instance
     * @type {string}
     */
    uuid: string;

    /**
     * Adds an icon and context menu to the system notification area.
     * @param {TrayIconDetails} details Details for the tray icon.
     * @param listener (Optional) Callback for when the tray icon is clicked.
     * @param {MenuItem[]} menuItems (Optional) Context menu.
     */
    addTrayIcon(details: TrayIconDetails, listener?: () => void, menuItems?: MenuItem[]);

    /**
     * A messaging bus for sending and receiving messages
     */
    readonly ipc: MessageBus;

    /**
     * Persistent storage
     */
    storage: Storage;
}

/**
 * Represents a common Container to be used as a base for any custom Container implementation.
 * @augments Container
 */
export abstract class ContainerBase extends EventEmitter implements Container {
    public hostType: string;
    public uuid: string = Guid.newGuid();

    public static readonly layoutsPropertyKey: string = "desktopJS-layouts";

    abstract getMainWindow(): ContainerWindow;

    abstract getCurrentWindow(): ContainerWindow;

    abstract createWindow(url: string, options?: any): ContainerWindow;

    showNotification(title: string, options?: NotificationOptions) {
        throw new TypeError("Notifications not supported by this container");
    }

    addTrayIcon(details: TrayIconDetails, listener?: () => void, menuItems?: MenuItem[]) {
        throw new TypeError("Tray icons are not supported by this container.");
    }

    public ipc: MessageBus;

    public storage: Storage = (typeof window !== "undefined" && window)
            ? window.localStorage
            : undefined;

    protected getLayoutFromStorage(name: string): PersistedWindowLayout {
        return JSON.parse(this.storage.getItem(ContainerBase.layoutsPropertyKey))[name];
    }

    protected saveLayoutToStorage(name: string, layout: PersistedWindowLayout) {
        const layouts: any = JSON.parse(this.storage.getItem(ContainerBase.layoutsPropertyKey)) || {};

        if (!layout.name) {
            layout.name = name;
        }

        layouts[name] = layout;

        this.storage.setItem(ContainerBase.layoutsPropertyKey, JSON.stringify(layouts));
        this.emit("layout-saved", { sender: this, name: "layout-loaded", layout: layout });
    }

    protected abstract closeAllWindows(excludeSelf?: Boolean): Promise<void>;

    public abstract getAllWindows(): Promise<ContainerWindow[]>;

    public loadLayout(name: string): Promise<PersistedWindowLayout> {
        return new Promise<PersistedWindowLayout>((resolve, reject) => {
            this.closeAllWindows(true).then(() => {
                const layout = <PersistedWindowLayout>this.getLayoutFromStorage(name);
                if (layout && layout.windows) {
                    for (const window of layout.windows) {
                        const options: any = Object.assign({}, window.bounds);
                        options.name = window.name;
                        this.createWindow(window.url, options);
                    }
                }

                this.emit("layout-loaded", { sender: this, name: "layout-loaded", layout: layout });
                resolve(layout);
            });
        });
    }

    abstract saveLayout(name: string): Promise<PersistedWindowLayout>;

    public getLayouts(): Promise<PersistedWindowLayout[]> {
        return new Promise<PersistedWindowLayout[]>((resolve, reject) => {
            const rawLayouts = this.storage.getItem(ContainerBase.layoutsPropertyKey);
            if (rawLayouts) {
                const layouts = JSON.parse(rawLayouts);
                resolve(Object.getOwnPropertyNames(layouts).map(key => layouts[key]));
            }

            resolve(undefined);
        });
    }

    public addListener(eventName: ContainerEventType, listener: (event: ContainerEventArgs) => void): this { // tslint:disable-line
        return super.addListener(eventName, listener);
    }

    public removeListener(eventName: ContainerEventType, listener: (event: ContainerEventArgs) => void): this { // tslint:disable-line
        return super.removeListener(eventName, listener);
    }

    public emit(eventName: ContainerEventType, eventArgs: ContainerEventArgs) { // tslint:disable-line
        super.emit(eventName, eventArgs);
    }
}

/**
 * Represents a common Container to be used as a base for any custom web based implementation.
 * @extends ContainerBase
 */
export abstract class WebContainerBase extends ContainerBase {
    public readonly globalWindow: Window;
    private linkHelper: any;

    public constructor(win?: Window) {
        super();

        this.globalWindow = win || (typeof window !== "undefined" && window) || null;

        // Create helper link for ensuring absolute urls
        this.linkHelper = { href: "unknown" };
        try {
            this.linkHelper = this.globalWindow.top.document.createElement("a");
        } catch (e) { /* Swallow */ }
    }

    /**
     * Returns an absolute url
     * @param {string} url url
     * @returns {string} An absolute url
     */
    protected ensureAbsoluteUrl(url: string): string {
        if (this.linkHelper) {
            this.linkHelper.href = url;
            return this.linkHelper.href;
        } else {
            return url;
        }
    }
}
