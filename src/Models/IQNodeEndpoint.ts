import { IQNodeResponse } from './IQNodeResponse';

export type IQMiddleware = (
    request: any,
    response: any,
    next: Function
) => Promise<void>;

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
    exceptionHandler?: (err: any) => Promise<IQNodeResponse>;
    middleware?: Array<IQMiddleware>;
}

/**
 * Endpoint with callback defined
 */
export interface IQNodeConcreteEndpoint {
    metadata: QNodeEndpoint;
    callback: Function;
}

export class QNodeEndpoint implements IQNodeEndpoint {

    contentType: Array<IContentType>;

    exceptionHandler = (err: any): Promise<IQNodeResponse> => {
        return Promise.resolve(undefined);
    }

    middleware: Array<IQMiddleware>;
    path: string;
    verb: string;

    async defaultExceptionHandler(err: any): Promise<IQNodeResponse> {
        console.warn(
            'Error on callback for an endpoint, messaged logged from default error handler',
            this,
            err
        );
        return <IQNodeResponse>{
            statusCode: 500,
            body: {},
            stringBody: '',
        };
    }

    constructor(endpoint: IQNodeEndpoint) {

        endpoint = {
            ...this.getEmptySelf(),
            ...endpoint
        };

        Object.keys(endpoint).forEach(k => {
            this[k] = endpoint[k]
        });

        this.verb = this.verb.toLowerCase();
    }

    static async defaultExceptionHandler(endpoint: IQNodeEndpoint, err: any): Promise<IQNodeResponse> {
        console.warn(
            'Error on callback for an endpoint, messaged logged from default error handler',
            endpoint,
            err
        );
        return <IQNodeResponse>{
            statusCode: 500,
            body: {},
            stringBody: '',
        };
    }

    private getEmptySelf(): IQNodeEndpoint {
        return {
            verb: '',
            path: '',
            contentType: [],
            exceptionHandler: QNodeEndpoint.defaultExceptionHandler.bind(null, this),
            middleware: []
        }
    }

}