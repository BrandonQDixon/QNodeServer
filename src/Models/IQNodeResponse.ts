import { JSON_OBJECT } from './IJson';
import { IQNodeEndpoint } from './IQNodeEndpoint';
import { IQNodeRequest } from './IQNodeRequest';

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

    constructor(response: IQNodeResponse) {
        response = {
            ...QNodeResponse.getEmptySelf(),
            ...response
        }

        Object.keys(response).forEach(k => {
            this[k] = response[k];
        });
    }

    private static getEmptySelf(): IQNodeResponse {
        return {
            body: null,
            stringBody: '',
            statusCode: null
        }
    }
}
