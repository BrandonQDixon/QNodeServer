import { IQNodeServer } from '../Models/IQNodeServer';
import {
    IQNodeConcreteEndpoint,
    IQNodeEndpoint,
} from '../Models/IQNodeEndpoint';
import { IQServerPlugin } from '../Models/IQServerPlugin';
import { IQNodeRequest } from '../Models/IQNodeRequest';
import { IQNodeResponse } from '../Models/IQNodeResponse';
import { MIME_TYPES } from '../Constants/MimeTypes';

/**
 * This is the base class which a server instance will subclass
 * This handles lower level functionality for setting up the server based on the provided plugin and defined endpoints
 */
export abstract class QNodeServerBase implements IQNodeServer {
    /**
     * Endpoints which are registered to this class
     */
    private _endpoints: Array<IQNodeConcreteEndpoint>;

    /**
     * Readonly variable to get server endpoints
     */
    get endpoints(): Array<IQNodeConcreteEndpoint> {
        return this._endpoints;
    }

    /**
     * Setup the server with the appropriate plugin and server settings
     * @param serverPlugin
     * @param port
     */
    constructor(private serverPlugin: IQServerPlugin, protected port: number) {}

    /**
     * Callback template for action to be taken immediately upon server initialization
     */
    protected onServerInit(): void {}

    /**
     * Callback template for action to be taken immediately before an endpoint is triggered after the request comes in
     * @param endpoint
     * @param request
     */
    protected beforeEndpointTriggered(
        endpoint: IQNodeEndpoint,
        request: IQNodeRequest
    ): void {}

    /**
     * Callback template for action to be taken immediately after and endpoint is triggered
     * @param endpoint
     * @param request
     * @param response
     */
    protected afterEndpointTriggered(
        endpoint: IQNodeEndpoint,
        request: IQNodeRequest,
        response: IQNodeResponse
    ): void {}

    /**
     * Start the server
     */
    async initialize() {
        this._endpoints = this._endpoints || [];
        for (let i = 0; i < this._endpoints.length; i++) {
            const endpoint = this._endpoints[i];
            await this.serverPlugin.createEndpoint(
                endpoint.metadata,
                (rawRequest: any) => this.executeEndpoint(endpoint, rawRequest)
                //this.executeEndpoint.bind(this, endpoint)
            );
        }
        await this.serverPlugin.startServer(this.port);
        this.onServerInit();
    }

    stop() {
        this.serverPlugin.stopServer();
    }

    /**
     * Triggered by endpoint decorator to register as an endpoint
     * @param endpointMetadata
     * @param callbackMethod
     */
    private registerEndpointFromDecorator(
        endpointMetadata: IQNodeEndpoint,
        callbackMethod
    ): void {
        this._endpoints = this._endpoints || [];
        if (
            this.endpoints.find((searchEndpoint) =>
                QNodeServerBase.endpointsEqual(
                    searchEndpoint.metadata,
                    endpointMetadata
                )
            )
        ) {
            throw new Error(
                `Error in endpoint register: endpoint already exists with ${endpointMetadata.verb} => ${endpointMetadata.path}`
            );
        }
        this._endpoints.push({
            metadata: endpointMetadata,
            callback: callbackMethod
        });
    }

    /**
     * This will be called by the plugin when its endpoint is triggered
     * @param request
     */
    triggerEndpoint(request: IQNodeRequest): Promise<IQNodeResponse> {
        const endpoint = this.findOwnEndpointFromRequest(request);
        if (!endpoint) {
            throw new Error(
                `Error when triggering endpoint, none found matching metadata: ${request.endpointMetadata.verb} => ${request.endpointMetadata.path}`
            );
        }

        return endpoint.callback.call(this, request);
    }

    /**
     * Callback from server plugin
     * @param endpoint
     * @param rawRequest
     */
    private async executeEndpoint(
        endpoint: IQNodeConcreteEndpoint,
        rawRequest: any
    ): Promise<IQNodeResponse> {
        const mappedRequest: IQNodeRequest = await this.mapRequest(endpoint, rawRequest);

        await this.beforeEndpointTriggered(
            endpoint.metadata,
            mappedRequest
        );

        let response: IQNodeResponse = await this.triggerEndpoint(
            mappedRequest
        ).catch(err => {
            const defaultHandler = async function(err): Promise<IQNodeResponse> {
                console.warn("Error on callback for an endpoint, messaged logged from default error handler", endpoint.metadata, err);
                return <IQNodeResponse>{
                    statusCode: 500,
                    body: {},
                    stringBody: ""
                };
            };
            const errorHandler = endpoint.metadata.exceptionHandler || defaultHandler;
            return errorHandler(err).catch(ex => defaultHandler(ex));
        });
        response = await this.processEndpointResponse(endpoint, response);

        await this.afterEndpointTriggered(
            endpoint.metadata,
            mappedRequest,
            response
        );
        return response;
    }

    /**
     * Map the raw request and normalize properties (such as verb);
     * @param endpoint
     * @param rawRequest
     */
    private async mapRequest(endpoint: IQNodeConcreteEndpoint, rawRequest: any): Promise<IQNodeRequest> {
        let mappedRequest = await this.serverPlugin.mapRequest(rawRequest);
        mappedRequest = JSON.parse(JSON.stringify(mappedRequest));

        if (
            endpoint.metadata.contentType.find(
                (ct) => ct.type === MIME_TYPES.ApplicationJson
            )
        ) {
            let bodyRaw = mappedRequest.body.raw;
            if (bodyRaw.length === 0) {
                bodyRaw = '{}';
            }
            mappedRequest.body.json = JSON.parse(bodyRaw);
        }
        mappedRequest.endpointMetadata.verb = mappedRequest.endpointMetadata.verb.toLowerCase();
        return mappedRequest;
    }

    /**
     * Process the endpoint execution result and add any missing fields
     * @param endpoint
     * @param response
     */
    private async processEndpointResponse(endpoint: IQNodeConcreteEndpoint, response: IQNodeResponse): Promise<IQNodeResponse> {
        response = JSON.parse(JSON.stringify(response));

        let stringBody = '';
        if (
            endpoint.metadata.contentType.find(
                (ct) => ct.type === MIME_TYPES.ApplicationJson
            )
        ) {
            stringBody = JSON.stringify(response.body);
        } else if (typeof response.body !== 'string') {
            stringBody = response.body.toString();
        }
        response.stringBody = stringBody;
        return response;
    }

    /**
     * Find our own endpoint based on a requests' endpoint metadata
     * @param request
     */
    private findOwnEndpointFromRequest(
        request: IQNodeRequest
    ): IQNodeConcreteEndpoint {
        return this.endpoints.find((item) =>
            QNodeServerBase.endpointsEqual(
                request.endpointMetadata,
                item.metadata
            )
        );
    }

    /**
     * Determine if two endpoints should be considered equal;
     * @param a
     * @param b
     */
    static endpointsEqual(a: IQNodeEndpoint, b: IQNodeEndpoint): boolean {
        return a.path === b.path && a.verb === b.verb;
    }

    /**
     * Decorate a method call in a class which extends QNodeServerBase to declare it as an endpoint
     * @param endpointMetadata
     * @constructor
     */
    static Endpoint(endpointMetadata: IQNodeEndpoint) {
        endpointMetadata.verb = endpointMetadata.verb.toLowerCase();
        return function (
            target: QNodeServerBase,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) {
            descriptor.enumerable = true;
            target.registerEndpointFromDecorator.call(
                target,
                endpointMetadata,
                descriptor.value
            );
        };
    }
}

/**
 * Decorate a method call in a class which extends QNodeServerBase to declare it as an endpoint
 * @param endpointMetadata
 * @constructor
 */
export const Endpoint = QNodeServerBase.Endpoint;
