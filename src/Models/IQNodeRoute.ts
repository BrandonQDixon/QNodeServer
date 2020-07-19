export interface IQNodeRoute {
    path: string;
    params: Array<string>;
    urlMatches(url: string): boolean;
    getUrlArgs(url: string): { [key: string]: string };
}
