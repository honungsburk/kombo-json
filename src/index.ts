/**
 * This is the module you most likely want to use. There is also the {@link core:namespace | Core module} but
 * it exposes a lot of internal types and functions that you probably do not want to use.
 *
 * @packageDocumentation
 */

export { Err, valueParser as parser, type Ctx } from "./core.js";
export type { JsonValue, JsonObject, JsonArray } from "./types.js";
