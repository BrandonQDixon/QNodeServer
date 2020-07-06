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
exports.Endpoint = exports.QNodeServerBase = void 0;
const MimeTypes_1 = require("../Constants/MimeTypes");
/**
 * This is the base class which a server instance will subclass
 * This handles lower level functionality for setting up the server based on the provided plugin and defined endpoints
 */
class QNodeServerBase {
    /**
     * Setup the server with the appropriate plugin and server settings
     * @param serverPlugin
     * @param port
     */
    constructor(serverPlugin, port) {
        this.serverPlugin = serverPlugin;
        this.port = port;
    }
    /**
     * Readonly variable to get server endpoints
     */
    get endpoints() {
        return this._endpoints;
    }
    /**
     * Callback template for action to be taken immediately upon server initialization
     */
    onServerInit() { }
    /**
     * Callback template for action to be taken immediately before an endpoint is triggered after the request comes in
     * @param endpoint
     * @param request
     */
    beforeEndpointTriggered(endpoint, request) { }
    /**
     * Callback template for action to be taken immediately after and endpoint is triggered
     * @param endpoint
     * @param request
     * @param response
     */
    afterEndpointTriggered(endpoint, request, response) { }
    /**
     * Start the server
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this._endpoints = this._endpoints || [];
            for (let i = 0; i < this._endpoints.length; i++) {
                const endpoint = this._endpoints[i];
                yield this.serverPlugin.createEndpoint(endpoint.metadata, (rawRequest) => this.executeEndpoint(endpoint, rawRequest));
            }
            yield this.serverPlugin.startServer(this.port);
            this.onServerInit();
        });
    }
    stop() {
        this.serverPlugin.stopServer();
    }
    /**
     * Triggered by endpoint decorator to register as an endpoint
     * @param endpointMetadata
     * @param callbackMethod
     */
    registerEndpointFromDecorator(endpointMetadata, callbackMethod) {
        this._endpoints = this._endpoints || [];
        if (this.endpoints.find((searchEndpoint) => QNodeServerBase.endpointsEqual(searchEndpoint.metadata, endpointMetadata))) {
            throw new Error(`Error in endpoint register: endpoint already exists with ${endpointMetadata.verb} => ${endpointMetadata.path}`);
        }
        this._endpoints.push({
            metadata: endpointMetadata,
            callback: callbackMethod,
        });
    }
    /**
     * This will be called by the plugin when its endpoint is triggered
     * @param request
     */
    triggerEndpoint(request) {
        const endpoint = this.findOwnEndpointFromRequest(request);
        if (!endpoint) {
            throw new Error(`Error when triggering endpoint, none found matching metadata: ${request.endpointMetadata.verb} => ${request.endpointMetadata.path}`);
        }
        return endpoint.callback.call(this, request);
    }
    /**
     * Callback from server plugin
     * @param endpoint
     * @param rawRequest
     */
    executeEndpoint(endpoint, rawRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const mappedRequest = yield this.serverPlugin.mapRequest(rawRequest);
            if (endpoint.metadata.contentType.find((ct) => ct.type === MimeTypes_1.MIME_TYPES.ApplicationJson)) {
                let bodyRaw = mappedRequest.body.raw;
                if (bodyRaw.length === 0) {
                    bodyRaw = '{}';
                }
                mappedRequest.body.json = JSON.parse(bodyRaw);
            }
            mappedRequest.endpointMetadata.verb = mappedRequest.endpointMetadata.verb.toLowerCase();
            const mappedRequestClone = JSON.parse(JSON.stringify(mappedRequest));
            yield this.beforeEndpointTriggered(endpoint.metadata, mappedRequestClone);
            const response = yield this.triggerEndpoint(mappedRequestClone);
            let stringBody = '';
            if (endpoint.metadata.contentType.find((ct) => ct.type === MimeTypes_1.MIME_TYPES.ApplicationJson)) {
                stringBody = JSON.stringify(response.body);
            }
            else if (typeof response.body !== 'string') {
                stringBody = response.body.toString();
            }
            response.stringBody = stringBody;
            yield this.afterEndpointTriggered(endpoint.metadata, mappedRequestClone, response);
            return response;
        });
    }
    /**
     * Find our own endpoint based on a requests' endpoint metadata
     * @param request
     */
    findOwnEndpointFromRequest(request) {
        return this.endpoints.find((item) => QNodeServerBase.endpointsEqual(request.endpointMetadata, item.metadata));
    }
    /**
     * Determine if two endpoints should be considered equal;
     * @param a
     * @param b
     */
    static endpointsEqual(a, b) {
        return a.path === b.path && a.verb === b.verb;
    }
    /**
     * Decorate a method call in a class which extends QNodeServerBase to declare it as an endpoint
     * @param endpointMetadata
     * @constructor
     */
    static Endpoint(endpointMetadata) {
        endpointMetadata.verb = endpointMetadata.verb.toLowerCase();
        return function (target, propertyKey, descriptor) {
            descriptor.enumerable = true;
            target.registerEndpointFromDecorator.call(target, endpointMetadata, descriptor.value);
        };
    }
}
exports.QNodeServerBase = QNodeServerBase;
/**
 * Decorate a method call in a class which extends QNodeServerBase to declare it as an endpoint
 * @param endpointMetadata
 * @constructor
 */
exports.Endpoint = QNodeServerBase.Endpoint;
