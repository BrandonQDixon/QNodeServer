"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
const fetch = require('node-fetch');
/**
 * Tests related to NodeHttpPlugin
 */
const QNodeServerBase_1 = require("../../../QNodeServer/QNodeServerBase");
const NodeHttpPlugin_1 = require("../../../ServerPlugins/NodeHttp/NodeHttpPlugin");
const TEST_PORT = 65335;
const BASE_URL = `http://localhost:${TEST_PORT}`;
const TEST_ENDPOINTS = {
    randomColor: {
        path: '/randomColor',
        verb: 'get',
        contentType: [
            {
                type: 'application/json',
            },
        ],
    },
    numberGet: {
        path: '/number',
        verb: 'get',
        contentType: [
            {
                type: 'application/json',
            },
        ],
    },
    numberPost: {
        path: '/number',
        verb: 'post',
        contentType: [
            {
                type: 'application/json',
            },
        ],
    },
};
class TestServer extends QNodeServerBase_1.QNodeServerBase {
    constructor() {
        super(...arguments);
        this.numberFromPost = 0;
    }
    getRandomColor() {
        return __awaiter(this, void 0, void 0, function* () {
            const colors = ['green', 'red', 'blue'];
            const selectedColorIndex = Math.floor(Math.random() * colors.length);
            return {
                statusCode: 200,
                body: {
                    color: colors[selectedColorIndex],
                },
            };
        });
    }
    getNumber(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                statusCode: 200,
                body: {
                    number: this.numberFromPost + request.body.json.number,
                },
            };
        });
    }
    setNumber(request) {
        return __awaiter(this, void 0, void 0, function* () {
            this.numberFromPost = request.body.json.number;
            return {
                statusCode: 200,
                body: {
                    number: this.numberFromPost,
                    status: 'success',
                },
            };
        });
    }
}
__decorate([
    QNodeServerBase_1.Endpoint(TEST_ENDPOINTS.randomColor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestServer.prototype, "getRandomColor", null);
__decorate([
    QNodeServerBase_1.Endpoint(TEST_ENDPOINTS.numberGet),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestServer.prototype, "getNumber", null);
__decorate([
    QNodeServerBase_1.Endpoint(TEST_ENDPOINTS.numberPost),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestServer.prototype, "setNumber", null);
describe('basic server test with test double server', () => {
    let server;
    let nodeHttpPlugin;
    beforeEach(() => {
        nodeHttpPlugin = new NodeHttpPlugin_1.NodeHttpPlugin();
        server = new TestServer(nodeHttpPlugin, TEST_PORT);
        server.initialize();
    });
    afterEach(() => {
        server.stop();
    });
    it('should execute getRandomColor when endpoint is triggered', (done) => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield fetch(BASE_URL + '/randomColor').then((r) => r.json());
        expect(response).toBeTruthy();
        expect(typeof response.color === 'string').toBe(true);
        done();
    }));
    /*it('should get and post to different endpoints with the same path', async (done) => {
        //setup
        const getBody = {
            number: 14,
        }
        const getRequest: IQNodeRequest = {
            url: {
                protocol: 'https',
                base: 'test',
                full: 'https://test' + TEST_ENDPOINTS.numberGet.path,
                host: 'test',
            },
            body: {
                raw: JSON.stringify(getBody),
                parsed: getBody,
            },
            headers: {},
            endpointMetadata: TEST_ENDPOINTS.numberGet,
        }

        const postBody = {
            number: 17,
        }
        const postRequest: IQNodeRequest = {
            url: {
                protocol: 'https',
                base: 'test',
                full: 'https://test' + TEST_ENDPOINTS.numberGet.path,
                host: 'test',
            },
            body: {
                raw: JSON.stringify(postBody),
                parsed: postBody,
            },
            headers: {
                ContentType: 'application/json',
            },
            endpointMetadata: TEST_ENDPOINTS.numberPost,
        }

        //first get request, default (0) + input
        const getResponse: IQNodeResponse = await testDoublePlugin.testEndpoint(
            TEST_ENDPOINTS.numberGet.verb,
            TEST_ENDPOINTS.numberGet.path,
            getRequest
        )
        expect(getResponse.body.number).toBe(getBody.number)

        //post request, set number
        const postResponse: IQNodeResponse = await testDoublePlugin.testEndpoint(
            TEST_ENDPOINTS.numberPost.verb,
            TEST_ENDPOINTS.numberPost.path,
            postRequest
        )
        expect(postResponse.body.number).toBe(postBody.number)
        expect(postResponse.body.status).toBe('success')
        done()
    })

    it('should get, post, and get again to same endpoint path', async (done) => {
        //setup
        const getBody = {
            number: 12,
        }
        const getRequest: IQNodeRequest = {
            url: {
                protocol: 'https',
                base: 'test',
                full: 'https://test' + TEST_ENDPOINTS.numberGet.path,
                host: 'test',
            },
            body: {
                raw: JSON.stringify(getBody),
                parsed: getBody,
            },
            headers: {},
            endpointMetadata: TEST_ENDPOINTS.numberGet,
        }

        const postBody = {
            number: 17,
        }
        const postRequest: IQNodeRequest = {
            url: {
                protocol: 'https',
                base: 'test',
                full: 'https://test' + TEST_ENDPOINTS.numberGet.path,
                host: 'test',
            },
            body: {
                raw: JSON.stringify(postBody),
                parsed: postBody,
            },
            headers: {
                ContentType: 'application/json',
            },
            endpointMetadata: TEST_ENDPOINTS.numberPost,
        }

        //first get request, default (0) + input
        const getOneResponse: IQNodeResponse = await testDoublePlugin.testEndpoint(
            TEST_ENDPOINTS.numberGet.verb,
            TEST_ENDPOINTS.numberGet.path,
            getRequest
        )
        expect(getOneResponse.body.number).toBe(getBody.number)

        //post request, set number
        const postResponse: IQNodeResponse = await testDoublePlugin.testEndpoint(
            TEST_ENDPOINTS.numberPost.verb,
            TEST_ENDPOINTS.numberPost.path,
            postRequest
        )
        expect(postResponse.body.number).toBe(postBody.number)
        expect(postResponse.body.status).toBe('success')

        //second get request, post number + input
        const getTwoResponse: IQNodeResponse = await testDoublePlugin.testEndpoint(
            TEST_ENDPOINTS.numberGet.verb,
            TEST_ENDPOINTS.numberGet.path,
            getRequest
        )
        expect(getTwoResponse.body.number).toBe(
            getBody.number + postBody.number
        )
        done()
    })

    it('should give error when an attempt to define a duplicate endpoint is made', () => {
        try {
            //This should throw error upon instantiation
            class DuplicateEndpointServer extends QNodeServerBase {
                @Endpoint(TEST_ENDPOINTS.randomColor)
                private async one(): Promise<IQNodeResponse> {
                    return {
                        statusCode: 200,
                        body: true,
                    }
                }

                @Endpoint(TEST_ENDPOINTS.randomColor)
                private async two(): Promise<IQNodeResponse> {
                    return {
                        statusCode: 200,
                        body: true,
                    }
                }
            }
            expect(false).toBe(true)
        } catch (err) {
            expect(true).toBe(true)
        }
    })*/
});
