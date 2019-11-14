/**
 * @module @morgan-stanley/desktopjs
 */

import { Container } from "./container";
import { EventEmitter, EventArgs } from "./events";

/** Represents the bounds of a rectangle */
export class Rectangle { // tslint:disable-line
    /** The x coordinate of the origin of the rectangle
     * @type {number}
     */
    public readonly x: number;

    /** The y coordinate of the origin of the rectangle
     * @type {number}
     */
    public readonly y: number;

    /** The width of the rectangle
     * @type {number}
     */
    public readonly width: number;

    /** The height of the rectangle
     * @type {number}
     */
    public readonly height: number;

    public get right(): number {
        return Rectangle.getRight(this);
    }

    public get bottom(): number {
        return Rectangle.getBottom(this);
    }

    public static getRight(r: Rectangle) { // tslint:disable-line
        return r.x + r.width;
    }

    public static getBottom(r: Rectangle): number { // tslint:disable-line
        return r.y + r.height;
    }

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

export type WindowEventType =
    "window-created" |
    "window-joinGroup" |
    "window-leaveGroup" |
    "move" |
    "resize" |
    "close" |
    "closed" |
    "focus" |
    "blur" |
    "maximize" |
    "minimize" |
    "restore" |
    "beforeunload" |
    "state-changed";

export class WindowEventArgs extends EventArgs {
    public readonly window?: ContainerWindow;
    public readonly windowId: string;
    public readonly windowName?: string;
}

export class WindowGroupEventArgs extends WindowEventArgs {
    public readonly targetWindowId?: string;
}

/** Represents a container window. */
export abstract class ContainerWindow extends EventEmitter {
    private static readonly staticEventScopePrefix: string = "containerwindow-";

    /** The underlying concrete container window. */
    public readonly innerWindow: any;

    public readonly id: string;

    public readonly name: string;

    public constructor(wrap: any) {
        super();
        this.innerWindow = wrap;
    }

    /** Navigate window to a new url */
    public abstract load(url: string, options?: any): Promise<void>;

    /** Gives focus to the window. */
    public abstract focus(): Promise<void>;

    /** Shows the window if hidden. */
    public abstract show(): Promise<void>;

    /** Hides the window if showing. */
    public abstract hide(): Promise<void>;

    /** Try to close the window.  This has the same effect as clicking the close button on the window. */
    public abstract close(): Promise<void>;

    /** Minimizes the window. */
    public abstract minimize(): Promise<void>;

    /** Maximizes the window. */
    public abstract maximize(): Promise<void>;

    /** Restores the window to its previous state. */
    public abstract restore(): Promise<void>;

    /** Determines whether the window is currently showing. */
    public abstract isShowing(): Promise<boolean>;

    /** Gets a base64 encoded snapshot of the window. */
    public abstract getSnapshot(): Promise<string>;

    /** Gets the current bounds of the window. */
    public abstract getBounds(): Promise<Rectangle>;

    public abstract flash(enable: boolean, options?: any): Promise<void>;

    /** Set the current bounds of the window.
     * @param {Rectangle} bounds
     */
    public abstract setBounds(bounds: Rectangle): Promise<void>;

    public get allowGrouping() {
        return false;
    }

    public getGroup(): Promise<ContainerWindow[]> {
        return Promise.resolve([]);
    }

    public joinGroup(target: ContainerWindow): Promise<void> {
        return Promise.reject("Not supported");
    }

    public leaveGroup(): Promise<void> {
        return Promise.resolve();
    }

    public bringToFront(): Promise<void> {
        // Provide simple delegation to focus/activate by default
        return this.focus();
    }

    public abstract getOptions(): Promise<any>;

    /** Retrieves custom window state from underlying native window by invoking 'window.getState()' if defined. */
    public getState(): Promise<any> {
        return Promise.resolve(undefined);
    }

    /** Provide custom window state to underlying native window by invoking 'window.setState()' if defined */
    public setState(state: any): Promise<void> {
        return Promise.resolve();
    }

    /** Gets the underlying native JavaScript window object. As some containers
     * do not support native access, check for undefined.
     */
    public get nativeWindow(): Window {
        return undefined;
    }

    /**
     * Override to provide custom container logic for adding an event handler.
     */
    protected abstract attachListener(eventName: WindowEventType, listener: (event: EventArgs) => void): void;

    /**
     * Registers an event listener on the specified event.
     * @param eventName {WindowEventType} eventName The type of the event.
     * @param listener {(event: EventArgs) => void} The event handler function.
     */
    public addListener(eventName: WindowEventType, listener: (event: EventArgs) => void): this {
        const callback = this.registerAndWrapListener(eventName, listener);
        this.attachListener(eventName, callback);
        return super.addListener(eventName, callback);
    }

    /**
     * Override to provide custom container logic for removing an event handler.
     */
    protected abstract detachListener(eventName: WindowEventType, listener: (event: EventArgs) => void): void;

    /**
     * Removes a previous registered event listener from the specified event.
     * @param eventName {WindowEventType} eventName The type of the event.
     * @param listener {(event: EventArgs) => void} The event handler function.
     */
    public removeListener(eventName: WindowEventType, listener: (event: EventArgs) => void): this {
        const callback = this.unwrapAndUnRegisterListener(listener) || listener;
        this.detachListener(eventName, callback);
        return super.removeListener(eventName, callback);
    }

    public static addListener(eventName: WindowEventType, listener: (event: WindowEventArgs | WindowGroupEventArgs) => void): void { // tslint:disable-line
        EventEmitter.addListener(ContainerWindow.staticEventScopePrefix + eventName, listener);
    }

    public static removeListener(eventName: WindowEventType, listener: (event: WindowEventArgs | WindowGroupEventArgs) => void): void { // tslint:disable-line
        EventEmitter.removeListener(ContainerWindow.staticEventScopePrefix + eventName, listener);
    }

    public static emit(eventName: WindowEventType, eventArgs: WindowEventArgs | WindowGroupEventArgs): void { // tslint:disable-line
        EventEmitter.emit(ContainerWindow.staticEventScopePrefix + eventName, eventArgs, Container.ipc);
    }

    public static listeners(eventName: string): ((event: EventArgs) => void)[] { // tslint:disable-line
        return EventEmitter.listeners(ContainerWindow.staticEventScopePrefix + eventName);
    }
}

/** Represents window management capability */
export interface ContainerWindowManager {
    /**
     * Gets the main ContainerWindow of the application.
     * @returns {ContainerWindow} The main ContainerWindow.
     */
    getMainWindow(): ContainerWindow;

    /**
     * Gets the current ContainerWindow
     * @returns {ContainerWindow} The current ContainerWindow
     */
    getCurrentWindow(): ContainerWindow;

    /**
     * Retrieves a list of {@link ContainerWindow} wrapped native windows.
     * @returns {Promise<ContainerWindow[]>} - A promise that returns an array of {@link ContainerWindow} if resolved
     */
    getAllWindows(): Promise<ContainerWindow[]>;

    /**
     * Retrieve a {@link ContainerWindow} with provided id.
     * @returns {Promise<ContainerWindow>} - A promise that returns a {ContainerWindow} if resolved
     */
    getWindowById(id: string): Promise<ContainerWindow | null>;

    /**
     * Retrieve a {@link ContainerWindow} with provided name.
     * @returns {Promise<ContainerWindow>} - A promise that returns a {ContainerWindow} if resolved
     */
    getWindowByName(name: string): Promise<ContainerWindow | null>;

    /**
     * Creates a new ContainerWindow.
     * @param {string} url url
     * @param {any} options (Optional)
     * @returns {ContainerWindow} A new native container window wrapped within a generic ContainerWindow.
     */
    createWindow(url: string, options?: any): Promise<ContainerWindow>;

    /**
     * Loads a window layout
     * @param {string | PersistedWindowLayout} name - Name of the window layout to load or the layout itself
     * @returns {Promise<PersistedWindowLayout>} - A promise that returns {@link PersistedWindowLayout} that is loaded
     */
    loadLayout(layout: string | PersistedWindowLayout): Promise<PersistedWindowLayout>;

    /**
     * Builds the current window layout
     */
    buildLayout(): Promise<PersistedWindowLayout>;

    /** Persists a window layout
     * @param {string} name - Name of the window layout to save
     * @returns {Promise<PersistedWindowLayout>} - A promise that returns {@link PersistedWindowLayout} if resolved
     */
    saveLayout(name: string): Promise<PersistedWindowLayout>;

    /**
     *  Retrieve a list of persisted window layouts
     *  @returns {Promise<PersistedWindowLayout[]>} - A promise that returns an array of {@link PersistedWindowLayout} if resolved
     */
    getLayouts(): Promise<PersistedWindowLayout[]>;

    /** Persists a window layout
     * @param {string} name - Name of the window layout to delete
     */
    deleteLayout(name: string): Promise<void>;
}

/** Represents a persisted window in a layout */
export class PersistedWindow {
    public name: string;
    public id: string;
    public bounds: any;
    public options?: any;
    public state?: any;
    public url?: string;
    public main?: boolean;
    public group?: string[];
}

/** Represents a persisted window layout */
export class PersistedWindowLayout {
    public name: string;
    public windows: PersistedWindow[] = [];

    constructor(name?: string) {
        this.name = name;
    }
}

type WindowGroupStatus = { window: ContainerWindow, isGrouped: boolean };

/** Specifies the tracking behavior for window state linking */
export enum WindowStateTracking {
    /** No window state tracking */
    None = 0,

    /** All windows will follow the window state of the main window */
    Main = 1 << 0,

    /** All grouped windows will follow the window state of each other */
    Group = 1 << 1
}

function isOpenFin() {
  return (typeof window !== "undefined" && (<any>window).fin);
}

export class GroupWindowManager {
    protected readonly container: Container;
    public windowStateTracking: WindowStateTracking = WindowStateTracking.None;

    public constructor(container: Container, options?: any) {
        this.container = container;

        if (options) {
            if ("windowStateTracking" in options) {
                this.windowStateTracking = options.windowStateTracking;
            }
        }

        this.attach();
    }

    public attach(win?: ContainerWindow) {
        if (win) {
            win.addListener(isOpenFin() ? <WindowEventType>"minimized" : "minimize", (e) => {
                if ((this.windowStateTracking & WindowStateTracking.Main) && this.container.getMainWindow().id === e.sender.id) {
                    this.container.getAllWindows().then(windows => {
                        windows.forEach(window => window.minimize());
                    });
                }

                if (this.windowStateTracking & WindowStateTracking.Group) {
                    e.sender.getGroup().then(windows => {
                        windows.forEach(window => window.minimize());
                    });
                }
            });

            win.addListener(isOpenFin() ? <WindowEventType>"restored" : "restore", (e) => {
                if ((this.windowStateTracking & WindowStateTracking.Main) && this.container.getMainWindow().id === e.sender.id) {
                    this.container.getAllWindows().then(windows => {
                        windows.forEach(window => window.restore());
                    });
                }

                if (this.windowStateTracking & WindowStateTracking.Group) {
                    e.sender.getGroup().then(windows => {
                        windows.forEach(window => window.restore());
                    });
                }
            });
        } else {
            // Attach handlers to any new windows that open
            ContainerWindow.addListener("window-created", (args) => {
                if (this.container && this.container.getWindowById) {
                    this.container.getWindowById(args.windowId).then(window => {
                        this.attach(window);
                    });
                }
            });

            // Attach handlers to any windows already open
            if (this.container) {
                this.container.getAllWindows().then(windows => {
                    windows.forEach(window => this.attach(window));
                });
            }
        }
    }
}

export class SnapAssistWindowManager extends GroupWindowManager {
    private readonly floater: ContainerWindow;
    public autoGrouping: boolean = true;
    public snapThreshold: number = 15;
    public snapOffset: number = 15;
    private snappingWindow: string;
    protected readonly targetGroup: Map<string, ContainerWindow> = new Map();

    public constructor(container: Container, options?: any) {
        super(container, options);

        if (options) {
            if ("snapThreshold" in options) {
                this.snapThreshold = options.snapThreshold;
            }

            if ("snapOffset" in options) {
                this.snapOffset = options.snapOffset;
            }

            if ("autoGrouping" in options) {
                this.autoGrouping = options.autoGrouping;
            }
        }
    }

    /**
     * Invoked on attach of each window to prepare windows for snap/dock feature
     */
    protected onAttached(win: ContainerWindow) {
        // For OpenFin, enable frameless api as it results in smoother handling then traditional change events
        if (win.innerWindow && win.innerWindow.disableFrame) {
            win.innerWindow.disableFrame();
        }

        // Attach listeners for handling when the move/resize of a window is done
        if (isOpenFin()) {
            // OpenFin moved handler
            win.addListener(<WindowEventType>"disabled-frame-bounds-changed", () => this.onMoved(win));
            win.addListener(<WindowEventType>"frame-enabled", () => win.innerWindow.disableFrame());
        } else {
            // Electron windows specific moved handler
            if (win.innerWindow && win.innerWindow.hookWindowMessage) {
                win.innerWindow.hookWindowMessage(0x0232, () => this.onMoved(win));  // WM_EXITSIZEMOVE
            }
        }
    }

    public attach(win?: ContainerWindow) {
        super.attach(win);

        if (win) {
            win.getOptions().then(options => {
                if (options && typeof (options.snap) !== "undefined" && options.snap === false) {
                    return;
                }

                this.onAttached(win);
                win.addListener(isOpenFin() ? <WindowEventType>"disabled-frame-bounds-changing" : "move", (e) => this.onMoving(e));
            });
        }
    }

    protected onMoving(e: any) {
        const id = e.sender.id;

        if (this.snappingWindow === id) {
            return;
        }

        e.sender.getOptions().then(senderOptions => {
            if (senderOptions && typeof (senderOptions.snap) !== "undefined" && senderOptions.snap === false) {
                return;
            }

            e.sender.getGroup().then(groupedWindows => {
                const getBounds: Promise<Rectangle> = (isOpenFin())
                    ? Promise.resolve(new Rectangle(e.innerEvent.left, e.innerEvent.top, e.innerEvent.width, e.innerEvent.height))
                    : e.sender.getBounds();

                getBounds.then(bounds => {
                    // If we are already in a group, don't snap or group with other windows, ungrouped windows need to group to us
                    if (groupedWindows.length > 0) {
                        if (isOpenFin()) {
                            this.moveWindow(e.sender, bounds);
                        }

                        return;
                    }

                    const promises: Promise<{ window: ContainerWindow, bounds: Rectangle, options: any }>[] = [];
                    this.container.getAllWindows().then(windows => {
                        windows.filter(window => id !== window.id).forEach(window => {
                            promises.push(new Promise(resolve => {
                                window.getOptions().then(targetOptions => {
                                    window.getBounds().then(targetBounds => resolve({ window: window, bounds: targetBounds, options: targetOptions }));
                                });
                            }));
                        });

                        Promise.all(promises).then(responses => {
                            let isSnapped = false;
                            let snapHint;

                            for (const target of responses.filter(response => !(response.options && typeof (response.options.snap) !== "undefined" && response.options.snap === false))) {
                                snapHint = this.getSnapBounds(snapHint || bounds, target.bounds);
                                if (snapHint) {
                                    isSnapped = true;
                                    this.showGroupingHint(target.window);
                                    this.moveWindow(e.sender, snapHint);
                                } else {
                                    this.hideGroupingHint(target.window);
                                }
                            }

                            // If the window wasn't moved as part of snapping, we need to manually move for OpenFin since dragging was disabled
                            if (!isSnapped && isOpenFin()) {
                                this.moveWindow(e.sender, bounds);
                            }
                        });
                    });
                });
            });
        });
    }

    protected moveWindow(win: ContainerWindow, bounds: Rectangle) {
        this.snappingWindow = win.id;
        win.setBounds(bounds).then(() => this.snappingWindow = undefined, () => this.snappingWindow = undefined);
    }

    protected onMoved(win: ContainerWindow) {
        if (this.autoGrouping) {
            // Get group status of all target windows
            const groupCallbacks: Promise<WindowGroupStatus>[] = [];
            this.targetGroup.forEach(target => groupCallbacks.push(new Promise<WindowGroupStatus>(resolve => {
                target.getGroup().then(windows => resolve({ window: target, isGrouped: windows.length > 0 }));
            })));

            Promise.all(groupCallbacks).then(responses => {
                // Group the dragging window to the first snapped group target
                if (responses.length > 0) {
                    win.joinGroup(responses[0].window);
                }

                // If any other snap targets are not already in a group add them to the same group otherwise skip
                for (let i = 1; i < responses.length; i++) {
                    if (!responses[i].isGrouped) {
                        responses[i].window.joinGroup(win);
                    }
                }
            });
        }

        // Reset group hint indicators on all target windows and clear out the list
        this.targetGroup.forEach(window => this.hideGroupingHint(window));
        this.targetGroup.clear();
    }

    protected showGroupingHint(win: ContainerWindow) {
        if (win.innerWindow && win.innerWindow.updateOptions) {
            win.innerWindow.updateOptions({ opacity: 0.75 });
        }

        this.targetGroup.set(win.id, win);
    }

    protected hideGroupingHint(win: ContainerWindow) {
        if (win.innerWindow && win.innerWindow.updateOptions) {
            win.innerWindow.updateOptions({ opacity: 1.0 });
        }

        this.targetGroup.delete(win.id);
    }

    private isHorizontallyAligned(r1: Rectangle, r2: Rectangle): boolean {
        return (r1.y >= r2.y && r1.y <= r2.bottom)
            || (r1.bottom >= r2.y && r1.bottom <= r2.bottom)
            || (r1.y <= r2.y && r1.bottom >= r2.bottom);
    }

    private isVerticallyAligned(r1: Rectangle, r2: Rectangle): boolean {
        return (r1.x >= r2.x && r1.x <= r2.right)
            || (r1.right >= r2.x && r1.right <= r2.right)
            || (r1.x <= r2.x && r1.right >= r2.right);
    }

    private getSnapBounds(r1: Rectangle, r2: Rectangle): Rectangle {
        let isLeftToRight, isLeftToLeft, isRightToLeft, isRightToRight, isTopToBottom, isTopToTop, isBottomToTop, isBottomToBottom: boolean;

        if (this.isHorizontallyAligned(r1, r2)) {
            // Left edge of r1 is within threshold of right edge of r2
            isLeftToRight = Math.abs(r1.x - (r2.right - this.snapOffset)) < this.snapThreshold;
            isLeftToLeft = Math.abs(r1.x - r2.x) < this.snapThreshold;

            // Right edge of r1 is within threshold of left edge of r2
            isRightToLeft = Math.abs((r1.right - this.snapOffset) - r2.x) < this.snapThreshold;
            isRightToRight = Math.abs(r1.right - r2.right) < this.snapThreshold;
        }

        if (this.isVerticallyAligned(r1, r2)) {
            // Top edge of r1 is within threshold of bottom edge of r2
            isTopToBottom = Math.abs(r1.y - (r2.bottom - this.snapOffset)) < this.snapThreshold;
            isTopToTop = Math.abs(r1.y - r2.y) < this.snapThreshold;

            // Bottom edge of r1 is within threshold of top edge of r2
            isBottomToTop = Math.abs((r1.bottom - this.snapOffset) - r2.y) < this.snapThreshold;
            isBottomToBottom = Math.abs(r1.bottom - r2.bottom) < this.snapThreshold;
        }

        // Exit out and return undefined if no bounds are within threshold
        if (!isLeftToRight && !isRightToLeft && !isTopToBottom && !isBottomToTop) {
            return undefined;
        }

        let x: number = r1.x;
        let y: number = r1.y;

        if (isLeftToRight) {
            x = r2.x + r2.width - this.snapOffset;
        } else if (isLeftToLeft) {
            x = r2.x;
        }

        if (isRightToLeft) {
            x = r2.x - r1.width + this.snapOffset;
        } else if (isRightToRight) {
            x = (r2.x + r2.width) - r1.width;
        }

        if (isTopToBottom) {
            y = r2.y + r2.height - Math.floor(this.snapOffset / 2);
        } else if (isTopToTop) {
            y = r2.y;
        }

        if (isBottomToTop) {
            y = r2.y - r1.height + Math.floor(this.snapOffset / 2);
        } else if (isBottomToBottom) {
            y = (r2.y + r2.height) - r1.height;
        }

        return new Rectangle(x, y, r1.width, r1.height);
    }
}
