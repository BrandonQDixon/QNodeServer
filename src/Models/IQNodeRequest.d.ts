import { IQNodeEndpoint } from './IQNodeEndpoint';
export interface IQNodeRequest<ParsedBodyType = any> {
    body: {
        raw: string;
        json?: ParsedBodyType;
    };
    headers: {
        ContentType?: string;
        [key: string]: string;
    };
    timeout?: number;
    url: {
        protocol: string;
        full: string;
        host: string;
    };
    endpointMetadata: IQNodeEndpoint;
}
