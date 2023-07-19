import * as P from "@honungsburk/kombo/Simple";

/**
 * A JSON value.
 *
 * Spec: https://www.json.org/json-en.html
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

/**
 * Whitespace
 */
export const whitespaceParser = P.chompWhile(
  (c) => c === " " || c === "\n" || c === "\r" || c === "\t"
);

// Null
export const nullParser: P.Parser<null> = P.succeed(null).skip(
  P.symbol("null")
);

// Bool

const trueParser = P.succeed(true).skip(P.symbol("true"));
const falseParser = P.succeed(false).skip(P.symbol("false"));

export const boolParser: P.Parser<boolean> = trueParser.or(falseParser);

// Number

const isDigit = (c: string) => c >= "0" && c <= "9";

const digitsParser = P.chompWhile1(isDigit)
  .getChompedString()
  .map(Number.parseInt);

const fractionParser = P.succeed((n: string) => parseInt(n) / 10 ** n.length)
  .skip(P.symbol("."))
  .apply(P.chompWhile1(isDigit).getChompedString());

const signParser = P.succeed((sign: string) => (sign === "-" ? -1 : 1)).apply(
  P.chompIf((c) => c === "-" || c === "+")
    .getChompedString()
    .or(P.succeed("+"))
);

const exponentParser = P.succeed(
  (sign: number) => (e: number) => 10 ** (sign * e)
)
  .skip(P.chompIf((c) => c === "e" || c === "E"))
  .apply(signParser)
  .apply(digitsParser);

export const numberParser: P.Parser<number> = P.succeed(
  (sign: number) => (n: number) => (fraction: number) => (exponent: number) =>
    sign * (n + fraction) * exponent
)
  .apply(
    P.chompIf((c) => c === "-")
      .map(() => -1)
      .or(P.succeed(1))
  )
  .apply(digitsParser)
  .apply(fractionParser.or(P.succeed(0)))
  .apply(exponentParser.or(P.succeed(1)));

// String

export const unicodeParser: P.Parser<string> = P.succeed((s: string) =>
  String.fromCodePoint(parseInt(s, 16))
)
  .skip(P.symbol("u"))
  .apply(
    P.chompWhile1(
      (c) =>
        (c >= "0" && c <= "9") ||
        (c >= "a" && c <= "f") ||
        (c >= "A" && c <= "F")
    ).getChompedString()
  );

export const escapeParser: P.Parser<string> = P.symbol("\\").keep(
  P.oneOfMany<string>(
    P.symbol("n").map(() => "\n"),
    P.symbol("r").map(() => "\r"),
    P.symbol("\\").map(() => "\\"),
    P.symbol("b").map(() => "\b"),
    P.symbol("f").map(() => "\f"),
    P.symbol("t").map(() => "\t"),
    P.symbol("/").map(() => "/"),
    P.symbol('"').map(() => '"'),
    unicodeParser
  )
);

// The range of valid unicode characters that can be parsed is 0x0020 to 0x10ffff.
const bottomChar = String.fromCodePoint(0x0020);
const topChar = String.fromCodePoint(0x10ffff);

const charParser = P.chompIf(
  (c) => c !== '"' && c !== "\\" && c >= bottomChar && c <= topChar
).getChompedString();

const characterParser = P.oneOf(escapeParser, charParser);

export const stringParser: P.Parser<string> = P.succeed((chars: string[]) =>
  chars.join("")
)
  .skip(P.symbol('"'))
  .apply(P.many(characterParser))
  .skip(P.symbol('"'));

// Value
export const jsonValue: P.Parser<JsonValue> = whitespaceParser
  .keep(
    P.oneOfMany<JsonValue>(
      nullParser,
      boolParser,
      numberParser,
      stringParser,
      P.lazy(() => objectParser),
      P.lazy(() => arrayParser)
    )
  )
  .skip(whitespaceParser);

// Object
export const objectParser: P.Parser<JsonObject> = P.sequence({
  start: "{",
  seperator: ",",
  end: "}",
  spaces: P.spaces,
  item: P.succeed((key: string) => (value: JsonValue) => [key, value] as const)
    .skip(whitespaceParser)
    .apply(stringParser)
    .skip(whitespaceParser)
    .skip(P.symbol(":"))
    .skip(whitespaceParser)
    .apply(jsonValue),
  trailing: P.Trailing.Forbidden,
}).map((items) => Object.fromEntries(items));

// Array
export const arrayParser: P.Parser<JsonArray> = P.sequence({
  start: "[",
  seperator: ",",
  end: "]",
  spaces: whitespaceParser,
  item: jsonValue,
  trailing: P.Trailing.Forbidden,
}).map((items) => items.toArray());
