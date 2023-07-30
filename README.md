# Kombo-JSON

A JSON parser that is built on top of [Kombo](https://github.com/honungsburk/kombo), a parser combinator library.

## Goals

For most purposes, I recommend using javascript's built-in JSON parser (`JSON.parse`) but if you need better error messages this library could be of interest to you. It also serves as an example of how to build a more complicated parser using [Kombo](https://github.com/honungsburk/kombo).

## Stability

the `core` module might have some function signatures or names changed so avoid relying on it.
Everything that is exported from the `index` module I'll try to keep stable.

## Example

```ts
import * as KomboJson from "@honungsburk/kombo-json";

const jsonString = JSON.stringify({
  hello: "world",
});

/**
 * Returns a result object that is either Ok or Err. You'll find the full API in the
 * [kombo documentation](https://frankhampusweslien.com/kombo/modules/Result.html)
 */
const helloObjectResult = KomboJson.parser.run(jsonString);

if (helloObjectResult.isOk) {
  console.log(helloObject.hello === "world");
  // > true
}
```

## Links

- [JSON Spec](https://www.json.org/json-en.html)
- [Documentation](https://frankhampusweslien.com/kombo-json)

## Further work

- Improve error messages
- Add even more tests

## Development

We use golden tests to catch regressions in the error messages. But that means that if you improve the error messages you might need to
update the tests. You do this by running the tests using the command `npm run test -- -u`. It will update all golden tests to use the current snapshot.
