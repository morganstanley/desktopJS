/**
 * @module @morgan-stanley/desktopjs
 */

export class NotificationOptions {
    url?: string;
    body?: string;
}

export interface ContainerNotificationManager {
    /**
     * Display a notification.
     * @param {string} title Defines a title for the notification.  Depending on container and choice of notification mechanism, this might not be shown.
     * @param {NotificationOptions} [options] Notification options.
     */
    showNotification(title: string, options?: NotificationOptions);
}

export abstract class ContainerNotification {
    /**
     * A string representing the current permission to display notifications.
     */
    static permission: NotificationPermission = "granted";

    /**
     * A handler for the click event.  It is triggered each time the user clicks the notification.
     */
    onclick: any;

    /**
     * A handler for the error event.  It is triggered each the the notification encounters an error.
     */
    onerror: any;

    /**
     * Requests permission from the user to display notifications.
     * @param {NotificationPermissionCallback} [callback] An optional callback function that is called with the permission value. Depcrecated in favor of the promise return value
     * @returns {Promise<string>} A Promise that resolves to the permission picked by the user.
     */
    static async requestPermission(callback?: NotificationPermissionCallback): Promise<string> { 
        if (callback) {
            callback(ContainerNotification.permission);
        }
        return ContainerNotification.permission;
    }

    /**
     * Creates a new Notification object instance which represents a user notification.
     * @param {string} title Defines a title for the notification.  Depending on container and choice of notification mechanism, this might not be shown.
     * @param {NotificationOptions} [options] Notification options.
     */
    constructor(protected title: string, protected options?: NotificationOptions) {}
}