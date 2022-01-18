import { ClientResponseSuccessType } from "client";
import { Cache } from "cache";
import { getCommandKey } from "command";

import { getManyRequest, getManyMock, GetManyResponseType } from "../../utils/mocks/get-many.mock";
import { testBuilder } from "../../utils/server/server.constants";

const cacheKey = getCommandKey(getManyRequest);
const response = {
  cache: true,
  cacheKey,
  response: [getManyMock().fixture, null, 0] as ClientResponseSuccessType<GetManyResponseType>,
  retries: 0,
  isRefreshed: false,
  timestamp: +new Date(),
};

let cacheInstance = new Cache(testBuilder);

describe("Cache", () => {
  beforeEach(async () => {
    testBuilder.clear();
    cacheInstance = new Cache(testBuilder);
  });

  describe("When lifecycle events get triggered", () => {
    it("should initialize cache", async () => {
      expect(cacheInstance.get(cacheKey)).not.toBeDefined();

      cacheInstance.set(response);

      expect(cacheInstance.get(cacheKey)).toBeDefined();
    });

    it("should delete cache and send signal", async () => {
      const trigger = jest.fn();

      cacheInstance.events.onRevalidate(cacheKey, () => {
        trigger();
      });

      cacheInstance.set(response);
      expect(cacheInstance.get(cacheKey)).toBeDefined();

      cacheInstance.delete(cacheKey);

      expect(trigger).toBeCalled();
      expect(cacheInstance.get(cacheKey)).not.toBeDefined();
    });
  });

  describe("When using deep compare", () => {
    it("should not overwrite the same data", async () => {
      const trigger = jest.fn();

      cacheInstance.events.get(cacheKey, () => {
        trigger();
      });

      cacheInstance.set(response);
      cacheInstance.set(response);
      cacheInstance.set(response);

      expect(trigger).toBeCalledTimes(1);
      expect(cacheInstance.get(cacheKey)).toBeDefined();
    });

    it("should write data when cache is empty or gets deleted", async () => {
      const trigger = jest.fn();

      cacheInstance.events.get(cacheKey, () => {
        trigger();
      });

      cacheInstance.set(response);
      cacheInstance.delete(cacheKey);
      expect(cacheInstance.get(cacheKey)).not.toBeDefined();
      cacheInstance.set(response);
      cacheInstance.delete(cacheKey);
      expect(cacheInstance.get(cacheKey)).not.toBeDefined();
      cacheInstance.set(response);

      expect(trigger).toBeCalledTimes(3);
      expect(cacheInstance.get(cacheKey)).toBeDefined();
    });

    it("should allow to disable deep comparison when saving data", async () => {
      cacheInstance.set({ ...response });

      expect(cacheInstance.get(cacheKey)).toBeDefined();
    });
  });

  describe("When CacheStore gets cleared before triggering cache actions", () => {
    it("should return undefined when removed cache entity", async () => {
      const trigger = jest.fn();

      cacheInstance.events.onRevalidate(cacheKey, () => {
        trigger();
      });

      cacheInstance.clear();

      expect(trigger).toBeCalledTimes(0);
      expect(cacheInstance.get(cacheKey)).not.toBeDefined();
    });
  });
});
