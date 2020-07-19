import {
    IContentType,
    IQNodeEndpoint,
    IQNodeEndpointParams,
    IQNodeMiddleware,
    IQNodeResponse,
    IQNodeRoute,
    QNodeRoute
} from "..";

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
    };

    middleware: Array<IQNodeMiddleware>;
    route: IQNodeRoute;
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

    constructor(endpoint: IQNodeEndpoint | IQNodeEndpointParams) {
        endpoint = {
            ...this.getEmptySelf(),
            ...endpoint,
        };

        Object.keys(endpoint).forEach((k) => {
            this[k] = endpoint[k];
        });

        this.verb = this.verb.toLowerCase();
        if (typeof this.route === 'string') {
            this.route = new QNodeRoute(this.route);
        }
    }

    static async defaultExceptionHandler(
        endpoint: IQNodeEndpoint,
        err: any
    ): Promise<IQNodeResponse> {
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
            route: new QNodeRoute(''),
            contentType: [],
            exceptionHandler: QNodeEndpoint.defaultExceptionHandler.bind(
                null,
                this
            ),
            middleware: [],
        };
    }
}
