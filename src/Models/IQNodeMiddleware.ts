import {IQNodeRequest} from "./IQNodeRequest";
import {IQNodeResponse} from "./IQNodeResponse";

export type IQNodeMiddlewareComponents = {
    request: IQNodeRequest,
    response: IQNodeResponse,
    carryValue: any
}
export type IQNodeMiddleware = (request: IQNodeRequest, response: IQNodeResponse, carryValue: any, next: (updatedComponents?: Partial<IQNodeMiddlewareComponents> | Error) => void) => Promise<void>;