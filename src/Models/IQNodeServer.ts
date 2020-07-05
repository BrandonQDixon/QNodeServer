import { IQNodeConcreteEndpoint, IQNodeEndpoint } from './IQNodeEndpoint'

export interface IQNodeServer {
    endpoints: Array<IQNodeConcreteEndpoint>

    initialize(): void
}
