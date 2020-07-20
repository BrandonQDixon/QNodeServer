# QNodeServer

QNodeServer is an API which provides a layer of abstraction over a server API such as Express or Node's HTTP API.

**NOTE:** this is a work in progress and should not yet be used in any production software.

![Statements](./coverage/badge-statements.svg)
![Coverage](./coverage/badge-lines.svg)
![Functions](./coverage/badge-functions.svg)
![Branches](./coverage/badge-branches.svg)

# Install

`npm install q-node-server-api`

# Usage

Create a basic server with an endpoint:

```typescript
class YourServer extends QNodeServerBase {
    //use an endpoint decorator to declare that a method defines an endpoint
    @Endpoint({
        verb: 'get',
        route: '/api/colors/hex',
    })
    private async getColorHex(request: IQNodeRequest): Promise<IQNodeResponse> {
        return {
            statusCode: 200,
            body: {
                hex: '00000f',
            },
        };
    }
}
```

Create an endpoint with multiple options:

```typescript
class YourServer extends QNodeServerBase {
    @Endpoint({
        verb: 'get',
        route: '/api/colors/:name/hex',
        middleware: [SOMETHING_MIDDLEWARE, OTHER_MIDDLEWARE], //middleware to be executed before this endpoint is hit
    })
    private async getColorHex(
        request: IQNodeRequest,
        response: IQNodeResponse,
        carryValue: any //optional value that middleware can use to transfer some value
    ): Promise<IQNodeResponse> {
        return {
            statusCode: 200,
            body: {
                name: request.params.name, //param in the route (:name)
                hex: '00000f',
            },
        };
    }
}
```

Creating middleware:

```typescript
const middleOne: IQNodeMiddleware = (
	request: IQNodeRequest,
    response: IQNodeResponse,
    carryValue: any,
    next: (
        updatedComponents?: Partial<IQNodeMiddlewareComponents> | Error
    ) => void
): Promise<void>; {
	if (request.something) {
		next(new Error("Cannot continue");
	} else {
		next({
			carryValue: "somethingElse"
		});
	}
}
```

# Server Plugin

The API uses a "Server Plugin" to handle the lower level tasks of initializing the server, adding endpoints to it, etc. This repo comes with "NodeHttp", a plugin based on the native Node server functionality, and "TestDouble", a stub implementation used for internal unit tests (which can also be used for external unit tests). If another option is needed, such as "Express", a plugin class can be created to have the server use "Express" as the underlying technology instead.
