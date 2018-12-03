/**
 * @module @morgan-stanley/desktopjs
 */

import { Rectangle } from "./window";

/** Represents a position in coordinates */
export class Point {
    public readonly x: number;
    public readonly y: number;
}

/** Retrieve information about screen size, display, etc. */
export interface ScreenManager {
    /**
     * Retrieves details of the primary display.
     * @returns {Promise<Display>} The primary display
     */
    getPrimaryDisplay(): Promise<Display>;

    /**
     * Retrieves details of all displays.
     * @returns {Promise<Display[]>} An array of all displays
     */
    getAllDisplays(): Promise<Display[]>;

    /**
     * Retrieves the current absolute position of the mouse pointer.
     * @returns {Point} The current coordinates
     */
    getMousePosition(): Promise<Point>;
 }

 /** Details of a display connected to the system. */
export class Display {
    /**
     * Bounds of the display.
     * @type {Rectangle}
     */
    public bounds: Rectangle;

    /**
     * Unique identifier associated with the display.
     * @type {string}
     */
    public id: string;

    /**
     * Output device's pixel scale factor.
     * @type {number}
     */
    public scaleFactor: number;

    /**
     * Bounds of the display restricted to the client area.
     * @type {Rectangle}
     */
    public workArea: Rectangle;
}