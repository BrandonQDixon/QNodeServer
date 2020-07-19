import {QNodeRoute} from "../..";

describe('route tests', () => {

    it('should correctly identify routes with no url params', () => {
        const routes = [
            "/one/two/three",
            "/four/five",
            "/six",
            "/seven/eight/nine/ten"
        ];

        routes.forEach(routePath => {
            const route = new QNodeRoute(routePath);
            expect(route.urlMatches(routePath)).toBe(true);
            expect(route.urlMatches("bad")).toBe(false);
        });
    });

    it('should correctly identify routes with one or more url params', () => {
        const routes = [{
            route: "/one/:two/three",
            generate: (args: Array<string>) => `/one/${args[0]}/three`
        }, {
            route: "/one/:two/three/:four",
            generate: (args: Array<string>) => `/one/${args[0]}/three/${args[1]}`
        },{
            route: "/one/:two/three/:four/:five",
            generate: (args: Array<string>) => `/one/${args[0]}/three/${args[1]}/${args[2]}`
        }];

        const TEST_ARGS = ["blue", "green", "yellow", "orange", "something"];

        routes.forEach(routeParams => {
            const route = new QNodeRoute(routeParams.route);
            const testPath = routeParams.generate(TEST_ARGS);
            expect(route.urlMatches(testPath)).toBe(true);
            expect(route.urlMatches("bad")).toBe(false);
        });
    });

    it('should get url provided arguments from routes', () => {
        const routes = [{
            route: "/one/:two/three/:four/:five",
            generate: (args) => `/one/${args.two}/three/${args.four}/${args.five}`
        }, {
            route: "/something/:two/else/:four/:five",
            generate: (args) => `/something/${args.two}/else/${args.four}/${args.five}`
        }];

        const TEST_ARGS = {
            two: "green",
            four: "yellow",
            five: "purple"
        }

        routes.forEach(routeParams => {
            const route = new QNodeRoute(routeParams.route);
            const testPath = routeParams.generate(TEST_ARGS);
            expect(route.urlMatches(testPath)).toBe(true);
            expect(route.getUrlArgs(testPath)).toEqual(TEST_ARGS);
        });

    });

});