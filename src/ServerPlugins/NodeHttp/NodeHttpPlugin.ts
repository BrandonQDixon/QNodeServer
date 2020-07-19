import http, { RequestListener } from 'http';
import url from 'url';
import {
    IQNodeConcreteEndpoint,
    IQNodeRequest,
    IQNodeResponse,
    IQServerPlugin,
    QNodeEndpoint,
    QNodeUrl,
} from '../..';

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
            return b.metadata.route.path.localeCompare(a.metadata.route.path);
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
            const urlParts = url.parse(rawRequest.url);

            const endpointMetadata = this.endpointRoutes.find((endpoint) => {
                return endpoint.metadata.route.urlMatches(urlParts.pathname);
            });
            if (!endpointMetadata) {
                throw new Error(
                    'Could not find endpoint metadata for path: ' +
                        urlParts.path
                );
            }

            return {
                url: new QNodeUrl({
                    protocol: urlParts.protocol,
                    host: urlParts.host,
                    path: urlParts.pathname,
                    query: urlParts.query,
                    port: urlParts.port,
                }),
                query: { ...url.parse(rawRequest.url, true).query },
                params: {},
                body: {
                    raw: rawBody,
                },
                headers: rawRequest.headers,
                endpointMetadata: endpointMetadata.metadata,
            };
        } catch (err) {
            const message =
                'Error mapping request from HTTP server to IQNodeRequest: ' +
                err;
            console.error(message);
            throw new Error(message);
        }
    }

    async startServer(port: string): Promise<void> {
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
            rawResponse.write(Buffer.from(result.stringBody || ''));
            rawResponse.end();
        };
    }

    private getRequestEndpoint(request: any): IQNodeConcreteEndpoint {
        const urlParts = url.parse(request.url);

        return this.endpointRoutes.find((route) => {
            return (
                route.metadata.route.urlMatches(urlParts.pathname) &&
                request.method.toLowerCase() === route.metadata.verb
            );
        });
    }
}
