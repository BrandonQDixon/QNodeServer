/**
 * Abstraction over a request object representing the HTTP request being received
 */
import { IQNodeEndpoint } from './IQNodeEndpoint';
import { IQNodeUrl } from './IQNodeUrl';

export interface IQNodeRequest<ParsedBodyType = any> {
    params: {
        [key: string]: string;
    };
    query: {
        [key: string]: string | Array<string>;
    };
    body: {
        raw: string;
        json?: ParsedBodyType;
    };
    headers: {
        'content-type'?: string;
        [key: string]: string;
    };
    timeout?: number;
    url: IQNodeUrl;
    endpointMetadata: IQNodeEndpoint;
}
