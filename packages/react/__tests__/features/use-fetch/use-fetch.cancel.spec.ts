import { getErrorMessage } from "@hyper-fetch/core";
import { act, waitFor } from "@testing-library/react";

import { testErrorState } from "../../shared";
import { client, createRequest, renderUseFetch, waitForRender } from "../../utils";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";

describe("useFetch [ Cancel ]", () => {
  let request = createRequest({ cancelable: true });

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    jest.resetModules();
    request = createRequest({ cancelable: true });
    client.clear();
  });

  describe("given request is cancelable", () => {
    describe("when aborting request", () => {
      it("should allow to cancel the ongoing request", async () => {
        createRequestInterceptor(request, { delay: 40 });
        const response = renderUseFetch(request);

        await waitForRender();

        act(() => {
          response.result.current.abort();
        });

        await testErrorState(getErrorMessage("abort"), response);
      });

      it("should allow to cancel deduplicated request", async () => {
        createRequestInterceptor(request, { delay: 100 });
        const response = renderUseFetch(request);
        await waitForRender();
        const dedupeResponse = renderUseFetch(request);
        await waitForRender();

        await act(() => {
          dedupeResponse.result.current.abort();
        });

        await testErrorState(getErrorMessage("abort"), response);
        await testErrorState(getErrorMessage("abort"), dedupeResponse);
      });
      it("should cancel previous requests when dependencies change", async () => {
        const spy = jest.fn();

        createRequestInterceptor(request);
        const response = renderUseFetch(request, { dependencies: [{}] });
        await waitForRender();

        act(() => {
          const params = { page: 1 };
          response.result.current.onAbort(spy);
          response.rerender({ request: request.setQueryParams(params), dependencies: [params] });
        });
        await waitForRender();

        await waitFor(() => {
          expect(spy).toBeCalledTimes(1);
        });
      });
    });
    it("should clear request from dispatcher's queue on abort", async () => {
      // TODO
    });
  });
});
