import { TrayIconDetails } from "./tray";
import { MenuItem } from "./menu";

/** Represents a container window. */
export interface ContainerWindow {
    /** The underlying concrete container window. */
    readonly containerWindow: any;

    /** Gives focus to the window. */
    focus(): Promise<void>;

    /** Shows the window if hidden. */
    show(): Promise<void>;

    /** Hides the window if showing. */
    hide(): Promise<void>;

    /** Try to close the window.  This has the same effect as clicking the close button on the window. */
    close(): Promise<void>;

    /** Determines whether the window is currently showing. */
    isShowing(): Promise<boolean>;

    /** Gets a base64 encoded snapshot of the window. */
    getSnapshot(): Promise<string>;
}

/** Represents window management capability */
export interface ContainerWindowManager {
    /**
     * Gets the main ContainerWindow of the application.
     * @returns {ContainerWindow} The main ContainerWindow.
     */
    getMainWindow(): ContainerWindow;

    /**
     * Creates a new ContainerWindow.
     * @param {string} url url
     * @param {any} options (Optional)
     * @returns {ContainerWindow} A new native container window wrapped within a generic ContainerWindow.
     */
    showWindow(url: string, options?: any): ContainerWindow;

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