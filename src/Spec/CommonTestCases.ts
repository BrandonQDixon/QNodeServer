import fetch from 'node-fetch';
import {Endpoint, IQNodeRequest, IQNodeResponse, QNodeRequest, QNodeRoute, QNodeServerBase, QNodeUrl} from "..";

export type fetchResponse = {
    status: number;
    body: any;
};

export const TEST_PORT = '65334';

const TEST_MIDDLEWARE /*: {[key: string]: IQNodeMiddleware}*/ = {
    throwError: async (
        request: IQNodeRequest,
        response: IQNodeResponse,
        carryValue: any,
        next
    ) => {
        throw new Error('Test middleware throw error');
    },
    nextError: async (
        request: IQNodeRequest,
        response: IQNodeResponse,
        carryValue: any,
        next
    ) => {
        next(new Error('Test middleware throw error in next'));
    },
    appendKeyToRequest: async (
        request: IQNodeRequest,
        response: IQNodeResponse,
        carryValue: any,
        next
    ) => {
        request.body.json.newNumber = 17;
        next({ request });
    },
    appendKeyToResponse: async (
        request: IQNodeRequest,
        response: IQNodeResponse,
        carryValue: any,
        next
    ) => {
        response.body.newNumber = 17;
        next({ response });
    },
};

const TEST_ENDPOINTS /*: { [key: string]: IQNodeEndpoint }*/ = {
    randomColor: {
        route: new QNodeRoute('/randomColor'),
        verb: 'get',
        contentType: [
            {
                type: 'application/json',
            },
        ],
    },
    numberGet: {
        route: new QNodeRoute('/number'),
        verb: 'get',
        contentType: [
            {
                type: 'application/json',
            },
        ],
    },
    numberPost: {
        route: new QNodeRoute('/number'),
        verb: 'post',
        contentType: [
            {
                type: 'application/json',
            },
        ],
    },
    defaultErrorGet: {
        route: new QNodeRoute('/defaultError'),
        verb: 'get',
        contentType: [
            {
                type: 'application/json',
            },
        ],
    },
    errorHandlerGet: {
        route: new QNodeRoute('/errorHandler'),
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
        route: new QNodeRoute('/middlewareThrowError'),
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
        route: new QNodeRoute('/middlewareNextError'),
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
        route: new QNodeRoute('/middlewareRequestAppendKey'),
        verb: 'get',
        middleware: [TEST_MIDDLEWARE.appendKeyToRequest],
        contentType: [
            {
                type: 'application/json',
            },
        ],
    },
    middlewareResponseAppendKey: {
        route: new QNodeRoute('/middlewareResponseAppendKey'),
        verb: 'get',
        middleware: [TEST_MIDDLEWARE.appendKeyToResponse],
        contentType: [
            {
                type: 'application/json',
            },
        ],
    },
    middlewareRequestResponseAppendKey: {
        route: new QNodeRoute('/middlewareRequestResponseAppendKey'),
        verb: 'get',
        middleware: [
            TEST_MIDDLEWARE.appendKeyToRequest,
            TEST_MIDDLEWARE.appendKeyToResponse,
        ],
        contentType: [
            {
                type: 'application/json',
            },
        ],
    },
    routeParam: {
        route: new QNodeRoute('/route/:path'),
        verb: 'get',
        middleware: [],
        contentType: [
            {
                type: 'application/json',
            },
        ],
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
                    this.numberFromPost + parseInt(request.query.number + ''),
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
    private async middlewareRequestAppendKey(
        request: IQNodeRequest,
        response: IQNodeResponse,
        middlewareCarryValue: any
    ) {
        return {
            statusCode: 200,
            body: {},
        };
    }

    @Endpoint(TEST_ENDPOINTS.middlewareResponseAppendKey)
    private async middlewareResponseAppendKey(
        request: IQNodeRequest,
        response: IQNodeResponse,
        middlewareCarryValue: any
    ) {
        return {
            statusCode: 200,
            body: response.body,
        };
    }

    @Endpoint(TEST_ENDPOINTS.middlewareRequestResponseAppendKey)
    private async middlewareRequestResponseAppendKey(
        request: IQNodeRequest,
        response: IQNodeResponse,
        middlewareCarryValue: any
    ) {
        return {
            statusCode: 200,
            body: response.body,
        };
    }

    @Endpoint(TEST_ENDPOINTS.routeParam)
    private async routeParam(
        request: IQNodeRequest
    ) {
        return {
            statusCode: 200,
            body: {
                path: request.params.path
            }
        };
    }
}

export function DEFINE_COMMON_TEST_CASES(
    it,
    sendRequest: (request: IQNodeRequest) => Promise<fetchResponse>
) {
    it('should execute getRandomColor when endpoint is triggered', async (done) => {
        const testRequest: IQNodeRequest = new QNodeRequest({
            url: new QNodeUrl({
                protocol: 'http',
                port: TEST_PORT,
                host: 'localhost',
                path: TEST_ENDPOINTS.randomColor.route.path,
                query: ""
            }),
            query: {},
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
            url: new QNodeUrl({
                protocol: 'http',
                port: TEST_PORT,
                host: 'localhost',
                path: TEST_ENDPOINTS.numberPost.route.path,
                query: ""
            }),
            query: {},
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
            url: new QNodeUrl({
                protocol: 'http',
                host: 'localhost',
                port: TEST_PORT,
                path:  TEST_ENDPOINTS.numberGet.route.path,
                query: "?number="+getBody.number
            }),
            query: {},
            body: {
                raw: '',
                json: {},
            },
            params: {},
            headers: {},
            endpointMetadata: TEST_ENDPOINTS.numberGet,
        });

        const postBody = {
            number: 17,
        };
        const postRequest: IQNodeRequest = new QNodeRequest({
            url: new QNodeUrl({
                protocol: 'http',
                port: TEST_PORT,
                host: 'localhost',
                path: TEST_ENDPOINTS.numberPost.route.path,
                query: ""
            }),
            query: {},
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
            url: new QNodeUrl({
                protocol: 'http',
                host: 'localhost',
                path: TEST_ENDPOINTS.numberGet.route.path,
                query: "?number="+getBody.number,
                port: TEST_PORT,
            }),
            query: {},
            body: {
                raw: '',
                json: {},
            },
            params: {},
            headers: {},
            endpointMetadata: TEST_ENDPOINTS.numberGet,
        });

        const postBody = {
            number: 17,
        };
        const postRequest: IQNodeRequest = new QNodeRequest({
            url: new QNodeUrl({
                protocol: 'http',
                port: TEST_PORT,
                host: 'localhost',
                path: TEST_ENDPOINTS.numberPost.route.path,
                query: ""
            }),
            query: {},
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
            url: new QNodeUrl({
                protocol: 'http',
                port: TEST_PORT,
                host: 'localhost',
                path: TEST_ENDPOINTS.defaultErrorGet.route.path,
                query: ""
            }),
            query: {},
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
            url: new QNodeUrl({
                protocol: 'http',
                port: TEST_PORT,
                host: 'localhost',
                path: TEST_ENDPOINTS.errorHandlerGet.route.path,
                query: ""
            }),
            query: {},
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
            url: new QNodeUrl({
                protocol: 'http',
                port: TEST_PORT,
                host: 'localhost',
                path: TEST_ENDPOINTS.middlewareThrowError.route.path,
                query: ""
            }),
            query: {},
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
            url: new QNodeUrl({
                protocol: 'http',
                port: TEST_PORT,
                host: 'localhost',
                path: TEST_ENDPOINTS.middlewareNextError.route.path,
                query: ""
            }),
            query: {},
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
            url: new QNodeUrl({
                protocol: 'http',
                port: TEST_PORT,
                host: 'localhost',
                path: TEST_ENDPOINTS.middlewareResponseAppendKey.route.path,
                query: ""
            }),
            query: {},
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

    it('should route a path based on path params (:path) in url', async (done) => {
        const TESTS = ['location', 'blue', 'green', 'test'];
        for (let i=0; i<TESTS.length; i++) {
            const test = TESTS[i];
            const request: IQNodeRequest = new QNodeRequest({
                url: new QNodeUrl({
                    protocol: 'http',
                    port: TEST_PORT,
                    host: 'localhost',
                    path: TEST_ENDPOINTS.routeParam.route.path.replace(":path", test),
                    query: ""
                }),
                query: {},
                params: {},
                body: {
                    raw: '{}',
                    json: {},
                },
                headers: {
                    'content-type': 'application/json',
                },
                endpointMetadata: TEST_ENDPOINTS.routeParam,
            });
            const response: fetchResponse = await sendRequest(request);
            expect(response.status).toBe(200);
            expect(response.body.path).toBe(test);
        }
        done();
    });
}
