/**
 * Map an external server technology (such as Express) to something which QServer can use
 */
import { IQNodeEndpoint } from './IQNodeEndpoint';
import { IQNodeRequest } from './IQNodeRequest';
import { IQNodeResponse } from './IQNodeResponse';

export interface IQServerPlugin {
    createEndpoint(
        endpoint: IQNodeEndpoint,
        endpointTriggeredCallback: (rawRequest: any) => Promise<IQNodeResponse>
    ): Promise<void>;

    mapRequest(rawRequest: any): Promise<IQNodeRequest>;

    startServer(port: number): Promise<void>;

    stopServer(): Promise<void>;
}
