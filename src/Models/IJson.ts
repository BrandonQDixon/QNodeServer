type JSON_LEAF = string | number | null;
type JSON_INNER_OBJECT = JSON_LEAF | Array<JSON_OBJECT> | {[key: string] : JSON_OBJECT}
export type JSON_OBJECT = Array<JSON_INNER_OBJECT> | {[key: string]: JSON_INNER_OBJECT};