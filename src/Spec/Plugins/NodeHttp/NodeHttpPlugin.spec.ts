const fetch = require('node-fetch');

/**
 * Tests related to NodeHttpPlugin
 */
import {
    Endpoint,
    QNodeServerBase,
} from '../../../QNodeServer/QNodeServerBase';
import { IQNodeResponse } from '../../../Models/IQNodeResponse';
import { IQNodeRequest } from '../../../Models/IQNodeRequest';
import { NodeHttpPlugin } from '../../../ServerPlugins/NodeHttp/NodeHttpPlugin';

const TEST_PORT = 65334;
const BASE_URL = `http://localhost:${TEST_PORT}`;

const TEST_ENDPOINTS = {
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
                body: {}
            }
        }
    }
};

class TestServer extends QNodeServerBase {
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
                number: this.numberFromPost + request.body.json.number,
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
    private async throwDefaultError(request: IQNodeRequest): Promise<IQNodeResponse> {
        throw new Error("Default error test endpoint");
    }

    @Endpoint(TEST_ENDPOINTS.errorHandlerGet)
    private async errorHandler(request: IQNodeRequest): Promise<IQNodeResponse> {
        throw new Error("Error handler test endpoint");
    }
}

describe('basic server test with test double server', () => {
    let server: TestServer;
    let nodeHttpPlugin: NodeHttpPlugin;

    beforeEach(async (done) => {
        nodeHttpPlugin = new NodeHttpPlugin();
        server = new TestServer(nodeHttpPlugin, TEST_PORT);
        await server.initialize();
        done();
    });

    afterEach(async (done) => {
        await server.stop();
        done();
    });

    it('should catch error on throw default error test endpoint and return 500 code', async (done) => {
        const response = await fetch(BASE_URL + TEST_ENDPOINTS.defaultErrorGet.path);
        expect(response.status).toBe(500);
        done();
    });

    it('should catch error with error handler', async (done) => {
        const response = await fetch(BASE_URL + TEST_ENDPOINTS.errorHandlerGet.path);
        expect(response.status).toBe(403);
        done();
    });

    it('should execute getRandomColor when endpoint is triggered', async (done) => {
        const response = await fetch(BASE_URL + TEST_ENDPOINTS.randomColor.path).then((r) =>
            r.json()
        );

        expect(response).toBeTruthy();
        expect(typeof response.color === 'string').toBe(true);
        done();
    });
});
