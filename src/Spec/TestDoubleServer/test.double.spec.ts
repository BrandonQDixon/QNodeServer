import {QNodeServerBase} from "../../QNodeServer/QNodeServerBase";
import {IQNodeResponse} from "../../Models/IQNodeResponse";
import {Endpoint} from "../../QNodeServer/EndpointDecorator";
import {TestDoublePlugin} from "../../ServerPlugins/TestDouble/TestDoublePlugin";
import {IQNodeRequest} from "../../Models/IQNodeRequest";

const TEST_ENDPOINTS = {
    randomColor: {
        path: "/randomColor",
        verb: "get",
        contentType: [{
            type: 'application/json'
        }]
    }
};

class TestServer extends QNodeServerBase {

    @Endpoint(TEST_ENDPOINTS.randomColor)
    private async getRandomColor(): Promise<IQNodeResponse> {
        const colors = ["green", "red", "blue"];
        const selectedColorIndex = Math.floor(Math.random() * colors.length);
        return {
            statusCode: 200,
            body: {
                color: colors[selectedColorIndex]
            }
        };
    }

}

describe('basic server test with test double server', () => {

    let server: TestServer;
    let testDoublePlugin: TestDoublePlugin;

    beforeEach(() => {
        testDoublePlugin = new TestDoublePlugin();
        server = new TestServer(testDoublePlugin, 123456);
        server.initialize();
    });

    it('should execute getRandomColor when endpoint is manually triggered', async (done) => {
        const testRequest: IQNodeRequest = {
            url: {
                protocol: "https",
                base: "test",
                full: "https://test" + TEST_ENDPOINTS.randomColor.path,
                host: "test"
            },
            body: {
                raw: ""
            },
            headers: {},
            endpointMetadata: TEST_ENDPOINTS.randomColor
        };

        const response: IQNodeResponse = await testDoublePlugin.testEndpoint(TEST_ENDPOINTS.randomColor.verb, TEST_ENDPOINTS.randomColor.path, testRequest);

        expect(response.body).toBeTruthy();
        expect(typeof response.body.color === "string").toBe(true);
        done();
    });

});