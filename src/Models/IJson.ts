type JSON_LEAF = string | number | boolean | null;
type JSON_INNER_OBJECT =  Array<JSON_INNER_OBJECT> | {[key: string] : JSON_INNER_OBJECT} | JSON_LEAF;
export type JSON_OBJECT = Array<JSON_INNER_OBJECT> | {[key: string]: JSON_INNER_OBJECT};
