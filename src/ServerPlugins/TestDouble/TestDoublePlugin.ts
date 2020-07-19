import { IQServerPlugin } from '../../Models/IQServerPlugin';
import { IQNodeEndpoint } from '../../Models/IQNodeEndpoint';
import { IQNodeRequest } from '../../Models/IQNodeRequest';
import { IQNodeResponse } from '../../Models/IQNodeResponse';
import { JSON_OBJECT } from '../../Models/IJson';
import { QNodeRequest } from '../..';
import { CloneInputObj } from '../../Util/Object/CloneObject';

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
    private serverIsOn = false;

    constructor() {}

    async createEndpoint(
        endpoint: IQNodeEndpoint,
        endpointTriggeredCallback: (rawRequest: any) => any
    ) {
        if (!endpoint.verb || !endpoint.route.path) {
            throw new Error(
                `Error in creating endpoint for TestDouble: verb / path input is falsey: verb: ${endpoint.verb} => path: ${endpoint.route.path}`
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
        @CloneInputObj rawRequest: IQNodeRequest<JSON_OBJECT>
    ): Promise<IQNodeResponse> {
        if (!this.serverIsOn) {
            throw new Error(
                'Test endpoint was triggered without initializing the server!'
            );
        }

        const request = new QNodeRequest(rawRequest);

        const endpoint = this.endpoints.find(
            (route) =>
                route.metadata.verb === verb &&
                route.metadata.route.urlMatches(path)
        );
        if (!endpoint) {
            throw new Error(
                `Error in TestDoublePlugin: cannot test endpoint because it was not added (or is falsey): ${verb} => ${path}`
            );
        }

        let result: IQNodeResponse;
        try {
            result = await endpoint.callback(request);
        } catch (err) {
            throw new Error('test error: ' + err);
        }
        return result;
    }

    async mapRequest(rawRequest: IQNodeRequest): Promise<IQNodeRequest> {
        return rawRequest;
    }

    async startServer(port: string) {
        this.serverIsOn = true;
    }

    async stopServer() {
        this.serverIsOn = false;
    }
}
