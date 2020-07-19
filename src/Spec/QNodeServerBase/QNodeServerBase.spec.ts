/**
 * Tests related to QNodeServerBase
 */
import {DEFINE_COMMON_TEST_CASES, TestServer} from "../CommonTestCases";
import {IQNodeRequest, IQNodeResponse, TestDoublePlugin} from "../..";

describe('basic server test with test double server', () => {
    let server: TestServer;
    let testDoublePlugin: TestDoublePlugin;

    beforeEach(async (done) => {
        testDoublePlugin = new TestDoublePlugin();
        server = new TestServer(testDoublePlugin, '123456');
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
                request.endpointMetadata.route.path,
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
