import { FetchBuilderInstance } from "builder";
import { stringify } from "cache";
import { FetchProgressType } from "client";
import { ClientProgressEvent, FetchCommandInstance, FetchCommandDump } from "command";

export const fetchProgressUtils = ({ loaded, total }: ClientProgressEvent): number => {
  return Number(((total * 100) / loaded).toFixed(0));
};

export const fetchEtaUtils = (
  startDate: Date,
  { total, loaded }: ClientProgressEvent,
): { sizeLeft: number; timeLeft: number } => {
  const timeElapsed = +new Date() - +startDate;
  const uploadSpeed = loaded / timeElapsed;
  const sizeLeft = total - loaded;
  const timeLeft = sizeLeft / uploadSpeed;
  return { timeLeft, sizeLeft };
};

export const getProgressData = (requestStartTime: Date, progressEvent: ClientProgressEvent): FetchProgressType => {
  const { total, loaded } = progressEvent;
  if (!total || !loaded) {
    return {
      progress: 0,
      timeLeft: 0,
      sizeLeft: 0,
    };
  }

  const { timeLeft, sizeLeft } = fetchEtaUtils(requestStartTime, progressEvent);

  return {
    progress: fetchProgressUtils(progressEvent),
    timeLeft,
    sizeLeft,
  };
};

// Abort
export const addAbortController = (builder: FetchBuilderInstance, abortKey: string) => {
  const { abortControllers } = builder.commandManager;

  const existingController = abortControllers.get(abortKey);
  if (!existingController || existingController?.signal?.aborted) {
    abortControllers.set(abortKey, new AbortController());
  }
};

export const abortCommand = (command: FetchCommandInstance) => {
  const { abortControllers } = command.builder.commandManager;
  const controller = abortControllers.get(command.abortKey);

  if (controller) {
    controller.abort();
    command.builder.commandManager.events.emitAbort(command.abortKey, command);
  }
  addAbortController(command.builder, command.abortKey);
};

export const getAbortController = (command: FetchCommandInstance) => {
  const { abortControllers } = command.builder.commandManager;
  return abortControllers.get(command.abortKey);
};

// Keys
export const getAbortKey = (method: string, baseUrl: string, endpoint: string): string => {
  return `${method}_${baseUrl}${endpoint}`;
};

/**
 * Cache instance for individual command that collects individual requests responses from
 * the same endpoint (they may differ base on the custom key, endpoint params etc)
 * @param command
 * @returns
 */
export const getCommandKey = (
  command: FetchCommandInstance | FetchCommandDump<any>,
  customCacheKey?: string,
): string => {
  if (customCacheKey) return customCacheKey;

  /**
   * Below stringified values allow to match the response by method, endpoint and query params.
   * That's because we have shared endpoint, but data with queryParams '?user=1' will not match regular request without queries.
   * We want both results to be cached in separate places to not override each other.
   *
   * Values to be stringified:
   *
   * endpoint: string;
   * queryParams: string;
   * params: string;
   */

  const methodKey = stringify(command.method);
  const endpointKey = stringify(command.endpoint);
  const queryParamsKey = stringify(command.queryParams);

  return `${methodKey}_${endpointKey}_${queryParamsKey}`;
};
