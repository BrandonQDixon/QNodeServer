import http, { RequestListener } from 'http'

import { IQServerPlugin } from '../../Models/IQServerPlugin'
import {
    IQNodeConcreteEndpoint,
    IQNodeEndpoint,
} from '../../Models/IQNodeEndpoint'
import { IQNodeRequest } from '../../Models/IQNodeRequest'
import { IQNodeResponse } from '../../Models/IQNodeResponse'

interface ICallableEndpoint {
    metadata: IQNodeEndpoint
    callback: (rawRequest: any) => Promise<IQNodeResponse>
}

/**
 * Plugin for Node.js default HTTP API
 */
export class NodeHttpPlugin implements IQServerPlugin {
    private endpointRoutes: Array<IQNodeConcreteEndpoint> = []

    createEndpoint(
        endpoint: IQNodeEndpoint,
        endpointTriggeredCallback: (rawRequest: any) => Promise<IQNodeResponse>
    ): void {
        const newEndpoint: ICallableEndpoint = {
            metadata: endpoint,
            callback: (rawRequest: any) => {
                return endpointTriggeredCallback(rawRequest)
            },
        }
        this.endpointRoutes.push(newEndpoint)
    }

    mapRequest(rawRequest: any): IQNodeRequest {
        return undefined
    }

    startServer(port: number): void {
        const server = http.createServer(this.getRequestHandler())
        server.listen(port)
    }

    private getRequestHandler(): RequestListener {
        return async (rawRequest: any, rawResponse: any) => {
            const foundEndpoint = this.getRequestEndpoint(rawRequest)
            if (!foundEndpoint) {
                throw new Error(
                    `Error in NodeHttpPlugin: endpoint callback was falsey for: ${foundEndpoint.metadata.verb} ==> ${foundEndpoint.metadata.path}`
                )
            }
            const result: IQNodeResponse = await foundEndpoint.callback(
                rawRequest
            )
            rawResponse.status(result.statusCode).send(result.body)
        }
    }

    private getRequestEndpoint(request: any): IQNodeConcreteEndpoint {
        return this.endpointRoutes.find((route) => {
            const path = route.metadata.path
            return (
                request.url.indexOf(path) === 0 &&
                request.verb === route.metadata.verb
            )
        })
    }
}
