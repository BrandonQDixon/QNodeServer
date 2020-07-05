/**
 * Map an external server technology (such as Express) to something which QServer can use
 */
import { IQNodeEndpoint } from './IQNodeEndpoint'
import { IQNodeRequest } from './IQNodeRequest'
import { IQNodeResponse } from './IQNodeResponse'

export interface IQServerPlugin {
    createEndpoint(
        endpoint: IQNodeEndpoint,
        endpointTriggeredCallback: (rawRequest: any) => Promise<IQNodeResponse>
    ): void

    mapRequest(rawRequest: any): IQNodeRequest

    startServer(port: number): void
}
