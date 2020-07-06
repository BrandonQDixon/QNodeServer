# QNodeServer

QNodeServer is an API which provides a layer of abstraction over a server API such as Express or Node's HTTP API.
**NOTE:** this is a work in progress and should not yet be used in any production software.

# Install

`npm install q-node-server-api`

# Usage

```typescript
class YourServer extends QNodeServerBase {
    @Endpoint({
        verb: 'get',
        path: '/user',
    })
    private async getUser(request: IQNodeRequest): Promise<IQNodeResponse> {
        return {
            username: 'stub',
        };
    }
}
```
