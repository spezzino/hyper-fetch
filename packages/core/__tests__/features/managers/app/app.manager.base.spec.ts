import { waitFor } from "@testing-library/dom";

import { AppManager, hasDocument, hasWindow } from "managers";
import { createClient } from "../../../utils";
import { resetInterceptors, startServer, stopServer } from "../../../server";

describe("AppManager [ Base ]", () => {
  let client = createClient();

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetInterceptors();
    jest.resetAllMocks();
    client = createClient();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When app manager is initialized", () => {
    it("should initialize with isFocused set to true", async () => {
      expect(client.appManager.isFocused).toBeTrue();
    });
    it("should initialize with isOnline set to true", async () => {
      expect(client.appManager.isOnline).toBeTrue();
    });
    it("should initialize with custom isFocused", async () => {
      const firstManager = new AppManager({ initiallyFocused: false });
      const secondManager = new AppManager({ initiallyFocused: async () => false });
      const thirdManager = new AppManager({ initiallyFocused: undefined });

      await waitFor(() => {
        expect(firstManager.isFocused).toBeFalse();
        expect(secondManager.isFocused).toBeFalse();
        expect(thirdManager.isFocused).toBeTrue();
      });
    });
    it("should initialize with custom isOnline", async () => {
      const firstManager = new AppManager({ initiallyOnline: false });
      const secondManager = new AppManager({ initiallyOnline: async () => false });
      const thirdManager = new AppManager({ initiallyOnline: undefined });

      await waitFor(() => {
        expect(firstManager.isOnline).toBeFalse();
        expect(secondManager.isOnline).toBeFalse();
        expect(thirdManager.isOnline).toBeTrue();
      });
    });
  });
  describe("When using app manager methods", () => {
    it("should allow to change app focus state", async () => {
      const focusSpy = jest.fn();
      const blurSpy = jest.fn();
      client.appManager.events.onFocus(focusSpy);
      client.appManager.events.onBlur(blurSpy);
      client.appManager.setFocused(false);
      expect(client.appManager.isFocused).toBeFalse();
      client.appManager.setFocused(true);
      expect(client.appManager.isFocused).toBeTrue();

      expect(focusSpy).toBeCalledTimes(1);
      expect(blurSpy).toBeCalledTimes(1);
    });
    it("should allow to change app online state", async () => {
      const onlineSpy = jest.fn();
      const offlineSpy = jest.fn();
      client.appManager.events.onOnline(onlineSpy);
      client.appManager.events.onOffline(offlineSpy);
      client.appManager.setOnline(false);
      expect(client.appManager.isOnline).toBeFalse();
      client.appManager.setOnline(true);
      expect(client.appManager.isOnline).toBeTrue();

      expect(onlineSpy).toBeCalledTimes(1);
      expect(offlineSpy).toBeCalledTimes(1);
    });
  });
  describe("When using app manager utils", () => {
    it("should allow to detect window", async () => {
      expect(hasWindow()).toBeTrue();
    });
    it("should allow to detect document", async () => {
      expect(hasDocument()).toBeTrue();
    });
  });
});
