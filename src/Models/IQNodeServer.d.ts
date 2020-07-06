import { IQNodeConcreteEndpoint } from './IQNodeEndpoint';
export interface IQNodeServer {
    endpoints: Array<IQNodeConcreteEndpoint>;
    initialize(): void;
    stop(): void;
}
