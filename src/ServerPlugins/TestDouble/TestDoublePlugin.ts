import { IQServerPlugin } from '../../Models/IQServerPlugin';
import { IQNodeEndpoint } from '../../Models/IQNodeEndpoint';
import { IQNodeRequest } from '../../Models/IQNodeRequest';
import { IQNodeResponse } from '../../Models/IQNodeResponse';
import { JSON_OBJECT } from '../../Models/IJson';

interface ICallableEndpoint {
    metadata: IQNodeEndpoint;
    callback: Function;
}

/**
 * Test double
 * Useful for testing servers without actually creating server instances
 */
export class TestDoublePlugin implements IQServerPlugin {
    private endpoints: Array<ICallableEndpoint> = [];

    constructor(private doLog: boolean = false) {}

    private consoleOut(...args: Array<any>): void {
        if (this.doLog) {
            console.log('TestDoublePlugin ==> ', ...args);
        }
    }

    async createEndpoint(
        endpoint: IQNodeEndpoint,
        endpointTriggeredCallback: (rawRequest: any) => any
    ) {
        this.consoleOut('Creating endpoint: ', endpoint);

        if (!endpoint.verb || !endpoint.path) {
            throw new Error(
                `Error in creating endpoint for TestDouble: verb / path input is falsey: verb: ${endpoint.verb} => path: ${endpoint.path}`
            );
        }

        this.endpoints.push({
            metadata: endpoint,
            callback: endpointTriggeredCallback,
        });
    }

    /**
     * Test helper for testing an endpoint
     * This will directly return the endpoint's response, but the tester should also validate the response is sent in the normal flow as well
     */
    async testEndpoint(
        verb: string,
        path: string,
        rawRequest: IQNodeRequest<JSON_OBJECT>
    ): Promise<IQNodeResponse> {
        this.consoleOut('Testing endpoint: ', verb, path);

        const endpoint = this.endpoints.find(
            (route) =>
                route.metadata.verb === verb && route.metadata.path === path
        );
        if (!endpoint) {
            throw new Error(
                `Error in TestDoublePlugin: cannot test endpoint because it was not added (or is falsey): ${verb} => ${path}`
            );
        }

        let result: IQNodeResponse;
        try {
            result = await endpoint.callback(rawRequest);
        } catch (err) {
            throw new Error('test error: ' + err);
        }
        return result;
    }

    async mapRequest(rawRequest: IQNodeRequest): Promise<IQNodeRequest> {
        return rawRequest;
    }

    async startServer(port: number) {
        //stub, since this is not a real server
    }

    async stopServer() {
        //stub, since this is not a real server
    }
}
