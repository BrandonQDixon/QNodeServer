import {IQNodeRoute} from "..";

export class QNodeRoute implements IQNodeRoute {

    readonly path: string;
    readonly params: Array<string>;

    private readonly pathParts: Array<string>;

    constructor(
        path: string
    ) {
        this.path = path;
        this.pathParts = path.split("/");
        this.params = this.pathParts.filter(r => r.indexOf(":") === 0).map(r => r.substring(1));
    }


    urlMatches(url: string): boolean {
        const parts = url.split("/");
        if (parts.length !== this.pathParts.length) {
            return false;
        }

        return parts.reduce((bool: boolean, part, index) => {
            if (!bool) {
                return false;
            }

            const definitionPart = this.pathParts[index];
            if (definitionPart.indexOf(":") === 0) {
                return true;
            } else {
                return part === definitionPart;
            }
        }, true);
    }

    getUrlArgs(url: string): {[key: string]: string} {
        if (!this.urlMatches(url)) {
            throw new Error("Cannot get url params because url does not match this route: " + url + " : " + this.path);
        }

        const parts = url.split("/");
        return parts.reduce((obj: {[key: string]: string}, part, index) => {

            const definitionPart = this.pathParts[index];
            if (definitionPart.indexOf(":") === 0) {
                const key = definitionPart.substring(1);
                obj[key] = part;
            }

            return obj;
        }, {});
    }

}