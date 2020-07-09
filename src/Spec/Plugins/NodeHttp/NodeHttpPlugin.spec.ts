import {
    BASE_URL,
    DEFINE_COMMON_TEST_CASES, fetchResponse,
    TEST_PORT,
    TestServer,
} from '../../CommonTestCases';

const fetch = require('node-fetch');

/**
 * Tests related to NodeHttpPlugin
 */
import { NodeHttpPlugin } from '../../../ServerPlugins/NodeHttp/NodeHttpPlugin';
import { IQNodeRequest } from '../../..';

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

    DEFINE_COMMON_TEST_CASES(it, (request: IQNodeRequest): Promise<fetchResponse> => {
        const mapResponse = async (response) => {
            let body = '';
            try {
                body = await response.json();
            } catch (err) {
                console.error("Error parsing json response body in http plugin test case", body, err);
            }
            return {
                status: response.status,
                body
            }
        }

        if (request.endpointMetadata.verb === 'get') {
            return fetch(request.url.full, {
                method: request.endpointMetadata.verb,
                headers: request.headers || {},
            }).then(mapResponse);
        }
        return fetch(request.url.full, {
            method: request.endpointMetadata.verb,
            headers: request.headers || {},
            body: request.body.raw,
        }).then(mapResponse);
    });
});
