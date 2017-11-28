import { Container } from "./container";
import { TrayIconDetails } from "./tray";
import { MenuItem } from "./menu";
import { EventEmitter, EventArgs } from "./events";
import { MessageBus } from "./ipc";

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

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

export type WindowEventType =
    "window-created" |
    "move" |
    "resize" |
    "close" |
    "closed" |
    "focus" |
    "blur" |
    "maximize" |
    "minimize" |
    "restore"
;

export class WindowEventArgs extends EventArgs {
    public readonly window?: ContainerWindow;
    public readonly windowId: string;
    public readonly windowName?: string;
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

    /** Gives focus to the window. */
    public abstract focus(): Promise<void>;

    /** Shows the window if hidden. */
    public abstract show(): Promise<void>;

    /** Hides the window if showing. */
    public abstract hide(): Promise<void>;

    /** Try to close the window.  This has the same effect as clicking the close button on the window. */
    public abstract close(): Promise<void>;

    /** Determines whether the window is currently showing. */
    public abstract isShowing(): Promise<boolean>;

    /** Gets a base64 encoded snapshot of the window. */
    public abstract getSnapshot(): Promise<string>;

    /** Gets the current bounds of the window. */
    public abstract getBounds(): Promise<Rectangle>;

    /** Set the current bounds of the window.
     * @param {Rectangle} bounds
     */
    public abstract setBounds(bounds: Rectangle): Promise<void>;

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

    public static addListener(eventName: WindowEventType, listener: (event: WindowEventArgs) => void): void { // tslint:disable-line
        EventEmitter.addListener(ContainerWindow.staticEventScopePrefix + eventName, listener);
    }

    public static removeListener(eventName: WindowEventType, listener: (event: WindowEventArgs) => void): void { // tslint:disable-line
        EventEmitter.removeListener(ContainerWindow.staticEventScopePrefix + eventName, listener);
    }

    public static emit(eventName: WindowEventType, eventArgs: WindowEventArgs): void { // tslint:disable-line
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
    createWindow(url: string, options?: any): ContainerWindow;

    /**
     * Loads a window layout from persistence
     * @param {string} name - Name of the window layout to load
     */
    loadLayout(name: string): Promise<PersistedWindowLayout>;

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
}

/** Represents a persisted window in a layout */
export class PersistedWindow {
    public name: any;
    public bounds: any;
    public url: string;
}

/** Represents a persisted window layout */
export class PersistedWindowLayout {
    public name: string;
    public windows: PersistedWindow[] = [];

    constructor(name?: string) {
        this.name = name;
    }
}