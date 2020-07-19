import {
    IQNodeEndpoint,
    IQNodeEndpointParams,
    IQNodeRequest,
    MIME_TYPES,
    QNodeRequest,
    QNodeRoute, QNodeUrl,
    TestDoublePlugin
} from "../../..";
import {TEST_PORT} from "../../CommonTestCases";

describe('test double plugin', () => {

    let plugin: TestDoublePlugin;

    beforeEach(async () => {
        plugin = new TestDoublePlugin();
        await plugin.startServer(TEST_PORT);
    });

    afterEach(async () => {
        await plugin.stopServer();
    })

    it('should create endpoint and find based on route with params', async (done) => {

        interface ITestEndpoint extends IQNodeEndpoint {
            testRoute: string
        }

       const endpoints: Array<ITestEndpoint> = [{
           route: new QNodeRoute('/path'),
           testRoute: '/path',
           verb: 'get',
           middleware: [],
           contentType: [
               {
                   type: 'application/json',
               },
           ],
       }, {
           route: new QNodeRoute('/path/:something'),
           testRoute: '/path/purple',
           verb: 'get',
           middleware: [],
           contentType: [
               {
                   type: 'application/json',
               },
           ],
       }, {
           route: new QNodeRoute('/path/:something/:else'),
           testRoute: '/path/purple/green',
           verb: 'get',
           middleware: [],
           contentType: [
               {
                   type: 'application/json',
               },
           ],
       }];

       for (let i=0; i<endpoints.length; i++) {
           const endpoint = endpoints[i];
           await new Promise((resolve, reject) => {
               plugin.createEndpoint(endpoint, (request: IQNodeRequest) => {
                   expect(request.endpointMetadata.route.urlMatches(request.url.full));
                   resolve();
               });
               plugin.testEndpoint(endpoint.verb, endpoint.testRoute,new QNodeRequest({
                   url: new QNodeUrl({
                       protocol: 'http',
                       port: TEST_PORT,
                       host: 'localhost',
                       path: endpoint.testRoute,
                       query: ''
                   }),
                   query: {},
                   body: {
                       raw: JSON.stringify({}),
                       json: {},
                   },
                   params: {},
                   headers: {
                       'content-type': 'application/json',
                   },
                   endpointMetadata: endpoint,
               }))
           })
       }
       done();

    }, 500);

});