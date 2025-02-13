import { createEmitter } from "../../utils/emitter.utils";
import { createListener } from "../../utils/listener.utils";
import { createSocket } from "../../utils/socket.utils";

describe("Socket [ Events ]", () => {
  const spy = jest.fn();
  let socket = createSocket();
  let emitter = createEmitter(socket);
  let listener = createListener(socket);

  beforeEach(() => {
    socket = createSocket();
    emitter = createEmitter(socket);
    listener = createListener(socket);
    jest.resetAllMocks();
  });

  it("should emit and receive error event", async () => {
    const value = { test: 1 };
    socket.events.onError(spy);
    socket.events.emitError(value);

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(value);
  });

  it("should emit and receive open event", async () => {
    socket.events.onOpen(spy);
    socket.events.emitOpen();

    expect(spy).toBeCalledTimes(1);
  });

  it("should emit and receive close event", async () => {
    socket.events.onClose(spy);
    socket.events.emitClose();

    expect(spy).toBeCalledTimes(1);
  });

  it("should emit and receive connecting event", async () => {
    socket.events.onConnecting(spy);
    socket.events.emitConnecting();

    expect(spy).toBeCalledTimes(1);
  });

  it("should emit and receive reconnecting event", async () => {
    const value = 1;
    socket.events.onReconnecting(spy);
    socket.events.emitReconnecting(value);

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(value);
  });

  it("should emit and receive reconnecting stop event", async () => {
    const value = 1;
    socket.events.onReconnectingStop(spy);
    socket.events.emitReconnectingStop(value);

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(value);
  });

  it("should emit and receive listener event", async () => {
    const value = 1;
    const event = {} as MessageEvent;
    socket.events.onListenerEvent(spy);
    socket.events.onListenerEventByName(listener, spy);
    socket.events.emitListenerEvent(listener.name, value, event);

    expect(spy).toBeCalledTimes(2);
    expect(spy).toBeCalledWith(value, event);
  });

  it("should emit and receive listener remove event", async () => {
    socket.events.onListenerRemove(spy);
    socket.events.onListenerRemoveByName(listener, spy);
    socket.events.emitListenerRemoveEvent(listener.name);

    expect(spy).toBeCalledTimes(2);
    expect(spy).toBeCalledWith(listener.name);
  });

  it("should emit and receive emitter event", async () => {
    socket.events.onEmitterEvent(spy);
    socket.events.onEmitterEventByName(emitter, spy);
    socket.events.emitEmitterEvent(emitter);

    expect(spy).toBeCalledTimes(2);
    expect(spy).toBeCalledWith(emitter);
  });
});
