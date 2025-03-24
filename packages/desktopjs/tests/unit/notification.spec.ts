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

import { describe, it, expect, vi } from 'vitest';
import { ContainerNotification } from "../../src/notification";

class TestNotification extends ContainerNotification {
}

describe('notification', () => {
    it("ctor", () => {
        const options = {};
        const notification = new TestNotification("title", options);
        expect(notification).toBeDefined();
    });

    it("permission defaulted to granted", () => {
        expect(ContainerNotification.permission).toBe("granted");
    });

    it("requestPermission invokes callback", async () => {
        const callback = vi.fn();
        await ContainerNotification.requestPermission(callback);
        expect(callback).toHaveBeenCalled();
    });

    it("requestPermission resolves the returned Promise", async () => {
        const result = await ContainerNotification.requestPermission();
        expect(result).toBe("granted");
    });
});