import url from 'url';
import { IQNodeServer } from '../Models/IQNodeServer';
import {
    IQNodeConcreteEndpoint,
    IQNodeEndpoint,
    QNodeEndpoint,
} from '../Models/IQNodeEndpoint';
import { IQServerPlugin } from '../Models/IQServerPlugin';
import { IQNodeRequest, QNodeRequest } from '../Models/IQNodeRequest';
import { IQNodeResponse, QNodeResponse } from '../Models/IQNodeResponse';
import { MIME_TYPES } from '../Constants/MimeTypes';
import {IQNodeMiddleware, IQNodeMiddlewareComponents} from "..";

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
            );
        }
        await this.serverPlugin.startServer(this.port);
        this.onServerInit();
    }

    async stop() {
        await this.serverPlugin.stopServer();
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
        const concreteEndpoint = new QNodeEndpoint(endpointMetadata);
        this._endpoints = this._endpoints || [];
        if (
            this.endpoints.find((searchEndpoint) =>
                QNodeServerBase.endpointsEqual(
                    searchEndpoint.metadata,
                    concreteEndpoint
                )
            )
        ) {
            throw new Error(
                `Error in endpoint register: endpoint already exists with ${concreteEndpoint.verb} => ${concreteEndpoint.path}`
            );
        }
        this._endpoints.push({
            metadata: concreteEndpoint,
            callback: callbackMethod,
        });
    }

    /**
     * This will be called by the plugin when its endpoint is triggered
     * @param request
     * @param response
     * @param carryValue
     */
    private triggerEndpoint(request: IQNodeRequest, response: IQNodeResponse, carryValue: any): Promise<IQNodeResponse> {
        const endpoint = this.findOwnEndpointFromRequest(request);
        if (!endpoint) {
            throw new Error(
                `Error when triggering endpoint, none found matching metadata: ${request.endpointMetadata.verb} => ${request.endpointMetadata.path}`
            );
        }

        return endpoint.callback.call(this, request, response, carryValue);
    }

    private async triggerMiddleware(middleware: IQNodeMiddleware, request: IQNodeRequest, response: IQNodeResponse, carryValue: any): Promise<IQNodeMiddlewareComponents> {
        let components: IQNodeMiddlewareComponents = {
            request,
            response,
            carryValue
        };

        let receivedComponents: Partial<IQNodeMiddlewareComponents | Error> = await new Promise((resolve, reject) => {
            middleware.bind(this)(request, response, carryValue, resolve).catch(reject);
        });

        if (receivedComponents instanceof Error) {
            throw receivedComponents;
        } else if (!receivedComponents) {
            receivedComponents = {};
        }

        components = <IQNodeMiddlewareComponents>{
            ...components,
            ...receivedComponents,
        };

        return components;
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
        let mappedRequest: QNodeRequest = await this.mapRequest(
            endpoint,
            rawRequest
        );
        let middlewareResponse: QNodeResponse = QNodeResponse.getEmpty();
        await this.beforeEndpointTriggered(endpoint.metadata, mappedRequest);

        let response: IQNodeResponse;
        try {
            //execute middleware
            let carryValue = null;
            for (let i = 0; i < endpoint.metadata.middleware.length; i++) {
                const middleware = endpoint.metadata.middleware[i];
                const result = await this.triggerMiddleware(middleware, mappedRequest, middlewareResponse, carryValue);

                mappedRequest = new QNodeRequest(result.request);
                middlewareResponse = new QNodeResponse(result.response);
                carryValue = result.carryValue;

            }

            //trigger main endpoint
            response = await this.triggerEndpoint(
                mappedRequest,
                middlewareResponse,
                carryValue
            );

            //get response from endpoint, middleware, or default empty (if others are not defined)
            response = response || middlewareResponse;
            if (!response.statusCode) {
                response.statusCode = 200;
            }
        } catch (err) {
            const defaultHandler = async function (
                err
            ): Promise<IQNodeResponse> {
                console.warn(
                    'Error on callback for an endpoint, messaged logged from default error handler',
                    endpoint.metadata,
                    err
                );
                return <IQNodeResponse>{
                    statusCode: 500,
                    body: {},
                    stringBody: '',
                };
            };
            const errorHandler =
                endpoint.metadata.exceptionHandler || defaultHandler;
            return errorHandler(err).catch((ex) => defaultHandler(ex));
        }
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
    private async mapRequest(
        endpoint: IQNodeConcreteEndpoint,
        rawRequest: any
    ): Promise<QNodeRequest> {
        let mappedRequest: QNodeRequest;
        if (rawRequest instanceof QNodeRequest) {
            mappedRequest = new QNodeRequest({
                ...(<IQNodeRequest>rawRequest),
                endpointMetadata: endpoint.metadata,
            });
        } else {
            const mapped = await this.serverPlugin.mapRequest(rawRequest);
            mappedRequest = new QNodeRequest({
                ...mapped,
                endpointMetadata: endpoint.metadata,
            });
        }
        return mappedRequest;
    }

    /**
     * Process the endpoint execution result and add any missing fields
     * @param endpoint
     * @param response
     */
    private async processEndpointResponse(
        endpoint: IQNodeConcreteEndpoint,
        response: IQNodeResponse
    ): Promise<QNodeResponse> {
        const pResponse = new QNodeResponse(response);

        let stringBody = '';
        if (
            endpoint.metadata.contentType.find(
                (ct) => ct.type === MIME_TYPES.ApplicationJson
            )
        ) {
            stringBody = JSON.stringify(pResponse.body);
        } else if (typeof pResponse.body !== 'string') {
            stringBody = pResponse.body.toString();
        }
        pResponse.stringBody = stringBody;
        return pResponse;
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
        return (
            a.path.split('?')[0] === b.path.split('?')[0] && a.verb === b.verb
        );
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
