/**
 * @module @morgan-stanley/desktopjs
 */

/** Represents an individual item used in menus and context menus. */
export class MenuItem { 
    /** Unique identifier for the menu item.
     * @type {string}
     */
    id?: string;

    /**
     * Text to be displayed.
     * @type {string}
     */
    label?: string;

    /**
     * Image to be displayed.
     * @type {string}
     */
    icon?: string;

    /**
     * @type {MenuItem[]}
     */
    submenu? : MenuItem[];

    /**
     * Callback for when the menu item is clicked.
     */
    click?: (menuItem: MenuItem) => void;
}