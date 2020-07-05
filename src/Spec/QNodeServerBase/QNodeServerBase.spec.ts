/**
 * Tests related to QNodeServerBase
 */
import { QNodeServerBase, Endpoint } from '../../QNodeServer/QNodeServerBase'
import { IQNodeResponse } from '../../Models/IQNodeResponse'
import { TestDoublePlugin } from '../../ServerPlugins/TestDouble/TestDoublePlugin'
import { IQNodeRequest } from '../../Models/IQNodeRequest'
import { IQServerPlugin } from '../../Models/IQServerPlugin'

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
}

class TestServer extends QNodeServerBase {
    private numberFromPost: number = 0

    @Endpoint(TEST_ENDPOINTS.randomColor)
    private async getRandomColor(): Promise<IQNodeResponse> {
        const colors = ['green', 'red', 'blue']
        const selectedColorIndex = Math.floor(Math.random() * colors.length)
        return {
            statusCode: 200,
            body: {
                color: colors[selectedColorIndex],
            },
        }
    }

    @Endpoint(TEST_ENDPOINTS.numberGet)
    private async getNumber(request: IQNodeRequest): Promise<IQNodeResponse> {
        return {
            statusCode: 200,
            body: {
                number: this.numberFromPost + request.body.parsed.number,
            },
        }
    }

    @Endpoint(TEST_ENDPOINTS.numberPost)
    private async setNumber(request: IQNodeRequest): Promise<IQNodeResponse> {
        this.numberFromPost = request.body.parsed.number
        return {
            statusCode: 200,
            body: {
                number: this.numberFromPost,
                status: 'success',
            },
        }
    }
}

describe('basic server test with test double server', () => {
    let server: TestServer
    let testDoublePlugin: TestDoublePlugin

    beforeEach(() => {
        testDoublePlugin = new TestDoublePlugin()
        server = new TestServer(testDoublePlugin, 123456)
        server.initialize()
    })

    it('should execute getRandomColor when endpoint is manually triggered', async (done) => {
        const testRequest: IQNodeRequest = {
            url: {
                protocol: 'https',
                base: 'test',
                full: 'https://test' + TEST_ENDPOINTS.randomColor.path,
                host: 'test',
            },
            body: {
                raw: '',
            },
            headers: {},
            endpointMetadata: TEST_ENDPOINTS.randomColor,
        }

        const response: IQNodeResponse = await testDoublePlugin.testEndpoint(
            TEST_ENDPOINTS.randomColor.verb,
            TEST_ENDPOINTS.randomColor.path,
            testRequest
        )

        expect(response.body).toBeTruthy()
        expect(typeof response.body.color === 'string').toBe(true)
        done()
    })

    it('should get and post to different endpoints with the same path', async (done) => {
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
    })
})
