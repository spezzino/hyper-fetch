import { ResponseType } from "adapter";
import { ExtractRouteParams, Request, RequestInstance } from "request";

export type ExtractAdapterReturnType<T extends RequestInstance> = ResponseType<
  ExtractResponseType<T>,
  ExtractErrorType<T>
>;

export type ExtractResponseType<T> = T extends Request<infer D, any, any, any, any, any, any, any, any, any, any>
  ? D
  : never;

export type ExtractPayloadType<T> = T extends Request<any, infer D, any, any, any, any, any, any, any, any, any>
  ? D
  : never;

export type ExtractQueryParamsType<T> = T extends Request<any, any, infer Q, any, any, any, any, any, any, any, any>
  ? Q
  : never;

export type ExtractErrorType<T> = T extends Request<any, any, any, infer G, infer L, any, any, any, any, any, any>
  ? G | L
  : never;

export type ExtractGlobalErrorType<T> = T extends Request<any, any, any, infer E, any, any, any, any, any, any, any>
  ? E
  : never;

export type ExtractLocalErrorType<T> = T extends Request<any, any, any, any, infer E, any, any, any, any, any, any>
  ? E
  : never;

export type ExtractParamsType<T> = T extends Request<any, any, any, any, any, infer P, any, any, any, any, any>
  ? ExtractRouteParams<P>
  : never;

export type ExtractEndpointType<T> = T extends Request<any, any, any, any, any, infer E, any, any, any, any, any>
  ? E
  : never;

export type ExtractAdapterOptionsType<T> = T extends Request<any, any, any, any, any, any, infer O, any, any, any, any>
  ? O
  : never;

export type ExtractHasDataType<T> = T extends Request<any, any, any, any, any, any, any, infer D, any, any, any>
  ? D
  : never;

export type ExtractHasParamsType<T> = T extends Request<any, any, any, any, any, any, any, any, infer P, any, any>
  ? P
  : never;

export type ExtractHasQueryParamsType<T> = T extends Request<any, any, any, any, any, any, any, any, any, infer Q, any>
  ? Q
  : never;

export type ExtractHasMappedDataType<T> = T extends Request<any, any, any, any, any, any, any, any, any, any, infer M>
  ? M
  : never;
