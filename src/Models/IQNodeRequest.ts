/**
 * Abstraction over a request object representing the HTTP request being received
 */
import {JSON_OBJECT} from "./IJson";
import {IQNodeEndpoint} from "./IQNodeEndpoint";

export interface IQNodeRequest {
    body: {
        raw: string;
        json?: JSON_OBJECT
    },
    headers: {
        [key: string]: string;
    },
    timeout?: number,
    url: {
        protocol: string;
        base: string;
        full: string;
        host: string;
    },
    endpointMetadata: IQNodeEndpoint;
}