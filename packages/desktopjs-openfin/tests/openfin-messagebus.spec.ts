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

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageBusSubscription, MessageBusOptions } from '@morgan-stanley/desktopjs';
import { OpenFinMessageBus } from '../src/openfin';

class MockInterApplicationBus {
    private subscriptions: Map<string, any[]> = new Map();

    public subscribe(senderUuid: string, name: string, topic: string, listener: Function, callback: Function, errorCallback: Function): void {
        const key = this.getSubscriptionKey(senderUuid, name, topic);
        if (!this.subscriptions.has(key)) {
            this.subscriptions.set(key, []);
        }
        this.subscriptions.get(key).push({ listener, senderUuid, name, topic });
        callback();
    }

    public unsubscribe(senderUuid: string, name: string, topic: string, listener: Function, callback: Function, errorCallback: Function): void {
        const key = this.getSubscriptionKey(senderUuid, name, topic);
        if (this.subscriptions.has(key)) {
            const subs = this.subscriptions.get(key);
            const index = subs.findIndex(sub => sub.listener === listener);
            if (index !== -1) {
                subs.splice(index, 1);
            }
        }
        callback();
    }

    public publish(topic: string, message: any, callback: Function, errorCallback: Function): void {
        // Simulate publishing to all subscribers of this topic
        for (const [key, subs] of this.subscriptions.entries()) {
            if (key.endsWith(`:${topic}`)) {
                subs.forEach(sub => {
                    sub.listener(message, sub.senderUuid, sub.name);
                });
            }
        }
        callback();
    }

    public send(destinationUuid: string, name: string, topic: string, message: any, callback: Function, errorCallback: Function): void {
        // Simulate sending to specific destination
        const key = this.getSubscriptionKey(destinationUuid, name, topic);
        if (this.subscriptions.has(key)) {
            this.subscriptions.get(key).forEach(sub => {
                sub.listener(message, destinationUuid, name);
            });
        }
        callback();
    }

    // Helper method to get a unique key for subscriptions
    private getSubscriptionKey(uuid: string, name: string, topic: string): string {
        return `${uuid}:${name || ''}:${topic}`;
    }

    // Helper method to trigger messages for testing
    public triggerMessage(senderUuid: string, name: string, topic: string, message: any): void {
        const key = this.getSubscriptionKey(senderUuid, name, topic);
        if (this.subscriptions.has(key)) {
            this.subscriptions.get(key).forEach(sub => {
                sub.listener(message, senderUuid, name);
            });
        }
    }
}

describe('OpenFinMessageBus', () => {
    let mockBus: MockInterApplicationBus;
    let messageBus: OpenFinMessageBus;
    const testUuid = 'test-uuid';

    beforeEach(() => {
        mockBus = new MockInterApplicationBus();
        messageBus = new OpenFinMessageBus(mockBus, testUuid);
    });

    describe('subscribe', () => {
        it('should subscribe to a topic with default options', async () => {
            const subscribeSpy = vi.spyOn(mockBus, 'subscribe');
            const listener = vi.fn();
            const topic = 'test-topic';

            const subscription = await messageBus.subscribe(topic, listener);

            expect(subscribeSpy).toHaveBeenCalledWith(
                '*', // default senderUuid
                undefined, // default name
                topic,
                expect.any(Function),
                expect.any(Function),
                expect.any(Function)
            );
            expect(subscription).toBeInstanceOf(MessageBusSubscription);
            expect(subscription.topic).toBe(topic);
        });

        it('should subscribe to a topic with specific options', async () => {
            const subscribeSpy = vi.spyOn(mockBus, 'subscribe');
            const listener = vi.fn();
            const topic = 'test-topic';
            const options: MessageBusOptions = {
                uuid: 'specific-uuid',
                name: 'specific-name'
            };

            const subscription = await messageBus.subscribe(topic, listener, options);

            expect(subscribeSpy).toHaveBeenCalledWith(
                options.uuid,
                options.name,
                topic,
                expect.any(Function),
                expect.any(Function),
                expect.any(Function)
            );
            expect(subscription).toBeInstanceOf(MessageBusSubscription);
            expect(subscription.topic).toBe(topic);
        });

        it('should call the listener when a message is received', async () => {
            const listener = vi.fn();
            const topic = 'test-topic';
            const message = { data: 'test-data' };

            const subscription = await messageBus.subscribe(topic, listener);
            
            // Simulate receiving a message
            mockBus.triggerMessage('*', undefined, topic, message);
            
            expect(listener).toHaveBeenCalledWith(
                { topic }, // Event object
                message    // Message data
            );
        });
    });

    describe('unsubscribe', () => {
        it('should unsubscribe from a topic with default options', async () => {
            const unsubscribeSpy = vi.spyOn(mockBus, 'unsubscribe');
            const listener = vi.fn();
            const topic = 'test-topic';

            const subscription = await messageBus.subscribe(topic, listener);
            await messageBus.unsubscribe(subscription);

            expect(unsubscribeSpy).toHaveBeenCalledWith(
                '*', // default senderUuid
                undefined, // default name
                topic,
                expect.any(Function),
                expect.any(Function),
                expect.any(Function)
            );
        });

        it('should unsubscribe from a topic with specific options', async () => {
            const unsubscribeSpy = vi.spyOn(mockBus, 'unsubscribe');
            const listener = vi.fn();
            const topic = 'test-topic';
            const options: MessageBusOptions = {
                uuid: 'specific-uuid',
                name: 'specific-name'
            };

            const subscription = await messageBus.subscribe(topic, listener, options);
            await messageBus.unsubscribe(subscription);

            expect(unsubscribeSpy).toHaveBeenCalledWith(
                options.uuid,
                options.name,
                topic,
                expect.any(Function),
                expect.any(Function),
                expect.any(Function)
            );
        });
    });

    describe('publish', () => {
        it('should publish a message to a topic with default options', async () => {
            const publishSpy = vi.spyOn(mockBus, 'publish');
            const topic = 'test-topic';
            const message = { data: 'test-data' };

            await messageBus.publish(topic, message);

            expect(publishSpy).toHaveBeenCalledWith(
                topic,
                message,
                expect.any(Function),
                expect.any(Function)
            );
        });

        it('should send a targeted message when options specify a destination', async () => {
            const sendSpy = vi.spyOn(mockBus, 'send');
            const topic = 'test-topic';
            const message = { data: 'test-data' };
            const options: MessageBusOptions = {
                uuid: 'target-uuid',
                name: 'target-name'
            };

            await messageBus.publish(topic, message, options);

            expect(sendSpy).toHaveBeenCalledWith(
                options.uuid,
                options.name,
                topic,
                message,
                expect.any(Function),
                expect.any(Function)
            );
        });

        it('should use current app uuid when only name is specified', async () => {
            const sendSpy = vi.spyOn(mockBus, 'send');
            const topic = 'test-topic';
            const message = { data: 'test-data' };
            const options: MessageBusOptions = {
                name: 'target-name'
            };

            await messageBus.publish(topic, message, options);

            expect(sendSpy).toHaveBeenCalledWith(
                testUuid, // Should use the current app uuid
                options.name,
                topic,
                message,
                expect.any(Function),
                expect.any(Function)
            );
        });
    });
});
