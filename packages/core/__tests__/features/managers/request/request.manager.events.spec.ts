import { waitFor } from "@testing-library/dom";

import { createClient, createRequest, sleep } from "../../../utils";
import { resetInterceptors, startServer, stopServer, createRequestInterceptor } from "../../../server";

describe("RequestManager [ Events ]", () => {
  let client = createClient();
  let request = createRequest(client);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetInterceptors();
    jest.resetAllMocks();
    client = createClient();
    request = createRequest(client);
  });

  afterAll(() => {
    stopServer();
  });

  describe("When request manager events get triggered", () => {
    it("should trigger request lifecycle events", async () => {
      createRequestInterceptor(request);

      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const spy3 = jest.fn();
      const spy4 = jest.fn();
      const spy5 = jest.fn();
      const spy6 = jest.fn();

      client.requestManager.events.onRequestStart(request.queueKey, spy1);
      client.requestManager.events.onResponseStart(request.queueKey, spy2);
      client.requestManager.events.onUploadProgress(request.queueKey, spy3);
      client.requestManager.events.onDownloadProgress(request.queueKey, spy4);
      client.requestManager.events.onResponse(request.cacheKey, spy5);

      const requestId = client.fetchDispatcher.add(request);

      client.requestManager.events.onResponseById(requestId, spy6);

      await waitFor(() => {
        expect(spy1).toBeCalledTimes(1);
        expect(spy2).toBeCalledTimes(1);
        expect(spy3).toBeCalledTimes(2);
        expect(spy4).toBeCalledTimes(3);
        expect(spy5).toBeCalledTimes(1);
        expect(spy6).toBeCalledTimes(1);
      });
    });
  });
  describe("When request manager aborts the request", () => {
    it("should allow to abort request by id", async () => {
      createRequestInterceptor(request);
      const spy1 = jest.fn();
      const spy2 = jest.fn();

      const requestId = client.fetchDispatcher.add(request);
      client.requestManager.events.onAbort(request.abortKey, spy1);
      client.requestManager.events.onAbortById(requestId, spy2);

      await sleep(5);

      client.requestManager.abortByKey(request.abortKey);
      await waitFor(() => {
        expect(spy1).toBeCalledTimes(1);
        expect(spy2).toBeCalledTimes(1);
      });

      expect(client.appManager.isFocused).toBeTrue();
    });
    it("should allow to abort all requests", async () => {
      createRequestInterceptor(request);
      const spy1 = jest.fn();
      const spy2 = jest.fn();

      const requestId = client.fetchDispatcher.add(request);
      client.requestManager.events.onAbort(request.abortKey, spy1);
      client.requestManager.events.onAbortById(requestId, spy2);

      await sleep(5);

      client.requestManager.abortAll();
      await waitFor(() => {
        expect(spy1).toBeCalledTimes(1);
        expect(spy2).toBeCalledTimes(1);
      });

      expect(client.appManager.isFocused).toBeTrue();
    });
    it("should not throw when removing non-existing controller key", async () => {
      expect(() => client.requestManager.abortByKey("fake-key")).not.toThrow();
    });

    it("should emit abort event once", async () => {
      createRequestInterceptor(request);
      const spy1 = jest.fn();

      client.fetchDispatcher.add(request);
      client.requestManager.events.onAbort(request.abortKey, spy1);

      await sleep(5);
      client.requestManager.abortAll();

      await sleep(50);
      expect(spy1).toBeCalledTimes(1);

      expect(client.appManager.isFocused).toBeTrue();
    });
  });
});
