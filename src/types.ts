/**
 * A JSON value.
 *
 * Spec: https://www.json.org/json-en.html
 *
 * @category Types
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;

/**
 * A JSON Object
 *
 * @category Types
 */
export type JsonObject = { [key: string]: JsonValue };

/**
 * A JSON Array
 *
 * @category Types
 */
export type JsonArray = JsonValue[];
