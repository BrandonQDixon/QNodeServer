import { IQNodeUrl } from '..';
import { CloneInputObj } from '../Util/Object/CloneObject';

export class QNodeUrl implements IQNodeUrl {
    readonly full: string;
    readonly host: string;
    readonly path: string;
    readonly protocol: string;
    readonly query: string;
    readonly port: string;

    constructor(
        @CloneInputObj
        parts: {
            host: string;
            path: string;
            protocol: string;
            query: string;
            port?: string;
        }
    ) {
        this.host = parts.host || '';
        this.path = parts.path || '';
        this.protocol = parts.protocol || '';
        this.port = parts.port || '80';

        if (this.protocol.indexOf('://') === -1) {
            this.protocol += '://';
        }

        this.query = parts.query || '';

        //determine full path
        this.full =
            this.protocol +
            this.host +
            ':' +
            this.port +
            this.path +
            this.query;
    }
}
