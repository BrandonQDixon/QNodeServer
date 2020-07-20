import { IQNodeConcreteEndpoint } from "../QNodeServer/QNodeEndpoint";

export interface IQNodeServer {
    endpoints: Array<IQNodeConcreteEndpoint>;

    initialize(): void;
    stop(): void;
}
