/*
 * Morgan Stanley makes this available to you under the Apache License,
 * Version 2.0 (the "License"). You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0.
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Unless required by applicable law or agreed
 * to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

/**
 * @module @morgan-stanley/desktopjs
 */

/**
 * A messaging bus for sending and receiving messages
 */
export interface MessageBus {
    /**
     * Subscribe to messages sent to a specific topic.
     * @param {string} topic - The topic on which the messages will be received.
     * @param {Function} listener - Callback function for each message that is received.
     * @param {*} [options] - Custom options for subscription.
     * @returns {Promise<MessageBusSubscription>}
     */
    subscribe<T>(topic: string, listener: (event: any, message: T) => void, options?: MessageBusOptions): Promise<MessageBusSubscription>;

    /**
     * Unsusbcribe to messages from a specified subscription.
     * @param {MessageBusSubscription} subscription - The subscription in which to unsubscribe.
     */
    unsubscribe(subscription: MessageBusSubscription): Promise<void>;

    /**
     * Publishes a message on a specified topic.
     * @param {string} topic - The topic on which the message will be sent.
     * @param {T} message - The message to be sent.
     * @param {*} [options] - Custom options for the message publish.
     */
    publish<T>(topic: string, message: T, options?: MessageBusOptions): Promise<void>;
}

/**
 * Represents a subscription on the {MessageBus} MessageBus.
 */
export class MessageBusSubscription {
    public readonly topic: string;
    public readonly listener: any;
    public readonly options?: MessageBusOptions;

    public constructor(topic: string, listener: any, options?: MessageBusOptions) {
        this.topic = topic;
        this.listener = listener;
        this.options = options;
    }
}

export class MessageBusOptions {
    public uuid?: string;
    public name?: string;
    public targetOrigin?: string;
}
