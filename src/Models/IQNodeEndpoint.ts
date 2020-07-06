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
    path: string;
    contentType?: Array<IContentType>;
}

/**
 * Endpoint with callback defined
 */
export interface IQNodeConcreteEndpoint {
    metadata: IQNodeEndpoint;
    callback: Function;
}
