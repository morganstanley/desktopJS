import { Container, WebContainerBase } from "../container";
import { ContainerWindow, PersistedWindowLayout, PersistedWindow, Rectangle } from "../window";
import { NotificationOptions } from "../notification";
import { ObjectTransform, PropertyMap } from "../propertymapping";
import { Guid } from "../guid";
import { MessageBus, MessageBusSubscription, MessageBusOptions } from "../ipc";

declare var Notification: any;

const windowEventMap = {
    close: "unload"
};

/**
 * @augments ContainerWindow
 */
export class DefaultContainerWindow extends ContainerWindow {
    public constructor(wrap: any) {
        super(wrap);
    }

    public get id(): string {
        return this.innerWindow[DefaultContainer.windowUuidPropertyKey];
    }

    public get name(): string {
        return this.innerWindow[DefaultContainer.windowNamePropertyKey];
    }

    public focus(): Promise<void> {
        this.innerWindow.focus();
        return Promise.resolve();
    }

    public show(): Promise<void> {
        return Promise.resolve();
    }

    public hide(): Promise<void> {
        return Promise.resolve();
    }

    public close(): Promise<void> {
        this.innerWindow.close();
        return Promise.resolve();
    }

    public isShowing(): Promise<boolean> {
        // https://github.com/ai/visibilityjs ?
        return Promise.resolve(true);
    }

    public getSnapshot(): Promise<string> {
        return Promise.reject("getSnapshot requires an implementation.");
    }

    public flash(enable: boolean, options?: any): Promise<void> {
        return Promise.reject("Not supported");
    }

    public getBounds(): Promise<Rectangle> {
        return new Promise<Rectangle>(resolve => {
            resolve(new Rectangle(this.innerWindow.screenX, this.innerWindow.screenY, this.innerWindow.outerWidth, this.innerWindow.outerHeight));
        });
    }

    public setBounds(bounds: Rectangle): Promise<void> {
        return new Promise<void>(resolve => {
            this.innerWindow.moveTo(bounds.x, bounds.y);
            this.innerWindow.resizeTo(bounds.width, bounds.height);
            resolve();
        });
    }

    protected attachListener(eventName: string, listener: (...args: any[]) => void): void {
        this.innerWindow.addEventListener(windowEventMap[eventName] || eventName, listener);
    }

    protected detachListener(eventName: string, listener: (...args: any[]) => void): void {
        this.innerWindow.removeEventListener(windowEventMap[eventName] || eventName, listener);
    }
}

/**
 * @augments MessageBus
 */
export class DefaultMessageBus implements MessageBus {
    private container: DefaultContainer;
    private static readonly messageSource: string = "desktopJS";

    constructor(container: DefaultContainer) {
        this.container = container;
    }

    subscribe<T>(topic: string, listener: (event: any, message: T) => void, options?: MessageBusOptions): Promise<MessageBusSubscription> {
        return new Promise<MessageBusSubscription>((resolve, reject) => {
            const subscription: MessageBusSubscription = new MessageBusSubscription(topic, (event: any) => {
                // Only allow same origin
                if (event.origin !== this.container.globalWindow.location.origin) {
                    return;
                }

                // Make sure topic received matches the one that was subscribed
                const { source, "topic": receivedTopic, message } = JSON.parse(event.data);

                if (source === DefaultMessageBus.messageSource && topic === receivedTopic) {
                    listener({ topic: topic }, message);
                }
            });

            if (this.container.globalWindow && this.container.globalWindow.addEventListener) {
                this.container.globalWindow.addEventListener("message", subscription.listener);
            }

            resolve(subscription);
        });
    }

    unsubscribe(subscription: MessageBusSubscription): Promise<void> {
        return Promise.resolve(this.container.globalWindow.removeEventListener("message", subscription.listener));
    }

    publish<T>(topic: string, message: T, options?: MessageBusOptions): Promise<void> {
        // Get list of windows from global (set by opener on creation) or fallback to opener global in case
        // there is a race condition of getting here before the opener set the global for us
        const windows: Window[] = (this.container.globalWindow)
                                    ?  this.container.globalWindow[DefaultContainer.windowsPropertyKey]
                                       || (this.container.globalWindow.opener && this.container.globalWindow.opener[DefaultContainer.windowsPropertyKey])
                                    : [];

        if (windows) {
            for (const key in windows) {
                const win = windows[key];

                if (options && options.name && options.name !== win[DefaultContainer.windowNamePropertyKey]) {
                    continue;
                }

                // Since there should be nothing listening, don't bother sending to non matching origin children
                if (win.location.origin !== this.container.globalWindow.location.origin) {
                    continue;
                }

                win.postMessage(JSON.stringify({ source: DefaultMessageBus.messageSource, topic: topic, message: message }), this.container.globalWindow.location.origin);
            }
        }

        return Promise.resolve();
    }
}

/**
 * @augments WebContainerBase
 */
export class DefaultContainer extends WebContainerBase {
    private mainWindow: ContainerWindow;
    private windows: ContainerWindow[];

    public static readonly windowsPropertyKey: string = "desktopJS-windows";
    public static readonly windowUuidPropertyKey: string = "desktopJS-uuid";
    public static readonly windowNamePropertyKey: string = "desktopJS-name";

    public static readonly defaultWindowOptionsMap: PropertyMap = {
        x: { target: "left" },
        y: { target: "top" }
    };

    public windowOptionsMap: PropertyMap = DefaultContainer.defaultWindowOptionsMap;

    public constructor(win?: Window) {
        super(win);
        this.hostType = "Default";

        this.ipc = new DefaultMessageBus(this);

        // Create a global windows object for tracking all windows and add the current global window for current
        if (this.globalWindow && !(DefaultContainer.windowsPropertyKey in this.globalWindow)) {
            this.globalWindow[DefaultContainer.windowsPropertyKey] = { root: this.globalWindow };
        }
    }

    public getMainWindow(): ContainerWindow {
        if (!this.mainWindow) {
            this.mainWindow = new DefaultContainerWindow(this.globalWindow);
        }

        return this.mainWindow;
    }

    public getCurrentWindow(): ContainerWindow {
        return this.wrapWindow(this.globalWindow);
    }

    protected getWindowOptions(options?: any): any {
        return ObjectTransform.transformProperties(options, this.windowOptionsMap);
    }

    public wrapWindow(containerWindow: any) {
        return new DefaultContainerWindow(containerWindow);
    }

    public createWindow(url: string, options?: any): Promise<ContainerWindow> {
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

        const window = this.globalWindow.open(url, target, features);

        // Set name as a unique desktopJS name property instead of overloading window.name
        window[DefaultContainer.windowNamePropertyKey] = newOptions.name;

        // Add the new window to the global windows object
        const windows = this.globalWindow[DefaultContainer.windowsPropertyKey];
        const uuid = window[DefaultContainer.windowUuidPropertyKey] = Guid.newGuid();
        windows[uuid] = window;

        // Attach event handlers on window to cleanup reference on global windows object.  beforeunload -> unload to prevent
        // unload being called on open within Chrome.
        window.addEventListener("beforeunload", () => {
            window.addEventListener("unload", () => {
                delete windows[uuid];
            });
        });

        // Propagate the global windows object to the new window
        window[DefaultContainer.windowsPropertyKey] = windows;

        const newWindow = this.wrapWindow(window);
        this.emit("window-created", { sender: this, name: "window-created", window: newWindow, windowId: uuid, windowName: newOptions.name });
        Container.emit("window-created", { name: "window-created", windowId: uuid, windowName: newOptions.name });
        ContainerWindow.emit("window-created", { name: "window-created", windowId: uuid, windowName: newOptions.name });
        return Promise.resolve(newWindow);
    }

    public showNotification(title: string, options?: NotificationOptions) {
        if (!("Notification" in this.globalWindow)) {
            console.warn("Notifications not supported");
            return;
        }

        (<any>this.globalWindow).Notification.requestPermission(permission => {
            if (permission === "denied") {
                console.warn("Notifications not permitted");
            } else if (permission === "granted") {
                new (<any>this.globalWindow).Notification(title, options); // tslint:disable-line
            }
        });
    }

    protected closeAllWindows(excludeSelf?: Boolean): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const windows = this.globalWindow[DefaultContainer.windowsPropertyKey];
            for (const key in windows) {
                const win = windows[key];
                if (!excludeSelf || this.globalWindow !== win) {
                    win.close();
                }
            }
            resolve();
        });
    }

    public getAllWindows(): Promise<ContainerWindow[]> {
        return new Promise<ContainerWindow[]>((resolve, reject) => {
            const windows: ContainerWindow[] = [];
            const trackedWindows = this.globalWindow[DefaultContainer.windowsPropertyKey];
            for (const key in trackedWindows) {
                windows.push(trackedWindows[key]);
            }
            resolve(windows);
        });
    }

    public getWindowById(id: string): Promise<ContainerWindow | null> {
        return new Promise<ContainerWindow>((resolve, reject) => {
            const win = this.globalWindow[DefaultContainer.windowsPropertyKey][id];
            resolve(win ? this.wrapWindow(win) : null);
        });
    }

    public getWindowByName(name: string): Promise<ContainerWindow | null> {
        return new Promise<ContainerWindow>((resolve, reject) => {
            const trackedWindows = this.globalWindow[DefaultContainer.windowsPropertyKey];
            for (const key in trackedWindows) {
                if (trackedWindows[key][DefaultContainer.windowNamePropertyKey] === name) {
                    resolve(this.wrapWindow(trackedWindows[key]));
                    return;
                }
            }

            resolve(null);
        });
    }

    public saveLayout(name: string): Promise<PersistedWindowLayout> {
        const layout = new PersistedWindowLayout();

        return new Promise<PersistedWindowLayout>((resolve, reject) => {
            const windows = this.globalWindow[DefaultContainer.windowsPropertyKey];
            for (const key in windows) {
                const win = windows[key];
                if (this.globalWindow !== win) {
                    layout.windows.push({ name: win.name, url: win.location.toString(), bounds: { x: win.screenX, y: win.screenY, width: win.outerWidth, height: win.outerHeight } });
                }
            }

            this.saveLayoutToStorage(name, layout);
            resolve(layout);
        });
    }
}