import {
    DEFINE_COMMON_TEST_CASES,
    fetchResponse,
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

    DEFINE_COMMON_TEST_CASES(
        it,
        (request: IQNodeRequest): Promise<fetchResponse> => {
            const mapResponse = async (response) => {
                let body = await response.text();
                try {
                    body = JSON.parse(body);
                } catch (err) {
                    console.warn(
                        'Error parsing json response body in http plugin test case',
                        { body },
                        err
                    );
                    body = {};
                }
                return {
                    status: response.status,
                    body,
                };
            };

            const handleError = (err) => {
                throw new Error(
                    'Error in NodeHttpPlugin spec for url ' +
                        request.url.full +
                        ' : ' +
                        err
                );
            };

            if (request.endpointMetadata.verb === 'get') {
                return fetch(request.url.full, {
                    method: request.endpointMetadata.verb,
                    headers: request.headers || {},
                })
                    .then(mapResponse)
                    .catch(handleError);
            }
            return fetch(request.url.full, {
                method: request.endpointMetadata.verb,
                headers: request.headers || {},
                body: request.body.raw,
            })
                .then(mapResponse)
                .catch(handleError);
        }
    );
});
