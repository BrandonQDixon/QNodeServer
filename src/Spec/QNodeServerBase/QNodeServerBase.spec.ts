/**
 * Tests related to QNodeServerBase
 */
import { TestDoublePlugin } from '../../ServerPlugins/TestDouble/TestDoublePlugin';
import { DEFINE_COMMON_TEST_CASES, TestServer } from '../CommonTestCases';
import { IQNodeRequest, IQNodeResponse } from '../..';

describe('basic server test with test double server', () => {
    let server: TestServer;
    let testDoublePlugin: TestDoublePlugin;

    beforeEach(async (done) => {
        testDoublePlugin = new TestDoublePlugin(false);
        server = new TestServer(testDoublePlugin, 123456);
        await server.initialize();
        done();
    });

    afterEach(async (done) => {
        await server.stop();
        done();
    });

    DEFINE_COMMON_TEST_CASES(it, (request: IQNodeRequest) => {
        return testDoublePlugin
            .testEndpoint(
                request.endpointMetadata.verb,
                request.endpointMetadata.path,
                request
            )
            .then((response: IQNodeResponse) => {
                return {
                    status: response.statusCode,
                    body: response.body,
                };
            });
    });
});
