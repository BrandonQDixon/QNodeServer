import { IQNodeResponse } from './IQNodeResponse';
import { IQNodeMiddleware } from './IQNodeMiddleware';
import {IQNodeRoute} from "./IQNodeRoute";

export interface IContentType {
    type: string;
    charset?: string;
    boundary?: string;
}

/**
 * Definition for an endpoint
 */
export interface IQNodeEndpoint {
    verb: string;
    route: IQNodeRoute;
    contentType?: Array<IContentType>;
    exceptionHandler?: (err: any) => Promise<IQNodeResponse>;
    middleware?: Array<IQNodeMiddleware>;
}

export interface IQNodeEndpointParams {
    verb: string;
    route: IQNodeRoute | string;
    contentType?: Array<IContentType>;
    exceptionHandler?: (err: any) => Promise<IQNodeResponse>;
    middleware?: Array<IQNodeMiddleware>;
}