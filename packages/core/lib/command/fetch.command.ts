import {
  FetchCommandDump,
  getAbortKey,
  FetchCommandCurrentType,
  ExtractRouteParams,
  FetchMethodType,
  FetchCommandConfig,
  FetchType,
  ParamsType,
  getCommandKey,
  FetchCommandQueueOptions,
  FetchCommandData,
  commandSendRequest,
} from "command";
import { FetchBuilder } from "builder";
import { getUniqueRequestId } from "utils";
import { LoggerMethodsType } from "managers";
import { ClientQueryParamsType } from "client";
import { HttpMethodsType, NegativeTypes } from "types";
import { HttpMethodsEnum } from "constants/http.constants";
import { DateInterval } from "constants/time.constants";

/**
 * Fetch command it is designed to prepare the necessary setup to execute the request to the server.
 * We can setup basic options for example endpoint, method, headers and advanced settings like cache, invalidation patterns, concurrency, retries and much, much more.
 * :::info Usage
 * We should not use this class directly in the standard development flow. We can initialize it using the `createCommand` method on the **FetchBuilder** class.
 * :::
 *
 * @attention
 * The most important thing about the command is that it keeps data in the format that can be dumped. This is necessary for the persistance and different dispatcher storage types.
 * This class doesn't have any callback methods by design and communicate with dispatcher and cache by events.
 */
export class FetchCommand<
  ResponseType,
  PayloadType,
  QueryParamsType extends ClientQueryParamsType | string,
  GlobalErrorType, // Global Error Type
  LocalErrorType, // Additional Error for specific endpoint
  EndpointType extends string,
  ClientOptions,
  HasData extends true | false = false,
  HasParams extends true | false = false,
  HasQuery extends true | false = false,
  MappedData = undefined,
> {
  endpoint: EndpointType;
  headers?: HeadersInit;
  auth: boolean;
  method: HttpMethodsType;
  params: ExtractRouteParams<EndpointType> | NegativeTypes;
  data: FetchCommandData<PayloadType, MappedData>;
  queryParams: QueryParamsType | NegativeTypes;
  options?: ClientOptions | undefined;
  cancelable: boolean;
  retry: number;
  retryTime: number;
  cache: boolean;
  cacheTime: number;
  queued: boolean;
  offline: boolean;
  abortKey: string;
  cacheKey: string;
  queueKey: string;
  effectKey: string;
  used: boolean;
  deduplicate: boolean;

  private logger: LoggerMethodsType;

  private updatedAbortKey: boolean;
  private updatedCacheKey: boolean;
  private updatedQueueKey: boolean;
  private updatedEffectKey: boolean;

  constructor(
    readonly builder: FetchBuilder<GlobalErrorType, ClientOptions>,
    readonly commandOptions: FetchCommandConfig<EndpointType, ClientOptions>,
    readonly commandDump?:
      | FetchCommandCurrentType<
          ResponseType,
          PayloadType,
          QueryParamsType,
          GlobalErrorType | LocalErrorType,
          EndpointType,
          ClientOptions,
          MappedData
        >
      | undefined,
    readonly dataMapper?: (data: PayloadType) => MappedData,
  ) {
    this.logger = this.builder.loggerManager.init("Command");

    const { baseUrl } = builder;
    const {
      endpoint,
      headers,
      auth = true,
      method = HttpMethodsEnum.get,
      options,
      cancelable = false,
      retry = 0,
      retryTime = 500,
      cache = true,
      cacheTime = DateInterval.minute * 5,
      queued = false,
      offline = true,
      abortKey,
      cacheKey,
      queueKey,
      effectKey,
      deduplicate = false,
    } = { ...this.builder.commandConfig, ...commandOptions };

    this.endpoint = commandDump?.endpoint ?? endpoint;
    this.headers = commandDump?.headers ?? headers;
    this.auth = commandDump?.auth ?? auth;
    this.method = method;
    this.params = commandDump?.params;
    this.data = commandDump?.data;
    this.queryParams = commandDump?.queryParams;
    this.options = commandDump?.options ?? options;
    this.cancelable = commandDump?.cancelable ?? cancelable;
    this.retry = commandDump?.retry ?? retry;
    this.retryTime = commandDump?.retryTime ?? retryTime;
    this.cache = commandDump?.cache ?? cache;
    this.cacheTime = commandDump?.cacheTime ?? cacheTime;
    this.queued = commandDump?.queued ?? queued;
    this.offline = commandDump?.offline ?? offline;
    this.abortKey =
      commandDump?.abortKey ?? abortKey ?? getAbortKey(this.method, baseUrl, this.endpoint, this.cancelable);
    this.cacheKey = commandDump?.cacheKey ?? cacheKey ?? getCommandKey(this);
    this.queueKey = commandDump?.queueKey ?? queueKey ?? getCommandKey(this);
    this.effectKey = commandDump?.effectKey ?? effectKey ?? getCommandKey(this);
    this.used = commandDump?.used ?? false;
    this.deduplicate = commandDump?.deduplicate ?? deduplicate;

    this.updatedAbortKey = commandDump?.updatedAbortKey ?? false;
    this.updatedCacheKey = commandDump?.updatedCacheKey ?? false;
    this.updatedQueueKey = commandDump?.updatedQueueKey ?? false;
    this.updatedEffectKey = commandDump?.updatedEffectKey ?? false;
  }

  public setHeaders = (headers: HeadersInit) => {
    return this.clone({ headers });
  };

  public setAuth = (auth: boolean) => {
    return this.clone({ auth });
  };

  public setParams = (params: ExtractRouteParams<EndpointType>) => {
    return this.clone<HasData, true, HasQuery>({ params });
  };

  public setData = (data: PayloadType) => {
    const modifiedData = this.dataMapper?.(data) || data;
    return this.clone<true, HasParams, HasQuery, MappedData>({
      data: modifiedData as FetchCommandData<PayloadType, MappedData>,
    });
  };

  public setQueryParams = (queryParams: QueryParamsType) => {
    return this.clone<HasData, HasParams, true>({ queryParams });
  };

  public setOptions = (options: ClientOptions) => {
    return this.clone<HasData, HasParams, true>({ options });
  };

  public setCancelable = (cancelable: boolean) => {
    return this.clone({ cancelable });
  };

  public setRetry = (retry: FetchCommandConfig<EndpointType, ClientOptions>["retry"]) => {
    return this.clone({ retry });
  };

  public setRetryTime = (retryTime: FetchCommandConfig<EndpointType, ClientOptions>["retryTime"]) => {
    return this.clone({ retryTime });
  };

  public setCache = (cache: FetchCommandConfig<EndpointType, ClientOptions>["cache"]) => {
    return this.clone({ cache });
  };

  public setCacheTime = (cacheTime: FetchCommandConfig<EndpointType, ClientOptions>["cacheTime"]) => {
    return this.clone({ cacheTime });
  };

  public setQueued = (queued: boolean) => {
    return this.clone({ queued });
  };

  public setAbortKey = (abortKey: string) => {
    this.updatedAbortKey = true;
    return this.clone({ abortKey });
  };

  public setCacheKey = (cacheKey: string) => {
    this.updatedCacheKey = true;
    return this.clone({ cacheKey });
  };

  public setQueueKey = (queueKey: string) => {
    this.updatedQueueKey = true;
    return this.clone({ queueKey });
  };

  public setEffectKey = (effectKey: string) => {
    this.updatedEffectKey = true;
    return this.clone({ effectKey });
  };

  public setDeduplicate = (deduplicate: boolean) => {
    return this.clone({ deduplicate });
  };

  public setUsed = (used: boolean) => {
    return this.clone({ used });
  };

  public setDataMapper = <DataMapper>(mapper: (data: PayloadType) => DataMapper) => {
    if (this.dataMapper) {
      console.warn("Mapper is already setup on the command.");
      return this.clone<HasData, HasParams, HasQuery, DataMapper>();
    }
    return this.clone<HasData, HasParams, HasQuery, DataMapper>(undefined, mapper);
  };

  public abort = () => {
    this.builder.commandManager.abortByKey(this.abortKey);

    return this.clone();
  };

  private paramsMapper = (params: ParamsType | null | undefined): string => {
    let endpoint = this.commandOptions.endpoint as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }
    return endpoint;
  };

  public dump(): FetchCommandDump<
    ClientOptions,
    FetchCommand<
      ResponseType,
      PayloadType,
      QueryParamsType,
      GlobalErrorType,
      LocalErrorType,
      EndpointType,
      ClientOptions,
      HasData,
      HasParams,
      HasQuery,
      MappedData
    >,
    QueryParamsType
  > {
    return {
      commandOptions: this.commandOptions,
      endpoint: this.endpoint,
      headers: this.headers,
      auth: this.auth,
      method: this.method,
      params: this.params,
      data: this.data,
      queryParams: this.queryParams,
      options: this.options,
      cancelable: this.cancelable,
      retry: this.retry,
      retryTime: this.retryTime,
      cache: this.cache,
      cacheTime: this.cacheTime,
      queued: this.queued,
      offline: this.offline,
      abortKey: this.abortKey,
      cacheKey: this.cacheKey,
      queueKey: this.queueKey,
      effectKey: this.effectKey,
      used: this.used,
      disableResponseInterceptors: this.commandOptions.disableResponseInterceptors,
      disableRequestInterceptors: this.commandOptions.disableRequestInterceptors,
      updatedAbortKey: this.updatedAbortKey,
      updatedCacheKey: this.updatedCacheKey,
      updatedQueueKey: this.updatedQueueKey,
      updatedEffectKey: this.updatedEffectKey,
      deduplicate: this.deduplicate,
    };
  }

  public clone<
    D extends true | false = HasData,
    P extends true | false = HasParams,
    Q extends true | false = HasQuery,
    MapperData = MappedData,
  >(
    options?: FetchCommandCurrentType<
      ResponseType,
      PayloadType,
      QueryParamsType,
      GlobalErrorType | LocalErrorType,
      EndpointType,
      ClientOptions,
      MapperData
    >,
    mapper?: (data: PayloadType) => MapperData,
  ): FetchCommand<
    ResponseType,
    PayloadType,
    QueryParamsType,
    GlobalErrorType,
    LocalErrorType,
    EndpointType,
    ClientOptions,
    D,
    P,
    Q,
    MapperData
  > {
    const dump = this.dump();
    const commandDump: FetchCommandCurrentType<
      ResponseType,
      PayloadType,
      QueryParamsType,
      GlobalErrorType | LocalErrorType,
      EndpointType,
      ClientOptions,
      MapperData
    > = {
      ...dump,
      ...options,
      abortKey: this.updatedAbortKey ? options?.abortKey || this.abortKey : undefined,
      cacheKey: this.updatedCacheKey ? options?.cacheKey || this.cacheKey : undefined,
      queueKey: this.updatedQueueKey ? options?.queueKey || this.queueKey : undefined,
      endpoint: this.paramsMapper(options?.params || this.params) as EndpointType,
      queryParams: options?.queryParams || this.queryParams,
      // Typescript circular types issue - we have to leave any here
      data: (options?.data || this.data) as any,
    };

    const cloned = new FetchCommand<
      ResponseType,
      PayloadType,
      QueryParamsType,
      GlobalErrorType,
      LocalErrorType,
      EndpointType,
      ClientOptions,
      D,
      P,
      Q,
      MapperData
    >(this.builder, this.commandOptions, commandDump, mapper);

    return cloned;
  }

  /**
   * Method to use the command WITHOUT adding it to cache and queues. This mean it will make straight requests without side effects like events.
   * @param options
   * @returns
   */
  public exec: FetchMethodType<
    ResponseType,
    PayloadType,
    QueryParamsType,
    GlobalErrorType | LocalErrorType,
    EndpointType,
    HasData,
    HasParams,
    HasQuery
  > = async (options?: FetchType<PayloadType, QueryParamsType, EndpointType, HasData, HasParams, HasQuery>) => {
    const { client } = this.builder;
    const command = this.clone(
      options as FetchCommandCurrentType<
        ResponseType,
        PayloadType,
        QueryParamsType,
        GlobalErrorType | LocalErrorType,
        EndpointType,
        ClientOptions,
        MappedData
      >,
    );

    const requestId = getUniqueRequestId(this.queueKey);

    return client(command, requestId);
  };

  /**
   * Method used to perform requests with usage of cache and queues
   * @param options
   */
  public send: FetchMethodType<
    ResponseType,
    PayloadType,
    QueryParamsType,
    GlobalErrorType | LocalErrorType,
    EndpointType,
    HasData,
    HasParams,
    HasQuery,
    FetchCommandQueueOptions
  > = async (
    options?: FetchType<
      PayloadType,
      QueryParamsType,
      EndpointType,
      HasData,
      HasParams,
      HasQuery,
      FetchCommandQueueOptions
    >,
    requestCallback?: (
      requestId: string,
      command: FetchCommand<
        ResponseType,
        PayloadType,
        QueryParamsType,
        GlobalErrorType,
        LocalErrorType,
        EndpointType,
        ClientOptions,
        HasData,
        HasParams,
        HasQuery,
        MappedData
      >,
    ) => void,
  ) => {
    const command = this.clone(
      options as FetchCommandCurrentType<
        ResponseType,
        PayloadType,
        QueryParamsType,
        GlobalErrorType | LocalErrorType,
        EndpointType,
        ClientOptions,
        MappedData
      >,
    );
    return commandSendRequest<typeof command>(command, options?.dispatcherType, requestCallback);
  };
}

// Typescript test cases

// const builder = new FetchBuilder({
//   baseUrl: "http://localhost:3000",
// });

// const getUsers = builder.createCommand<{ id: string }[]>()({
//   method: "GET",
//   endpoint: "/users",
// });

// const getUser = builder.createCommand<{ id: string }>()({
//   method: "GET",
//   endpoint: "/users/:id",
// });

// const postUser = builder.createCommand<{ id: string }, { name: string }>()({
//   method: "POST",
//   endpoint: "/users",
// });

// const patchUser = builder.createCommand<{ id: string }, { name: string }>()({
//   method: "PATCH",
//   endpoint: "/users/:id",
// });

// // OK
// getUsers.send({ queryParams: "" });
// getUsers.setQueryParams("").send();
// // Fail
// getUsers.send({ data: "" });
// getUsers.send({ params: "" });
// getUsers.setQueryParams("").send({ queryParams: "" });

// // OK
// getUser.send({ params: { id: "" }, queryParams: "" });
// getUser.setParams({ id: "" }).send({ queryParams: "" });
// // Fail
// getUser.send({ queryParams: "" });
// getUser.send();
// getUser.setParams({ id: "" }).send({ params: { id: "" } });

// // OK
// postUser.send({ data: { name: "" } });
// postUser.setData({ name: "" }).send();
// // Fail
// postUser.send({ queryParams: "" });
// postUser.send({ data: null });
// postUser.send();
// postUser.setData({ name: "" }).send({ data: { name: "" } });

// // OK
// patchUser.send({ params: { id: "" }, data: { name: "" } });
// patchUser.setParams({ id: "" }).setData({ name: "" }).send();
// // Fail
// patchUser.send({ queryParams: "" });
// patchUser.send({ data: null });
// patchUser.send();
// patchUser
//   .setParams({ id: "" })
//   .setData({ name: "" })
//   .send({ data: { name: "" } });
// patchUser
//   .setParams({ id: "" })
//   .setData({ name: "" })
//   .send({ params: { id: "" } });
