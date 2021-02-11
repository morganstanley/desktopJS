import {} from "jasmine";
import { EventEmitter, EventArgs } from "../../src/events";

class TestEmitter extends EventEmitter {}

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
    emitter.addListener("TestEvent", (event: EventArgs) => {});
    expect(emitter.listeners("TestEvent").length).toEqual(1);
  });

  it("removeListener removes callback to listeners", () => {
    expect(emitter.listeners("TestEvent").length).toEqual(0);
    const callback = (event: EventArgs) => {};
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
    const listener = (event: EventArgs) => {
      done();
    };
    const wrappedCallback = emitter.registerAndWrapListener(
      "TestEvent",
      listener
    );
    expect(wrappedCallback).not.toBeNull();
    emitter.addListener("TestEvent", wrappedCallback);
    emitter.emit("TestEvent", {});
  });

  it("unwrapAndUnRegisterListener returns mapped callback", () => {
    const listener = (event: EventArgs) => {};
    const wrappedCallback = emitter.registerAndWrapListener(
      "TestEvent",
      listener
    );
    expect(emitter.unwrapAndUnRegisterListener(listener)).toEqual(
      wrappedCallback
    );
  });

  it("postProcessArgs copies returnValue to innerEvent", () => {
    const innerEvent = {};
    const args = new EventArgs({}, "event", innerEvent);
    args.returnValue = "Foo";
    emitter.postProcessArgs(args);
    expect((<any>innerEvent).returnValue).toEqual("Foo");
  });
});
