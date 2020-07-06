"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestDoublePlugin = void 0;
/**
 * Test double
 * Useful for testing servers without actually creating server instances
 */
class TestDoublePlugin {
    constructor(doLog = false) {
        this.doLog = doLog;
        this.endpoints = [];
    }
    consoleOut(...args) {
        if (this.doLog) {
            console.log('TestDoublePlugin ==> ', ...args);
        }
    }
    createEndpoint(endpoint, endpointTriggeredCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            this.consoleOut('Creating endpoint: ', endpoint);
            this.endpoints.push({
                metadata: endpoint,
                callback: endpointTriggeredCallback,
            });
        });
    }
    /**
     * Test helper for testing an endpoint
     * This will directly return the endpoint's response, but the tester should also validate the response is sent in the normal flow as well
     */
    testEndpoint(verb, path, rawRequest) {
        this.consoleOut('Testing endpoint: ', verb, path);
        const endpoint = this.endpoints.find((route) => route.metadata.verb === verb && route.metadata.path === path);
        if (!endpoint) {
            throw new Error(`Error in TestDoublePlugin: cannot test endpoint because it was not added (or is falsey): ${verb} => ${path}`);
        }
        return endpoint.callback(rawRequest);
    }
    mapRequest(rawRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            return rawRequest;
        });
    }
    startServer(port) {
        return __awaiter(this, void 0, void 0, function* () {
            //stub, since this is not a real server
        });
    }
    stopServer() {
        return __awaiter(this, void 0, void 0, function* () {
            //stub, since this is not a real server
        });
    }
}
exports.TestDoublePlugin = TestDoublePlugin;
