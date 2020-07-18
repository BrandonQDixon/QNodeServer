export function CloneObject(input) {
    if (Array.isArray(input)) {
        return input.map(item => CloneObject(item));
    }
    if (typeof input === 'object') {
        return Object.keys(input).reduce((obj, key) => {
            obj[key] = CloneObject(input[key]);
            return obj;
        }, {});
    }
    return input;
}

export function CloneInputObj(
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
): any {
    return CloneObject(target);
}