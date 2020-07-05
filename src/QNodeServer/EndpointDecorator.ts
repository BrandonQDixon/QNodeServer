import {IQNodeEndpoint} from "../Models/IQNodeEndpoint";
import {QNodeServerBase} from "./QNodeServerBase";

export function Endpoint(endpointMetadata: IQNodeEndpoint) {
    return function(target: QNodeServerBase, propertyKey: string, descriptor: PropertyDescriptor) {
        target.registerEndpointFromDecorator.call(target, endpointMetadata, descriptor.value);
    }
}