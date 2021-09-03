/*
 * Morgan Stanley makes this available to you under the Apache License,
 * Version 2.0 (the "License"). You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0.
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Unless required by applicable law or agreed
 * to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

/**
 * @module @morgan-stanley/desktopjs
 */

import { ContainerWindowManager, ContainerWindow, PersistedWindowLayout, WindowEventArgs } from "./window";
import { ScreenManager } from "./screen";
import { ContainerNotificationManager } from "./notification";
import { EventEmitter, EventArgs } from "./events";
import { MessageBus } from "./ipc";
import { TrayIconDetails } from "./tray";
import { MenuItem } from "./menu";
import { Guid } from "./guid";
import { GlobalShortcutManager } from "./shortcut";

export type ContainerEventType =
    "window-created" |
    "layout-loaded" |
    "layout-saved" |
    "layout-deleted";
    
export class LayoutEventArgs extends EventArgs {
    public readonly layout?: PersistedWindowLayout;
    public readonly layoutName: string;
}

export type ContainerEventArgs = EventArgs | WindowEventArgs | LayoutEventArgs;

/**
 * Represents a concrete container.
 * @extends ContainerWindowManager
 * @extends ContainerNotificationManager
 */
export abstract class Container extends EventEmitter implements ContainerWindowManager, ContainerNotificationManager {
    private static readonly staticEventScopePrefix: string = "container-";

    private static _ipc: MessageBus;

    public static readonly windowOptionsPropertyKey: string = "desktopJS-options";

    /**
     * Display type of current Container.
     * @type {string}
     */
    public abstract hostType: string;

    public async getInfo(): Promise<string | undefined> {
        return undefined;
    }

    /**
     * Unique v4 GUID for this Container instance
     * @type {string}
     */
    public abstract uuid: string;

    public ready(): Promise<void> {
        return Promise.resolve();
    }

    public abstract getMainWindow(): ContainerWindow;

    public abstract getCurrentWindow(): ContainerWindow;

    public abstract createWindow(url: string, options?: any): Promise<ContainerWindow>;

    public abstract buildLayout(): Promise<PersistedWindowLayout>;

    public abstract saveLayout(name: string): Promise<PersistedWindowLayout>;

    public abstract loadLayout(layout: string | PersistedWindowLayout): Promise<PersistedWindowLayout>;

    public abstract deleteLayout(layout: string): Promise<void>;

    public abstract getLayouts(): Promise<PersistedWindowLayout[]>;

    /**
     * Adds an icon and context menu to the system notification area.
     * @param {TrayIconDetails} details Details for the tray icon.
     * @param listener (Optional) Callback for when the tray icon is clicked.
     * @param {MenuItem[]} menuItems (Optional) Context menu.
     */
    public abstract addTrayIcon(details: TrayIconDetails, listener?: () => void, menuItems?: MenuItem[]);

    public abstract showNotification(title: string, options?: NotificationOptions);

    public abstract getAllWindows(): Promise<ContainerWindow[]>;

    public abstract getWindowById(id: string): Promise<ContainerWindow | null>;

    public abstract getWindowByName(name: string): Promise<ContainerWindow | null>;

    /**
     * Set information on the container based on the options
     */
    public abstract setOptions(options: any);

    public abstract getOptions(): Promise<any>;

    public static get ipc(): MessageBus {
        return Container._ipc;
    }

    public static set ipc(value: MessageBus) {
        EventEmitter.ipc = Container._ipc = value;
    }

    /**
     * A messaging bus for sending and receiving messages
     */
    public get ipc(): MessageBus {
        return Container.ipc;
    }

    public set ipc(value: MessageBus) {
        Container.ipc = value;
    }

    /**
     * Persistent storage
     */
    public storage: Storage;

    /**
     *  Retrieve information about screen size and displays.
     */
    public screen: ScreenManager;

    /**
     * Register/unregister global keyboard shortcut with the operating system.
     */
    public globalShortcut: GlobalShortcutManager;

    public addListener(eventName: ContainerEventType, listener: (event: ContainerEventArgs) => void): this { 
        return super.addListener(eventName, listener);
    }

    public removeListener(eventName: ContainerEventType, listener: (event: ContainerEventArgs) => void): this { 
        return super.removeListener(eventName, listener);
    }

    public emit(eventName: ContainerEventType, eventArgs: ContainerEventArgs): void { 
        super.emit(eventName, eventArgs);
    }

    public static addListener(eventName: ContainerEventType, listener: (event: ContainerEventArgs) => void): void { 
        EventEmitter.addListener(Container.staticEventScopePrefix + eventName, listener);
    }

    public static removeListener(eventName: ContainerEventType, listener: (event: ContainerEventArgs) => void): void { 
        EventEmitter.removeListener(Container.staticEventScopePrefix + eventName, listener);
    }

    public static emit(eventName: ContainerEventType, eventArgs: ContainerEventArgs): void { 
        EventEmitter.emit(Container.staticEventScopePrefix + eventName, eventArgs, Container.ipc);
    }

    public static listeners(eventName: string): ((event: EventArgs) => void)[] { 
        return EventEmitter.listeners(Container.staticEventScopePrefix + eventName);
    }
}

/**
 * Represents a common Container to be used as a base for any custom Container implementation.
 * @augments Container
 */
export abstract class ContainerBase extends Container {
    public hostType: string;
    public uuid: string = Guid.newGuid();

    public static readonly layoutsPropertyKey: string = "desktopJS-layouts";

    showNotification(title: string, options?: NotificationOptions) {
        throw new TypeError("Notifications not supported by this container");
    }

    addTrayIcon(details: TrayIconDetails, listener?: () => void, menuItems?: MenuItem[]) {
        throw new TypeError("Tray icons are not supported by this container.");
    }

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
        this.emit("layout-saved", { sender: this, name: "layout-saved", layout: layout, layoutName: layout.name });
        Container.emit("layout-saved", { name: "layout-saved", layout: layout, layoutName: layout.name });
    }

    protected deleteLayoutFromStorage(name: string) {
        const layouts: any = JSON.parse(this.storage.getItem(ContainerBase.layoutsPropertyKey)) || {};
        const layout = layouts[name];

        if (layout) {
            delete layouts[name];

            this.storage.setItem(ContainerBase.layoutsPropertyKey, JSON.stringify(layouts));
            this.emit("layout-deleted", { sender: this, name: "layout-deleted", layoutName: layout.name });
            Container.emit("layout-deleted", { name: "layout-deleted", layoutName: layout.name });
        }
    }

    protected abstract closeAllWindows(excludeSelf?: boolean): Promise<void>;

    public async loadLayout(layout: string | PersistedWindowLayout): Promise<PersistedWindowLayout> {
        await this.closeAllWindows(true);

        const layoutToLoad = (typeof layout === "string") ? this.getLayoutFromStorage(layout) : layout;
        if (layoutToLoad?.windows) {
            const promises: Promise<ContainerWindow>[] = [];
            for (const window of layoutToLoad.windows) {
                const options: any = Object.assign(window.options || {}, window.bounds);
                options.name = window.name;
                if (window.main) {
                    this.getMainWindow().setBounds(window.bounds);
                    promises.push(Promise.resolve(this.getMainWindow()));
                } else {
                    promises.push(this.createWindow(window.url, options));
                }
            }
            
            const windows = await Promise.all(promises);
            
            const groupMap: Map<ContainerWindow, string[]> = new Map();
            
            // de-dupe window grouping
            windows.forEach(window => {
                const matchingWindow = layoutToLoad.windows.find(win => win.name === window.name);
                if (matchingWindow && matchingWindow.state && window.setState) {
                    window.setState(matchingWindow.state).catch(e => this.log("error", "Error invoking setState: " + e));
                }
                
                let found = false;
                groupMap.forEach((targets, win) => {
                    if (!found && targets.indexOf(window.id) >= 0) {
                        found = true;
                    }
                });
                
                if (!found) {
                    const group = matchingWindow ? matchingWindow.group : undefined;
                    if (group && group.length > 0) {
                        groupMap.set(window, group.filter(id => id !== window.id));
                    }
                }
            });
            
            groupMap.forEach((targets, window) => {
                targets.forEach(target => {
                    this.getWindowByName(layoutToLoad.windows.find(win => win.id === target).name).then(targetWin => {
                        targetWin.joinGroup(window);
                    });
                });
            });
            
            
            this.emit("layout-loaded", { sender: this, name: "layout-loaded", layout: layoutToLoad, layoutName: layoutToLoad.name });
            Container.emit("layout-loaded", { name: "layout-loaded", layout: layoutToLoad, layoutName: layoutToLoad.name });
            return layoutToLoad;
        } else {
            throw new Error("Layout does not exist or is invalid");
        }
    }

    public abstract buildLayout(): Promise<PersistedWindowLayout>;

    public async saveLayout(name: string) {
        const layout = await this.buildLayout();
        this.saveLayoutToStorage(name, layout);
        return layout;
    }

    public async deleteLayout(name: string) {
        return this.deleteLayoutFromStorage(name);
    }

    public async getLayouts(): Promise<PersistedWindowLayout[]> {
        const rawLayouts = this.storage.getItem(ContainerBase.layoutsPropertyKey);
        if (rawLayouts) {
            const layouts = JSON.parse(rawLayouts);
            return Object.getOwnPropertyNames(layouts).map(key => layouts[key]);
        }
    }

    /**
     * Write a log message
     * @param  {"debug" | "info" | "warn" | "error"} level The log level for the entry
     * @param {string} message The log message text
     */
    public async log(level: "debug" | "info" | "warn" | "error", message: string) {
        let logger;
        switch (level) {
            case "debug": 
            case "warn": 
            case "error": {
                logger = console[level]; // eslint-disable-line no-console
                break;
            }
            default: {
                logger = console.log; // eslint-disable-line no-console
            }
        }
        
        if (logger) {
            logger(message);
        }
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

        if (this.globalWindow) {
            const open = this.globalWindow.open;
            this.globalWindow.open = (...args: any[]) => {
                return this.onOpen(open, ...args);
            };
        }
    }

    protected onOpen(open: (...args: any[]) => Window, ...args: any[]): Window {
        return open.apply(this.globalWindow, args);
    }

    public abstract wrapWindow(window: any): ContainerWindow;

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
