import {IQNodeRequest, QNodeRequest, QNodeUrl} from "../..";

describe('QNodeRequest tests', () => {

    it('should convert query string and store values in object', () => {
        const testRequest: IQNodeRequest = QNodeRequest.getEmpty();
        testRequest.url = new QNodeUrl({
            query: "?one=yes&two=no",
            protocol: "http://",
            host: "localhost",
            path: "/test"
        });
        const expected = {
            one: "yes",
            two: "no"
        };
        const processed = new QNodeRequest(testRequest);
        expect(processed.query).toEqual(expected);
    });

    it('should gracefully merge incomplete url query string vs query object in request', () => {
        const testRequest: IQNodeRequest = QNodeRequest.getEmpty();
        testRequest.url = new QNodeUrl({
            query: "?one=yes",
            protocol: "http://",
            host: "localhost",
            path: "/test"
        });
        const expected = {
            one: "yes",
            two: "no"
        };
        testRequest.query = expected;
        const processed = new QNodeRequest(testRequest);
        expect(processed.query).toEqual(expected);
    });

});