/**
 * This is the module you most likely want to use. There is also the {@link Core:namespace | Core module} but
 * it exposes a lot of internal types and functions that you probably do not want to use.
 *
 * @packageDocumentation
 */

export {
  Err,
  valueParser as parser,
  type Ctx,
  createErrorMessage,
} from "./core.js";
export type { JsonValue, JsonObject, JsonArray } from "./types.js";

/**
 * You can use this module if you want to poke around in the internals. **THERE ARE NO STABILITY GUARANTEES**
 *
 * @category Submodule
 */
export * as Core from "./core.js";

/**
 * Contains the JSON type.
 *
 * @category Submodule
 */
export * as Types from "./types.js";
