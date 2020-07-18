import fetch from 'node-fetch';
import {
    Endpoint,
    IQNodeEndpoint, IQNodeMiddleware,
    IQNodeRequest,
    IQNodeResponse,
    IQServerPlugin,
    JSON_OBJECT,
    QNodeRequest,
    QNodeServerBase,
} from '..';

export type fetchResponse = {
    status: number;
    body: any;
};

export const TEST_PORT = 65334;
export const BASE_URL = `http://localhost:${TEST_PORT}`;

const TEST_MIDDLEWARE /*: {[key: string]: IQNodeMiddleware}*/ = {
    throwError: async (request: IQNodeRequest, response: IQNodeResponse, carryValue: any, next) => {
        throw new Error("Test middleware throw error");
    },
    nextError: async (request: IQNodeRequest, response: IQNodeResponse, carryValue: any, next) => {
        next(new Error("Test middleware throw error in next"));
    },
    appendKeyToRequest: async (request: IQNodeRequest, response: IQNodeResponse, carryValue: any, next) => {
        request.body.json.newNumber = 17;
        next({request});
    },
    appendKeyToResponse: async (request: IQNodeRequest, response: IQNodeResponse, carryValue: any, next) => {
        response.body.newNumber = 17;
        next({response});
    },
}

const TEST_ENDPOINTS /*: { [key: string]: IQNodeEndpoint }*/ = {
    randomColor: {
        path: '/randomColor',
        verb: 'get',
        contentType: [
            {
                type: 'application/json',
            },
        ],
    },
    numberGet: {
        path: '/number',
        verb: 'get',
        contentType: [
            {
                type: 'application/json',
            },
        ],
    },
    numberPost: {
        path: '/number',
        verb: 'post',
        contentType: [
            {
                type: 'application/json',
            },
        ],
    },
    defaultErrorGet: {
        path: '/defaultError',
        verb: 'get',
        contentType: [
            {
                type: 'application/json',
            },
        ],
    },
    errorHandlerGet: {
        path: '/errorHandler',
        verb: 'get',
        contentType: [
            {
                type: 'application/json',
            },
        ],
        exceptionHandler: async (err) => {
            return {
                statusCode: 403,
                body: {},
            };
        },
    },
    middlewareThrowError: {
        path: '/middlewareThrowError',
        verb: 'get',
        middleware: [TEST_MIDDLEWARE.throwError],
        contentType: [
            {
                type: 'application/json',
            },
        ],
        exceptionHandler: async (err) => {
            return {
                statusCode: 500,
                body: {},
            };
        },
    },
    middlewareNextError: {
        path: '/middlewareNextError',
        verb: 'get',
        middleware: [TEST_MIDDLEWARE.nextError],
        contentType: [
            {
                type: 'application/json',
            },
        ],
        exceptionHandler: async (err) => {
            return {
                statusCode: 500,
                body: {},
            };
        },
    },
    middlewareRequestAppendKey: {
        path: '/middlewareRequestAppendKey',
        verb: 'get',
        middleware: [TEST_MIDDLEWARE.appendKeyToRequest],
        contentType: [
            {
                type: 'application/json',
            },
        ]
    },
    middlewareResponseAppendKey: {
        path: '/middlewareResponseAppendKey',
        verb: 'get',
        middleware: [TEST_MIDDLEWARE.appendKeyToResponse],
        contentType: [
            {
                type: 'application/json',
            },
        ]
    },
    middlewareRequestResponseAppendKey: {
        path: '/middlewareRequestResponseAppendKey',
        verb: 'get',
        middleware: [TEST_MIDDLEWARE.appendKeyToRequest, TEST_MIDDLEWARE.appendKeyToResponse],
        contentType: [
            {
                type: 'application/json',
            },
        ]
    }
};

export class TestServer extends QNodeServerBase {
    private numberFromPost: number = 0;

    @Endpoint(TEST_ENDPOINTS.randomColor)
    private async getRandomColor(): Promise<IQNodeResponse> {
        const colors = ['green', 'red', 'blue'];
        const selectedColorIndex = Math.floor(Math.random() * colors.length);
        return {
            statusCode: 200,
            body: {
                color: colors[selectedColorIndex],
            },
        };
    }

    @Endpoint(TEST_ENDPOINTS.numberGet)
    private async getNumber(request: IQNodeRequest): Promise<IQNodeResponse> {
        return {
            statusCode: 200,
            body: {
                number:
                    this.numberFromPost + parseInt(request.params.number + ''),
            },
        };
    }

    @Endpoint(TEST_ENDPOINTS.numberPost)
    private async setNumber(request: IQNodeRequest): Promise<IQNodeResponse> {
        this.numberFromPost = request.body.json.number;
        return {
            statusCode: 200,
            body: {
                number: this.numberFromPost,
                status: 'success',
            },
        };
    }

    @Endpoint(TEST_ENDPOINTS.defaultErrorGet)
    private async throwDefaultError(
        request: IQNodeRequest
    ): Promise<IQNodeResponse> {
        throw new Error('Default error test endpoint');
    }

    @Endpoint(TEST_ENDPOINTS.errorHandlerGet)
    private async errorHandler(
        request: IQNodeRequest
    ): Promise<IQNodeResponse> {
        throw new Error('Error handler test endpoint');
    }


    @Endpoint(TEST_ENDPOINTS.middlewareThrowError)
    private async middlewareThrowError() {
        return {
            statusCode: 200,
            body: {},
        };
    }

    @Endpoint(TEST_ENDPOINTS.middlewareNextError)
    private async middlewareNextError() {
        return {
            statusCode: 200,
            body: {},
        };
    }

    @Endpoint(TEST_ENDPOINTS.middlewareRequestAppendKey)
    private async middlewareRequestAppendKey(request: IQNodeRequest, response: IQNodeResponse, middlewareCarryValue: any) {
        return {
            statusCode: 200,
            body: {},
        };
    }

    @Endpoint(TEST_ENDPOINTS.middlewareResponseAppendKey)
    private async middlewareResponseAppendKey(request: IQNodeRequest, response: IQNodeResponse, middlewareCarryValue: any) {
        return {
            statusCode: 200,
            body: response.body,
        };
    }

    @Endpoint(TEST_ENDPOINTS.middlewareRequestResponseAppendKey)
    private async middlewareRequestResponseAppendKey(request: IQNodeRequest, response: IQNodeResponse, middlewareCarryValue: any) {
        return {
            statusCode: 200,
            body: response.body,
        };
    }
}

export function DEFINE_COMMON_TEST_CASES(
    it,
    sendRequest: (request: IQNodeRequest) => Promise<fetchResponse>
) {
    it('should execute getRandomColor when endpoint is triggered', async (done) => {
        const testRequest: IQNodeRequest = new QNodeRequest({
            url: {
                protocol: 'http',
                full: BASE_URL + TEST_ENDPOINTS.randomColor.path,
                host: 'localhost',
            },
            body: {
                raw: '',
            },
            params: {},
            headers: {},
            endpointMetadata: TEST_ENDPOINTS.randomColor,
        });

        const response: fetchResponse = await sendRequest(testRequest);

        expect(response.body).toBeTruthy();
        expect(typeof response.body.color === 'string').toBe(true);
        done();
    });

    it('should execute post request with body', async (done) => {
        const postBody = {
            number: 17,
        };
        const postRequest: IQNodeRequest = new QNodeRequest({
            url: {
                protocol: 'http',
                full: BASE_URL + TEST_ENDPOINTS.numberPost.path,
                host: 'localhost',
            },
            body: {
                raw: JSON.stringify(postBody),
                json: { ...postBody },
            },
            params: {},
            headers: {
                'content-type': 'application/json',
            },
            endpointMetadata: TEST_ENDPOINTS.numberPost,
        });

        const postResponse: fetchResponse = await sendRequest(postRequest);
        expect(postResponse.status).toBe(200);
        expect(postResponse.body.number).toBe(postBody.number);
        expect(postResponse.body.status).toBe('success');
        done();
    });

    it('should get and post to different endpoints with the same path', async (done) => {
        //setup
        const getBody = {
            number: 14,
        };
        const getRequest: IQNodeRequest = new QNodeRequest({
            url: {
                protocol: 'http',
                full: BASE_URL + TEST_ENDPOINTS.numberGet.path,
                host: 'localhost',
            },
            body: {
                raw: '',
                json: {},
            },
            params: {
                number: '' + getBody.number,
            },
            headers: {},
            endpointMetadata: TEST_ENDPOINTS.numberGet,
        });

        const postBody = {
            number: 17,
        };
        const postRequest: IQNodeRequest = new QNodeRequest({
            url: {
                protocol: 'http',
                full: BASE_URL + TEST_ENDPOINTS.numberPost.path,
                host: 'localhost',
            },
            body: {
                raw: JSON.stringify(postBody),
                json: { ...postBody },
            },
            params: {},
            headers: {
                'content-type': 'application/json',
            },
            endpointMetadata: TEST_ENDPOINTS.numberPost,
        });

        //first get request, default (0) + input
        const getResponse: fetchResponse = await sendRequest(getRequest);
        expect(getResponse.body.number).toBe(getBody.number);

        //post request, set number
        const postResponse: fetchResponse = await sendRequest(postRequest);
        expect(postResponse.status).toBe(200);
        expect(postResponse.body.number).toBe(postBody.number);
        expect(postResponse.body.status).toBe('success');
        done();
    });

    it('should get, post, and get again to same endpoint path', async (done) => {
        //setup
        const getBody = {
            number: 12,
        };
        const getRequest: IQNodeRequest = new QNodeRequest({
            url: {
                protocol: 'http',
                full: BASE_URL + TEST_ENDPOINTS.numberGet.path,
                host: 'localhost',
            },
            body: {
                raw: '',
                json: {},
            },
            params: {
                number: '' + getBody.number,
            },
            headers: {},
            endpointMetadata: TEST_ENDPOINTS.numberGet,
        });

        const postBody = {
            number: 17,
        };
        const postRequest: IQNodeRequest = new QNodeRequest({
            url: {
                protocol: 'http',
                full: BASE_URL + TEST_ENDPOINTS.numberPost.path,
                host: 'localhost',
            },
            body: {
                raw: JSON.stringify(postBody),
                json: { ...postBody },
            },
            params: {},
            headers: {
                'content-type': 'application/json',
            },
            endpointMetadata: TEST_ENDPOINTS.numberPost,
        });

        //first get request, default (0) + input
        const getOneResponse: fetchResponse = await sendRequest(getRequest);
        expect(getOneResponse.body.number).toBe(getBody.number);

        //post request, set number
        const postResponse: fetchResponse = await sendRequest(postRequest);
        expect(postResponse.status).toBe(200);
        expect(postResponse.body.number).toBe(postBody.number);
        expect(postResponse.body.status).toBe('success');

        //second get request, post number + input
        const getTwoResponse: fetchResponse = await sendRequest(getRequest);
        expect(getTwoResponse.body.number).toBe(
            getBody.number + postBody.number
        );
        done();
    });

    it('should give error when an attempt to define a duplicate endpoint is made', () => {
        try {
            //This should throw error upon instantiation
            class DuplicateEndpointServer extends QNodeServerBase {
                @Endpoint(TEST_ENDPOINTS.randomColor)
                private async one(): Promise<IQNodeResponse> {
                    return {
                        statusCode: 200,
                        body: true,
                    };
                }

                @Endpoint(TEST_ENDPOINTS.randomColor)
                private async two(): Promise<IQNodeResponse> {
                    return {
                        statusCode: 200,
                        body: true,
                    };
                }
            }
            expect(false).toBe(true);
        } catch (err) {
            expect(true).toBe(true);
        }
    });

    it('should catch error on throw default error test endpoint and return 500 code', async (done) => {
        const request: IQNodeRequest = new QNodeRequest({
            url: {
                protocol: 'http',
                full: BASE_URL + TEST_ENDPOINTS.defaultErrorGet.path,
                host: 'localhost',
            },
            params: {},
            body: {
                raw: '{}',
                json: {},
            },
            headers: {
                'content-type': 'application/json',
            },
            endpointMetadata: TEST_ENDPOINTS.defaultErrorGet,
        });
        const response: fetchResponse = await sendRequest(request);
        expect(response.status).toBe(500);
        done();
    });

    it('should catch error with error handler', async (done) => {
        const request: IQNodeRequest = new QNodeRequest({
            url: {
                protocol: 'http',
                full: BASE_URL + TEST_ENDPOINTS.errorHandlerGet.path,
                host: 'localhost',
            },
            params: {},
            body: {
                raw: '{}',
                json: {},
            },
            headers: {
                'content-type': 'application/json',
            },
            endpointMetadata: TEST_ENDPOINTS.errorHandlerGet,
        });
        const response: fetchResponse = await sendRequest(request);
        expect(response.status).toBe(403);
        done();
    });

    it('should execute single throwError middleware', async (done) => {
        const request: IQNodeRequest = new QNodeRequest({
            url: {
                protocol: 'http',
                full: BASE_URL + TEST_ENDPOINTS.middlewareThrowError.path,
                host: 'localhost',
            },
            params: {},
            body: {
                raw: '{}',
                json: {},
            },
            headers: {
                'content-type': 'application/json',
            },
            endpointMetadata: TEST_ENDPOINTS.middlewareThrowError,
        });
        const response: fetchResponse = await sendRequest(request);
        expect(response.status).toBe(500);
        done();
    });

    it('should execute single nextError middleware where error object is provided to "next"', async (done) => {
        const request: IQNodeRequest = new QNodeRequest({
            url: {
                protocol: 'http',
                full: BASE_URL + TEST_ENDPOINTS.middlewareNextError.path,
                host: 'localhost',
            },
            params: {},
            body: {
                raw: '{}',
                json: {},
            },
            headers: {
                'content-type': 'application/json',
            },
            endpointMetadata: TEST_ENDPOINTS.middlewareNextError,
        });
        const response: fetchResponse = await sendRequest(request);
        expect(response.status).toBe(500);
        done();
    });

    it('should update response object if middleware changes values', async (done) => {
        const request: IQNodeRequest = new QNodeRequest({
            url: {
                protocol: 'http',
                full: BASE_URL + TEST_ENDPOINTS.middlewareResponseAppendKey.path,
                host: 'localhost',
            },
            params: {},
            body: {
                raw: '{}',
                json: {},
            },
            headers: {
                'content-type': 'application/json',
            },
            endpointMetadata: TEST_ENDPOINTS.middlewareResponseAppendKey,
        });
        const response: fetchResponse = await sendRequest(request);
        expect(response.status).toBe(200);
        expect(response.body.newNumber).toBeDefined();
        done();
    });

}
