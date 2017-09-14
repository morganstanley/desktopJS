export class EventArgs {
    public readonly sender: any;

    public readonly innerEvent: any;

    public readonly name: string;

    constructor(sender: any, name: string, innerEvent: any) {
        this.sender = sender;
        this.name = name;
        this.innerEvent = innerEvent;
    }
}

export abstract class EventEmitter {
    private eventListeners: Map<string, ((event: EventArgs) => void)[]> = new Map();

    private wrappedListeners: Map<(event: EventArgs) => void, (event: EventArgs) => void> = new Map();

    /**
     * Registers an event listener on the specified event.
     * @param eventName {string} eventName The type of the event.
     * @param listener {(event: EventArgs) => void} The event handler function.
     */
    public addListener(eventName: string, listener: (event: EventArgs) => void): any {
        (this.eventListeners[eventName] = this.eventListeners[eventName] || []).push(listener);
        return this;
    }

    protected registerAndWrapListener(eventName: string, listener: (event: EventArgs) => void): (event: EventArgs) => void {
        const callback = (event) => {
            listener(new EventArgs(this, eventName, event));
        };

        this.wrappedListeners.set(listener, callback);
        return callback;
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
     * @param eventName {string} eventName The type of the event.
     * @param listener {(event: EventArgs) => void} The event handler function.
     */
    public removeListener(eventName: string, listener: (event: EventArgs) => void): any {
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
     * @param eventName {string} eventName The type of the event.
     */
    public listeners(eventName: string): ((event: EventArgs) => void)[] {
        return (this.eventListeners[eventName] || []);
    }

    /**
     * Invokes each listener registered for the specified event type.
     * @param eventName {string} eventName The type of the event.
     */
    public emit(eventName: string, eventArgs: EventArgs) {
        for (const listener of this.listeners(eventName)) {
            listener(eventArgs);
        }
    }
}