import {IQNodeEndpoint} from "../Models/IQNodeEndpoint";
import {QNodeServerBase} from "./QNodeServerBase";

export function Endpoint(endpointMetadata: IQNodeEndpoint) {
    endpointMetadata.verb = endpointMetadata.verb.toLowerCase();
    return function(target: QNodeServerBase, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.enumerable = true;
        target.registerEndpointFromDecorator.call(target, endpointMetadata, descriptor.value);
    }
}