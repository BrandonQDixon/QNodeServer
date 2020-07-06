export interface IQNodeResponse<ResponseType = any> {
    body: ResponseType;
    stringBody?: string;
    statusCode: number;
}
