/**
 * Abstraction over a request object representing the HTTP request being received
 */
import { JSON_OBJECT } from './IJson';
import {IQNodeEndpoint, QNodeEndpoint} from './IQNodeEndpoint';
import url from "url";
import {MIME_TYPES} from "..";

export interface IQNodeRequest<ParsedBodyType = any> {
    params: {
        [key: string]: string | Array<string>;
    },
    body: {
        raw: string;
        json?: ParsedBodyType;
    };
    headers: {
        'content-type'?: string;
        [key: string]: string;
    };
    timeout?: number;
    url: {
        protocol: string;
        full: string;
        host: string;
    };
    endpointMetadata: IQNodeEndpoint;
}

/**
 * Class definition for request
 * Useful for prototype checking
 */
export class QNodeRequest<ParsedBodyType = any>
    implements IQNodeRequest<ParsedBodyType> {

    params: {[key: string]: string | Array<string>};
    body: { raw: string; json?: ParsedBodyType };
    endpointMetadata: IQNodeEndpoint;
    headers: { 'content-type'?: string; [key: string]: string };
    timeout: number;
    url: { protocol: string; full: string; host: string };

    constructor(request: IQNodeRequest) {

        request = {
            ...QNodeRequest.getEmptySelf(),
            ...request
        }

        Object.keys(request).forEach(k => {
            this[k] = request[k]
        });

        this.initBody();
        this.processEndpointMetadata();
        this.resolveUrlParams();
    }

    private initBody() {
        if (!this.body || !this.body.raw) {
            this.body = {
                raw: '',
            };
        }
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
            try {
                this.body.json = JSON.parse(bodyRaw);
            } catch (err) {
                this.body.json = null;
            }
        }
    }

    /**
     * Ensure all url params are present in path string and params object
     */
    private resolveUrlParams() {
        this.transferUrlParamsToParamsObject();
        this.appendParamsToUrl();
    }

    private transferUrlParamsToParamsObject() {
        this.params = {
            ...this.params,
            ...url.parse(this.url.full, true).query,
        };
    }

    private appendParamsToUrl() {
        if (this.params && Object.keys(this.params).length > 0) {
            const queryIndex = this.url.full.indexOf("?");
            if (queryIndex > -1) {
                this.url.full = this.url.full.substring(0, this.url.full.indexOf("?"));
            }
            this.url.full += "?" + Object.keys(this.params).reduce((str, key) => {
                const newParam = (k, v) => encodeURIComponent(k) + "=" + encodeURIComponent(v);
                if (Array.isArray(this.params[key])) {
                    return str + (<Array<string>>this.params[key]).reduce((innerStr, value) => {
                        return innerStr + "&" + newParam(key, value);
                    }, "");
                } else {
                    return str + "&" + newParam(key, this.params[key]);
                }
            }, "").substring(1);
        }
    }

    private static getEmptySelf(): IQNodeRequest {
        return {
            params: {},
            body: {
                raw: ''
            },
            headers: {},
            url: {
                protocol: '',
                full: '',
                host: ''
            },
            endpointMetadata: null
        }
    }
}
