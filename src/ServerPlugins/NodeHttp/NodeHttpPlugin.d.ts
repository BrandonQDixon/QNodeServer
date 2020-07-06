import { IQServerPlugin } from '../../Models/IQServerPlugin';
import { IQNodeEndpoint } from '../../Models/IQNodeEndpoint';
import { IQNodeRequest } from '../../Models/IQNodeRequest';
import { IQNodeResponse } from '../../Models/IQNodeResponse';
/**
 * Plugin for Node.js default HTTP API
 */
export declare class NodeHttpPlugin implements IQServerPlugin {
    private endpointRoutes;
    private serverInstance;
    createEndpoint(endpoint: IQNodeEndpoint, endpointTriggeredCallback: (rawRequest: any) => Promise<IQNodeResponse>): Promise<void>;
    mapRequest(rawRequest: any): Promise<IQNodeRequest>;
    startServer(port: number): Promise<void>;
    stopServer(): Promise<void>;
    private getRequestHandler;
    private getRequestEndpoint;
}
