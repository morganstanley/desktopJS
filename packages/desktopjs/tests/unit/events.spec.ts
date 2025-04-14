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

import { EventEmitter, EventArgs } from "../../src/events";

class TestEmitter extends EventEmitter {
}

describe("EventArgs", () => {
    it("ctor params set on properties", () => {
        const sender = {};
        const eventName = "TestEvent";
        const innerEvent = {};
        const args = new EventArgs(sender, eventName, innerEvent);
        expect(args.sender).toEqual(sender);
        expect(args.name).toEqual(eventName);
        expect(args.innerEvent).toEqual(innerEvent);
    });
});

describe("EventEmitter", () => {
    let emitter;

    beforeEach(() => {
        emitter = new TestEmitter();
    });

    it("addListener adds callback to listeners", () => {
        expect(emitter.listeners("TestEvent").length).toEqual(0);
        emitter.addListener("TestEvent", (event: EventArgs) => { });
        expect(emitter.listeners("TestEvent").length).toEqual(1);
    });

    it("removeListener removes callback to listeners", () => {
        expect(emitter.listeners("TestEvent").length).toEqual(0);
        const callback = (event: EventArgs) => { };
        emitter.addListener("TestEvent", callback);
        expect(emitter.listeners("TestEvent").length).toEqual(1);
        emitter.removeListener("TestEvent", callback);
        expect(emitter.listeners("TestEvent").length).toEqual(0);
    });

    it("emit invokes callbacks", (done) => {
        const args = new EventArgs(this, "TestEvent", {});
        const callback = (event: EventArgs) => {
            expect(event).toEqual(args);
            done();
        };
        emitter.addListener(args.name, callback);
        emitter.emit(args.name, args);
    });

    it("static emit invokes callbacks", (done) => {
        const args = new EventArgs(undefined, "TestEvent", {});
        const callback = (event: EventArgs) => {
            expect(event).toEqual(args);
            done();
        };
        EventEmitter.addListener(args.name, callback);
        EventEmitter.emit(args.name, args);
    });

    it("registerAndWrapListener", (done) => {
        const listener = (event: EventArgs) => { done(); };
        const wrappedCallback = emitter.registerAndWrapListener("TestEvent", listener);
        expect(wrappedCallback).not.toBeNull();
        emitter.addListener("TestEvent", wrappedCallback);
        emitter.emit("TestEvent", {});
    });

    it("unwrapAndUnRegisterListener returns mapped callback", () => {
        const listener = (event: EventArgs) => { };
        const wrappedCallback = emitter.registerAndWrapListener("TestEvent", listener);
        expect(emitter.unwrapAndUnRegisterListener(listener)).toEqual(wrappedCallback);
    });

    it ("postProcessArgs copies returnValue to innerEvent", () => {
        const innerEvent: any = {};
        const args = new EventArgs({}, "event", innerEvent);
        args.returnValue = "Foo";
        emitter.postProcessArgs(args)
        expect(innerEvent.returnValue).toEqual("Foo");
    }); 
});
