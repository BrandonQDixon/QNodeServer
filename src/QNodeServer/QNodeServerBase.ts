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
            this.serverPlugin.createEndpoint(endpoint.metadata, this.executeEndpoint.bind(this, endpoint));
        });
        this.serverPlugin.startServer(this.port);
        this.onServerInit();
    }

    registerEndpointFromDecorator(endpointMetadata: IQNodeEndpoint, callbackMethod): void {
        this._endpoints = this._endpoints || [];
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

        return endpoint.callback(request);
    }

    private async executeEndpoint(endpoint: IQNodeConcreteEndpoint, rawRequest: any): Promise<IQNodeResponse> {
        const mappedRequest = this.serverPlugin.mapRequest(rawRequest);
        await this.beforeEndpointTriggered(endpoint.metadata, mappedRequest);
        const response = await this.triggerEndpoint(mappedRequest);
        await this.afterEndpointTriggered(endpoint.metadata, mappedRequest, response);
        return response;
    }

    /**
     * Find our own endpoint based on a requests' endpoint metadata
     * @param request
     */
    private findOwnEndpointFromRequest(request: IQNodeRequest): IQNodeConcreteEndpoint {
        return this.endpoints.find(item => this.endpointsEqual(request.endpointMetadata, item.metadata));
    }

    /**
     * Determine if two endpoints should be considered equal;
     * @param a
     * @param b
     */
    private endpointsEqual(a: IQNodeEndpoint, b: IQNodeEndpoint): boolean {
        return a.path === b.path && a.verb === b.verb;
    }

}