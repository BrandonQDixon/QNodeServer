import {
    IQNodeEndpoint,
    IQNodeRequest,
    IQNodeUrl,
    MIME_TYPES,
    QNodeEndpoint,
    QNodeUrl,
} from '..';
import { CloneInputObj } from '../Util/Object/CloneObject';
import url from 'url';

/**
 * Class definition for request
 * Useful for prototype checking
 */
export class QNodeRequest<ParsedBodyType = any>
    implements IQNodeRequest<ParsedBodyType> {
    params: { [key: string]: string };
    query: { [key: string]: string | Array<string> };
    body: { raw: string; json?: ParsedBodyType };
    endpointMetadata: IQNodeEndpoint;
    headers: { 'content-type'?: string; [key: string]: string };
    timeout: number;
    url: IQNodeUrl;

    constructor(@CloneInputObj inputRequest: IQNodeRequest) {
        const request = {
            ...QNodeRequest.getEmpty(),
            ...inputRequest,
        };

        Object.keys(request).forEach((k) => {
            this[k] = request[k];
        });

        this.initBody();
        this.initUrl();
        this.processEndpointMetadata();
        this.resolveUrlQueryParams();
    }

    private initBody() {
        if (!this.body) {
            this.body = {
                raw: '',
                json: null,
            };
        }
    }

    private initUrl() {
        this.url = new QNodeUrl(this.url);
    }

    private processEndpointMetadata() {
        this.endpointMetadata = new QNodeEndpoint(this.endpointMetadata);
        if (
            this.endpointMetadata.contentType.find(
                (ct) => ct.type === MIME_TYPES.ApplicationJson
            )
        ) {
            let bodyRaw = this.body.raw;
            if (bodyRaw.length === 0) {
                bodyRaw = '{}';
            }
            let inputJson = this.body.json || {};
            try {
                this.body.json = {
                    ...JSON.parse(bodyRaw),
                    ...inputJson,
                };
            } catch (err) {
                this.body.json = <ParsedBodyType>inputJson;
            }
        }
    }

    /**
     * Ensure all url params are present in path string and params object
     */
    private resolveUrlQueryParams() {
        this.transferUrlQueryToQueryObject();
        this.appendQueryParamsToUrl();
    }

    private transferUrlQueryToQueryObject() {
        this.query = {
            ...this.query,
            ...url.parse(this.url.full, true).query,
        };
    }

    private appendQueryParamsToUrl() {
        if (this.query && Object.keys(this.query).length > 0) {
            const queryIndex = this.url.full.indexOf('?');
            if (queryIndex > -1) {
                this.url.full = this.url.full.substring(
                    0,
                    this.url.full.indexOf('?')
                );
            }
            const queryParams = Object.keys(this.query)
                .reduce((str, key) => {
                    const newParam = (k, v) =>
                        encodeURIComponent(k) + '=' + encodeURIComponent(v);
                    if (Array.isArray(this.query[key])) {
                        return (
                            str +
                            (<Array<string>>this.query[key]).reduce(
                                (innerStr, value) => {
                                    return (
                                        innerStr + '&' + newParam(key, value)
                                    );
                                },
                                ''
                            )
                        );
                    } else {
                        return str + '&' + newParam(key, this.query[key]);
                    }
                }, '')
                .substring(1);

            this.url.query = '?' + queryParams;
            this.url.full += '?' + queryParams;
        }
    }

    static getEmpty(): IQNodeRequest {
        return {
            params: {},
            query: {},
            body: {
                raw: '',
                json: {},
            },
            headers: {},
            url: new QNodeUrl({
                host: '',
                path: '',
                query: '',
                protocol: '',
            }),
            endpointMetadata: null,
        };
    }
}
