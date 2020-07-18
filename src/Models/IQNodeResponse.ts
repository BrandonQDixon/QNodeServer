import { JSON_OBJECT } from './IJson';
import { IQNodeEndpoint } from './IQNodeEndpoint';
import { IQNodeRequest } from './IQNodeRequest';
import {CloneInputObj} from "../Util/Object/CloneObject";

export interface IQNodeResponse<ResponseType = any> {
    body: ResponseType;
    stringBody?: string;
    statusCode: number;
}

/**
 * Class definition for request
 * Useful for prototype checking
 */
export class QNodeResponse<ResponseType = any>
    implements IQNodeResponse<ResponseType> {
    body: ResponseType;
    statusCode: number;
    stringBody: string;

    constructor(@CloneInputObj inputResponse: IQNodeResponse) {
        const response = {
            ...QNodeResponse.getEmptySelf(),
            ...inputResponse,
        };

        Object.keys(response).forEach((k) => {
            this[k] = response[k];
        });
    }

    private static getEmptySelf(): IQNodeResponse {
        return {
            body: {},
            stringBody: '{}',
            statusCode: null,
        };
    }

    static getEmpty(): QNodeResponse {
        return new QNodeResponse(QNodeResponse.getEmptySelf());
    }
}
