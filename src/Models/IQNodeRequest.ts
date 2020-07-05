/**
 * Abstraction over a request object representing the HTTP request being received
 */
import { JSON_OBJECT } from './IJson'
import { IQNodeEndpoint } from './IQNodeEndpoint'

export interface IQNodeRequest<ParsedBodyType = any> {
    body: {
        raw: string
        parsed?: ParsedBodyType
    }
    headers: {
        ContentType?: string
        [key: string]: string
    }
    timeout?: number
    url: {
        protocol: string
        base: string
        full: string
        host: string
    }
    endpointMetadata: IQNodeEndpoint
}
