/**
 * @module @morgan-stanley/desktopjs
 */

import { MessageBus } from "./ipc";

export class EventArgs {
    public readonly sender?: any;

    public readonly innerEvent?: any;

    public readonly name: string;

    public returnValue? : any;

    constructor(sender: any, name: string, innerEvent?: any) {
        this.sender = sender;
        this.name = name;
        this.innerEvent = innerEvent;
    }
}

export class EventEmitter {
    private eventListeners: Map<string, ((event: EventArgs) => void)[]> = new Map();

    private static staticEventListeners: Map<string, ((event: EventArgs) => void)[]> = new Map();

    private wrappedListeners: Map<(event: EventArgs) => void, (event: EventArgs) => void> = new Map();

    private static readonly staticEventName: string = "desktopJS.static-event";

    /**
     * Registers an event listener on the specified event.
     * @param {string} eventName The type of the event.
     * @param {(event: EventArgs) => void} listener The event handler function.
     */
    public addListener(eventName: string, listener: (event: EventArgs) => void): this {
        (this.eventListeners[eventName] = this.eventListeners[eventName] || []).push(listener);
        return this;
    }

    protected registerAndWrapListener(eventName: string, listener: (event: EventArgs) => void): (event: EventArgs) => void {
        const callback = this.wrapListener(eventName, listener);
        this.wrappedListeners.set(listener, callback);
        return callback;
    }

    protected wrapListener(eventName: string, listener: (event: EventArgs) => void): (event: EventArgs) => void {
        return (event) => {
            const args = new EventArgs(this, eventName, event);
            this.preProcessArgs(args);
            const result = listener(args);
            this.postProcessArgs(args);
            return result;
        };
    }

    protected preProcessArgs(args: EventArgs) {
        // Do nothing in base
    }

    protected postProcessArgs(args: EventArgs) {
        if (args && typeof args.returnValue !== "undefined") {
            (<any>args.innerEvent).returnValue = args.returnValue;
        }
    }

    protected unwrapAndUnRegisterListener(listener: (event: EventArgs) => void): (event: EventArgs) => void {
        const callback = this.wrappedListeners.get(listener);
        if (callback) {
            this.wrappedListeners.delete(listener);
        }

        return callback;
    }

    /**
     * Removes a previous registered event listener from the specified event.
     * @param {string} eventName The type of the event.
     * @param {(event: EventArgs) => void} listener The event handler function.
     */
    public removeListener(eventName: string, listener: (event: EventArgs) => void): this {
        const listeners = this.listeners(eventName);

        if (listeners) {
            const i = listeners.indexOf(listener);
            if (i >= 0) {
                listeners.splice(i, 1);
            }
        }

        return this;
    }

    /**
     * Gets an array of listeners for a specific event type.
     * @param {string} eventName eventName The type of the event.
     */
    public listeners(eventName: string): ((event: EventArgs) => void)[] {
        return (this.eventListeners[eventName] || []);
    }

    /**
     * Invokes each listener registered for the specified event type.
     * @param {string} eventName The type of the event.
     * @param {MessageBus} ipc (Optional) The {MessageBus} in which to broadcast the event.
     */
    public emit(eventName: string, eventArgs: EventArgs) {
        for (const listener of this.listeners(eventName)) {
            listener(eventArgs);
        }
    }

    /**
     * Set message bus used for static event broadcasting across windows.
     */
    public static set ipc(value: MessageBus) {
        if (value) {
            value.subscribe(EventEmitter.staticEventName, (event: any, message: any) => {
                EventEmitter.emit(message.eventName, message.eventArgs);
            });
        }
    }

    /**
     * Registers an event listener on the specified static event.
     * @param {string} eventName The type of the event.
     * @param {(event: EventArgs) => void} listener The event handler function.
     */
    public static addListener(eventName: string, listener: (event: EventArgs) => void): void { // tslint:disable-line
        (this.staticEventListeners[eventName] = this.staticEventListeners[eventName] || []).push(listener);
    }

    /**
     * Removes a previous registered event listener from the specified static event.
     * @param {string} eventName The type of the event.
     * @param {(event: EventArgs) => void} listener The event handler function.
     */
    public static removeListener(eventName: string, listener: (event: EventArgs) => void): void { // tslint:disable-line
        const listeners = EventEmitter.listeners(eventName);

        if (listeners) {
            const i = listeners.indexOf(listener);
            if (i >= 0) {
                listeners.splice(i, 1);
            }
        }
    }

    /**
     * Gets an array of listeners for a specific static event type.
     * @param {string} eventName eventName The type of the event.
     */
    public static listeners(eventName: string): ((event: EventArgs) => void)[] { // tslint:disable-line
        return (this.staticEventListeners[eventName] || []);
    }

    public static emit(eventName: string, eventArgs: EventArgs, ipc?: MessageBus) { // tslint:disable-line
        if (ipc && ipc.publish) {
            ipc.publish(EventEmitter.staticEventName, { eventName: eventName, eventArgs: eventArgs });
        } else {
            for (const listener of EventEmitter.listeners(eventName)) {
                listener(eventArgs);
            }
        }
    }
}
