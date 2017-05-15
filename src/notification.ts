export class NotificationOptions {
    title?: string;
    url?: string;
    message?: string;
}

export interface ContainerNotificationManager {
    /**
     * Display a notification.
     * @param {NotificationOptions} options Notification options.
     */
    showNotification(options: NotificationOptions);
}