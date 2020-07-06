declare type JSON_LEAF = string | number | boolean | null;
declare type JSON_INNER_OBJECT = Array<JSON_INNER_OBJECT> | {
    [key: string]: JSON_INNER_OBJECT;
} | JSON_LEAF;
export declare type JSON_OBJECT = Array<JSON_INNER_OBJECT> | {
    [key: string]: JSON_INNER_OBJECT;
};
export {};
