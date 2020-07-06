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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeHttpPlugin = void 0;
const http_1 = __importDefault(require("http"));
/**
 * Plugin for Node.js default HTTP API
 */
class NodeHttpPlugin {
    constructor() {
        this.endpointRoutes = [];
    }
    createEndpoint(endpoint, endpointTriggeredCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            const newEndpoint = {
                metadata: endpoint,
                callback: (rawRequest) => {
                    return endpointTriggeredCallback(rawRequest);
                },
            };
            this.endpointRoutes.push(newEndpoint);
            this.endpointRoutes.sort((a, b) => {
                return b.metadata.path.localeCompare(a.metadata.path);
            });
        });
    }
    mapRequest(rawRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            let rawBody = yield new Promise((resolve, reject) => {
                const data = [];
                rawRequest.on('data', (chunk) => {
                    data.push(chunk);
                });
                rawRequest.on('end', () => {
                    resolve(Buffer.from(data).toString());
                });
            });
            const request = {
                url: {
                    protocol: rawRequest.protocol,
                    host: rawRequest.host,
                    full: rawRequest.protocol +
                        '://' +
                        rawRequest.host +
                        rawRequest.url,
                },
                body: {
                    raw: rawBody,
                },
                headers: rawRequest.headers,
                endpointMetadata: {
                    verb: rawRequest.method,
                    path: rawRequest.url,
                },
            };
            return request;
        });
    }
    startServer(port) {
        return __awaiter(this, void 0, void 0, function* () {
            this.serverInstance = http_1.default.createServer(this.getRequestHandler());
            this.serverInstance.listen(port);
        });
    }
    stopServer() {
        return __awaiter(this, void 0, void 0, function* () {
            this.serverInstance && this.serverInstance.close();
        });
    }
    getRequestHandler() {
        return (rawRequest, rawResponse) => __awaiter(this, void 0, void 0, function* () {
            const foundEndpoint = this.getRequestEndpoint(rawRequest);
            if (!foundEndpoint) {
                throw new Error(`Error in NodeHttpPlugin: endpoint callback was falsey for: ${rawRequest.method} ==> ${rawRequest.url}`);
            }
            const result = yield foundEndpoint.callback(rawRequest);
            //rawResponse.status(result.statusCode).send(result.body);
            rawResponse.statusCode = result.statusCode;
            rawResponse.write(Buffer.from(result.stringBody));
            rawResponse.end();
        });
    }
    getRequestEndpoint(request) {
        return this.endpointRoutes.find((route) => {
            const path = route.metadata.path;
            return (request.url.indexOf(path) === 0 &&
                request.method.toLowerCase() === route.metadata.verb);
        });
    }
}
exports.NodeHttpPlugin = NodeHttpPlugin;
