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

    /** Determines whether the window is currently showing. */
    isShowing(): Promise<boolean>;

    /** Gets a base64 encoded snapshot of the window. */
    getSnapshot(): Promise<string>;
}

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
}
