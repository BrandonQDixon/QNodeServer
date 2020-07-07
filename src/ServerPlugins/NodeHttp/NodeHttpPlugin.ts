import http, { RequestListener, RequestOptions } from 'http';

import { IQServerPlugin } from '../../Models/IQServerPlugin';
import {
    IQNodeConcreteEndpoint,
    IQNodeEndpoint,
} from '../../Models/IQNodeEndpoint';
import { IQNodeRequest } from '../../Models/IQNodeRequest';
import { IQNodeResponse } from '../../Models/IQNodeResponse';
import { MIME_TYPES } from '../../Constants/MimeTypes';

interface ICallableEndpoint {
    metadata: IQNodeEndpoint;
    callback: (rawRequest: any) => Promise<IQNodeResponse>;
}

/**
 * Plugin for Node.js default HTTP API
 */
export class NodeHttpPlugin implements IQServerPlugin {
    private endpointRoutes: Array<IQNodeConcreteEndpoint> = [];
    private serverInstance;

    async createEndpoint(
        endpoint: IQNodeEndpoint,
        endpointTriggeredCallback: (rawRequest: any) => Promise<IQNodeResponse>
    ) {
        const newEndpoint: ICallableEndpoint = {
            metadata: endpoint,
            callback: (rawRequest: any) => {
                return endpointTriggeredCallback(rawRequest);
            },
        };
        this.endpointRoutes.push(newEndpoint);
        this.endpointRoutes.sort((a, b) => {
            return b.metadata.path.localeCompare(a.metadata.path);
        });
    }

    async mapRequest(rawRequest: any): Promise<IQNodeRequest> {
        let rawBody: string = await new Promise((resolve, reject) => {
            const data = [];
            rawRequest.on('data', (chunk) => {
                data.push(chunk);
            });
            rawRequest.on('end', () => {
                resolve(Buffer.from(data).toString());
            });
        });

        const request: IQNodeRequest = {
            url: {
                protocol: rawRequest.protocol,
                host: rawRequest.host,
                full:
                    rawRequest.protocol +
                    '://' +
                    rawRequest.host +
                    rawRequest.url,
            },
            body: {
                raw: rawBody,
            },
            headers: rawRequest.headers,
            endpointMetadata: {
                verb: rawRequest.method,
                path: rawRequest.url,
            },
        };

        return request;
    }

    async startServer(port: number): Promise<void> {
        this.serverInstance = http.createServer(this.getRequestHandler());
        return new Promise((resolve, reject) => {
            this.serverInstance.listen(port, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    async stopServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.serverInstance.close((err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            })
        });
    }

    private getRequestHandler(): RequestListener {
        return async (rawRequest: any, rawResponse: any) => {
            const foundEndpoint = this.getRequestEndpoint(rawRequest);
            if (!foundEndpoint) {
                throw new Error(
                    `Error in NodeHttpPlugin: endpoint callback was falsey for: ${rawRequest.method} ==> ${rawRequest.url}`
                );
            }
            const result: IQNodeResponse = await foundEndpoint.callback(
                rawRequest
            );

            rawResponse.statusCode = result.statusCode;
            rawResponse.write(Buffer.from(result.stringBody));
            rawResponse.end();
        };
    }

    private getRequestEndpoint(request: any): IQNodeConcreteEndpoint {
        return this.endpointRoutes.find((route) => {
            const path = route.metadata.path;
            return (
                request.url.indexOf(path) === 0 &&
                request.method.toLowerCase() === route.metadata.verb
            );
        });
    }
}
