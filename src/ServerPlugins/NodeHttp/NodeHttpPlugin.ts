import http, {RequestListener} from 'http';
import url from 'url';

import {IQServerPlugin} from '../../Models/IQServerPlugin';
import {IQNodeConcreteEndpoint, IQNodeEndpoint, QNodeEndpoint,} from '../../Models/IQNodeEndpoint';
import {IQNodeRequest} from '../../Models/IQNodeRequest';
import {IQNodeResponse} from '../../Models/IQNodeResponse';

interface ICallableEndpoint {
    metadata: QNodeEndpoint;
    callback: (rawRequest: any) => Promise<IQNodeResponse>;
}

/**
 * Plugin for Node.js default HTTP API
 */
export class NodeHttpPlugin implements IQServerPlugin {
    private endpointRoutes: Array<IQNodeConcreteEndpoint> = [];
    private serverInstance;

    async createEndpoint(
        endpoint: QNodeEndpoint,
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
            let body = '';
            rawRequest.on('data', (chunk) => {
                body += chunk.toString();
            });
            rawRequest.on('end', () => {
                resolve(body);
            });
        });

        try {
            return {
                url: {
                    protocol: rawRequest.protocol,
                    host: rawRequest.host,
                    full:
                        rawRequest.protocol +
                        '://' +
                        rawRequest.host +
                        rawRequest.url,
                },
                params: {...url.parse(rawRequest.url, true).query},
                body: {
                    raw: rawBody,
                },
                headers: rawRequest.headers,
                endpointMetadata: {
                    verb: rawRequest.method,
                    path: rawRequest.url,
                },
            };
        } catch (err) {
            const message = "Error mapping request from HTTP server to IQNodeRequest: "+err;
            console.error(message);
            throw new Error(message);
        }
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
            });
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
            return (
                request.url.indexOf(route.metadata.path) === 0 &&
                request.method.toLowerCase() === route.metadata.verb
            );
        });
    }
}
