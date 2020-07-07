import { JSON_OBJECT } from './IJson';

export interface IQNodeResponse<ResponseType = any> {
    body: ResponseType;
    stringBody?: string;
    statusCode: number;
}