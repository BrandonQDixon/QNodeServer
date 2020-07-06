import { IQNodeServer } from '../Models/IQNodeServer';
import { IQNodeConcreteEndpoint, IQNodeEndpoint } from '../Models/IQNodeEndpoint';
import { IQServerPlugin } from '../Models/IQServerPlugin';
import { IQNodeRequest } from '../Models/IQNodeRequest';
import { IQNodeResponse } from '../Models/IQNodeResponse';
/**
 * This is the base class which a server instance will subclass
 * This handles lower level functionality for setting up the server based on the provided plugin and defined endpoints
 */
export declare abstract class QNodeServerBase implements IQNodeServer {
    private serverPlugin;
    protected port: number;
    /**
     * Endpoints which are registered to this class
     */
    private _endpoints;
    /**
     * Readonly variable to get server endpoints
     */
    get endpoints(): Array<IQNodeConcreteEndpoint>;
    /**
     * Setup the server with the appropriate plugin and server settings
     * @param serverPlugin
     * @param port
     */
    constructor(serverPlugin: IQServerPlugin, port: number);
    /**
     * Callback template for action to be taken immediately upon server initialization
     */
    protected onServerInit(): void;
    /**
     * Callback template for action to be taken immediately before an endpoint is triggered after the request comes in
     * @param endpoint
     * @param request
     */
    protected beforeEndpointTriggered(endpoint: IQNodeEndpoint, request: IQNodeRequest): void;
    /**
     * Callback template for action to be taken immediately after and endpoint is triggered
     * @param endpoint
     * @param request
     * @param response
     */
    protected afterEndpointTriggered(endpoint: IQNodeEndpoint, request: IQNodeRequest, response: IQNodeResponse): void;
    /**
     * Start the server
     */
    initialize(): Promise<void>;
    stop(): void;
    /**
     * Triggered by endpoint decorator to register as an endpoint
     * @param endpointMetadata
     * @param callbackMethod
     */
    private registerEndpointFromDecorator;
    /**
     * This will be called by the plugin when its endpoint is triggered
     * @param request
     */
    triggerEndpoint(request: IQNodeRequest): Promise<IQNodeResponse>;
    /**
     * Callback from server plugin
     * @param endpoint
     * @param rawRequest
     */
    private executeEndpoint;
    /**
     * Find our own endpoint based on a requests' endpoint metadata
     * @param request
     */
    private findOwnEndpointFromRequest;
    /**
     * Determine if two endpoints should be considered equal;
     * @param a
     * @param b
     */
    static endpointsEqual(a: IQNodeEndpoint, b: IQNodeEndpoint): boolean;
    /**
     * Decorate a method call in a class which extends QNodeServerBase to declare it as an endpoint
     * @param endpointMetadata
     * @constructor
     */
    static Endpoint(endpointMetadata: IQNodeEndpoint): (target: QNodeServerBase, propertyKey: string, descriptor: PropertyDescriptor) => void;
}
/**
 * Decorate a method call in a class which extends QNodeServerBase to declare it as an endpoint
 * @param endpointMetadata
 * @constructor
 */
export declare const Endpoint: typeof QNodeServerBase.Endpoint;
