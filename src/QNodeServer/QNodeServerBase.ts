import {IQNodeServer} from "../Models/IQNodeServer";
import {IQNodeConcreteEndpoint, IQNodeEndpoint} from "../Models/IQNodeEndpoint";
import {IQServerPlugin} from "../Models/IQServerPlugin";
import {IQNodeRequest} from "../Models/IQNodeRequest";
import {IQNodeResponse} from "../Models/IQNodeResponse";

export abstract class QNodeServerBase implements IQNodeServer {

    private _endpoints: Array<IQNodeConcreteEndpoint>;

    get endpoints(): Array<IQNodeConcreteEndpoint> {
        return this._endpoints;
    }

    constructor(
        private serverPlugin: IQServerPlugin,
        protected port: number
    ) {}

    //overridable
    protected onServerInit(): void {}
    protected beforeEndpointTriggered(endpoint: IQNodeEndpoint, request: IQNodeRequest): void {}
    protected afterEndpointTriggered(endpoint: IQNodeEndpoint, request: IQNodeRequest, response: IQNodeResponse): void {}

    initialize() {
        this._endpoints = this._endpoints || [];
        this._endpoints.forEach(endpoint => {
            this.serverPlugin.createEndpoint(endpoint.metadata, (rawRequest: any) => this.executeEndpoint(endpoint, rawRequest));
        });
        this.serverPlugin.startServer(this.port);
        this.onServerInit();
    }

    registerEndpointFromDecorator(endpointMetadata: IQNodeEndpoint, callbackMethod): void {
        this._endpoints = this._endpoints || [];
        if (this.endpoints.find(searchEndpoint => QNodeServerBase.endpointsEqual(searchEndpoint.metadata, endpointMetadata))) {
            throw new Error(`Error in endpoint register: endpoint already exists with ${endpointMetadata.verb} => ${endpointMetadata.path}`);
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
            throw new Error(`Error when triggering endpoint, none found matching metadata: ${request.endpointMetadata.verb} => ${request.endpointMetadata.path}`);
        }

        return endpoint.callback.call(this, request);
    }

    /**
     * Callback from server plugin
     * @param endpoint
     * @param rawRequest
     */
    private async executeEndpoint(endpoint: IQNodeConcreteEndpoint, rawRequest: any): Promise<IQNodeResponse> {
        const mappedRequest = this.serverPlugin.mapRequest(rawRequest);
        const mappedRequestClone = JSON.parse(JSON.stringify(mappedRequest));
        await this.beforeEndpointTriggered(endpoint.metadata, mappedRequestClone);
        const response = await this.triggerEndpoint(mappedRequestClone);
        await this.afterEndpointTriggered(endpoint.metadata, mappedRequestClone, response);
        return response;
    }

    /**
     * Find our own endpoint based on a requests' endpoint metadata
     * @param request
     */
    private findOwnEndpointFromRequest(request: IQNodeRequest): IQNodeConcreteEndpoint {
        return this.endpoints.find(item => QNodeServerBase.endpointsEqual(request.endpointMetadata, item.metadata));
    }

    /**
     * Determine if two endpoints should be considered equal;
     * @param a
     * @param b
     */
    static endpointsEqual(a: IQNodeEndpoint, b: IQNodeEndpoint): boolean {
        return a.path === b.path && a.verb === b.verb;
    }

}