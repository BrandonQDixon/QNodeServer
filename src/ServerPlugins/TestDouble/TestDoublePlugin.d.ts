import { IQServerPlugin } from '../../Models/IQServerPlugin';
import { IQNodeEndpoint } from '../../Models/IQNodeEndpoint';
import { IQNodeRequest } from '../../Models/IQNodeRequest';
import { IQNodeResponse } from '../../Models/IQNodeResponse';
import { JSON_OBJECT } from '../../Models/IJson';
/**
 * Test double
 * Useful for testing servers without actually creating server instances
 */
export declare class TestDoublePlugin implements IQServerPlugin {
    private doLog;
    private endpoints;
    constructor(doLog?: boolean);
    private consoleOut;
    createEndpoint(endpoint: IQNodeEndpoint, endpointTriggeredCallback: (rawRequest: any) => any): Promise<void>;
    /**
     * Test helper for testing an endpoint
     * This will directly return the endpoint's response, but the tester should also validate the response is sent in the normal flow as well
     */
    testEndpoint(verb: string, path: string, rawRequest: IQNodeRequest<JSON_OBJECT>): Promise<IQNodeResponse>;
    mapRequest(rawRequest: IQNodeRequest): Promise<IQNodeRequest>;
    startServer(port: number): Promise<void>;
    stopServer(): Promise<void>;
}
