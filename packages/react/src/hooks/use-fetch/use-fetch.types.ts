import { RequestInstance, ExtractResponseType, ExtractErrorType, CacheValueType } from "@hyper-fetch/core";

import { UseRequestEventsActionsType, UseTrackedStateActions, UseTrackedStateType } from "helpers";
import { InvalidationKeyType } from "types";
import { isEqual } from "utils";

export type UseFetchOptionsType<T extends RequestInstance> = {
  /**
   * Refetch dependencies
   */
  dependencies?: any[];
  /**
   * Disable fetching
   */
  disabled?: boolean;
  /**
   * If `true` it will rerender only when values used by our component gets changed. Otherwise it will rerender on any change.
   */
  dependencyTracking?: boolean;
  /**
   * If `true` it will refetch data in background no matter if we have it from cache.
   */
  revalidateOnMount?: boolean;
  /**
   * If cache is empty we can use placeholder data.
   */
  initialData?: CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>>["data"] | null;
  /**
   * Enable/disable refresh data
   */
  refresh?: boolean;
  /**
   * Refresh data interval time
   */
  refreshTime?: number;
  /**
   * Enable/disable data refresh if our tab is not focused(used by user at given time).
   */
  refreshBlurred?: boolean;
  /**
   * Enable/disable data refresh if user leaves current tab.
   */
  refreshOnBlur?: boolean;
  /**
   * Enable/disable data refresh if user enters current tab.
   */
  refreshOnFocus?: boolean;
  /**
   * Enable/disable data refresh if network is restored.
   */
  refreshOnReconnect?: boolean;
  /**
   * Enable/disable debouncing for often changing keys or refreshing, to limit requests to server.
   */
  bounce?: boolean;
  /**
   * Possibility to choose between debounce and throttle approaches
   */
  bounceType?: "debounce" | "throttle";
  /**
   * How long it should bounce requests.
   */
  bounceTime?: number;
  /**
   * ONLY in throttle mode - options for handling last bounce event
   */
  bounceTimeout?: number;
  /**
   * Deep comparison function for hook to check for equality in incoming data, to limit rerenders.
   */
  deepCompare?: boolean | typeof isEqual;
};

export type UseFetchReturnType<T extends RequestInstance> = UseTrackedStateType<T> &
  UseTrackedStateActions<T> &
  UseRequestEventsActionsType<T> & {
    /**
     * Data related to current state of the bounce usage
     */
    bounce: {
      /**
       * Active state of the bounce method
       */
      active: boolean;
      /**
       * Method to stop the active bounce method execution
       */
      reset: () => void;
    };
    /**
     * Revalidate current request resource or pass custom key to trigger it by invalidationKey(Regex / cacheKey).
     */
    revalidate: (invalidateKey?: InvalidationKeyType | InvalidationKeyType[]) => void;
  };
