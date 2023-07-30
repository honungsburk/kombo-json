import * as A from "@honungsburk/kombo/Advanced";
import { Parser, DeadEnd, getContext } from "@honungsburk/kombo/Parser";
import type { JsonValue, JsonObject, JsonArray } from "./types.js";

// Error

/**
 * The context in which the parser failed. It lets us know what the parser was doing when it failed.
 *
 * @category Error Messages
 */
export enum Ctx {
  Value = "Value",
  Object = "Object",
  ObjectKey = "ObjectKey",
  ObjectValue = "ObjectValue",
  Array = "Array",
  ArrayValue = "ArrayValue",
  String = "String",
  Number = "Number",
  Exponent = "Exponent",
  Fraction = "Fraction",
  Unicode = "Unicode",
}

function ctxToString(ctx: Ctx): string {
  switch (ctx) {
    case Ctx.Value:
      return "Cannot parse this value.";
    case Ctx.Object:
      return "Cannot parse this object.";
    case Ctx.ObjectKey:
      return "Cannot parse this object key.";
    case Ctx.ObjectValue:
      return "Cannot parse this object value.";
    case Ctx.Array:
      return "Cannot parse this array.";
    case Ctx.ArrayValue:
      return "Cannot parse this array value.";
    case Ctx.String:
      return "Cannot parse this string.";
    case Ctx.Number:
      return "Cannot parse this number.";
    case Ctx.Exponent:
      return "Cannot parse the exponent in this number.";
    case Ctx.Fraction:
      return "Cannot parse the fraction in this number.";
    case Ctx.Unicode:
      return "Cannot parse the unicode hex in this string.";
  }
}

/**
 * The error that occured when parsing.
 *
 * @category Error Messages
 */
export enum Err {
  ExpectedBool = "ExpectedBool",
  ExpectedNull = "ExpectedNull",
  ExpectedNumber = "ExpectedNumber",
  ExpectedDigit = "ExpectedDigit",
  ExpectedSign = "ExpectedSign",
  ExpectedExponentE = "ExpectedExponentE",
  ExpectedDecimalSeparator = "ExpectedDecimalSeparator",
  ExpectedString = "ExpectedString",
  ExpectedDoubleQuote = "ExpectedDoubleQuote",
  ExpectedChar = "ExpectedChar",
  ExpectedUnicodeU = "ExpectedUnicodeU",
  ExpectedUnicodeHex = "ExpectedUnicodeHex",
  ExpectedEscapedCharacter = "ExpectedEscapedCharacter",
  ExpectedObject = "ExpectedObject",
  ExpectedArray = "ExpectedArray",
  ExpectedLeftBrace = "ExpectedLeftBrace",
  ExpectedRightBrace = "ExpectedRightBrace",
  ExpectedObjectSeparator = "ExpectedObjectSeparator",
  ExpectedKeyValueSeparator = "ExpectedKeyValueSeparator",
  ExpectedLeftBracket = "ExpectedLeftBracket",
  ExpectedRightBracket = "ExpectedRightBracket",
  ExpectedArraySeparator = "ExpectedArraySeparator",
}

function tipGenerator(ctx: Ctx, err: Err): string[] {
  if (ctx === Ctx.ObjectKey) {
    return ['"key": value', '"name": "John Doe"', '"age": 42'];
  }

  if (err === Err.ExpectedBool) {
    return ["true", "false"];
  }

  if (err === Err.ExpectedNull) {
    return ["null"];
  }

  if (err === Err.ExpectedNumber) {
    return ["42", "3.14", "-1", "-3.14", "0.1", "1e3", "1e-3"];
  }

  if (err === Err.ExpectedDigit) {
    return ["0", "1", "2", "..."];
  }

  if (err === Err.ExpectedSign) {
    return ["+", "-"];
  }

  if (err === Err.ExpectedExponentE) {
    return ["1e3", "1E-3"];
  }

  if (err === Err.ExpectedDecimalSeparator) {
    return ["1.0", "1.11234", "1.2865", "..."];
  }

  if (err === Err.ExpectedString) {
    return ['"hello"', '"world"', '"foo"', '"bar"'];
  }

  if (err === Err.ExpectedChar) {
    return ['"a"', '"b"', '"c"', '"d"', "..."];
  }

  if (err === Err.ExpectedUnicodeU) {
    return [
      '"\\u1234"',
      '"\\uabcd"',
      '"\\uABCD"',
      '"\\u1234ABCD"',
      '"\\u1234abcd"',
    ];
  }

  return [];
}

/**
 * Convert an error to a string.
 *
 * @param error - The error to convert to a string.
 * @returns a string representation of the error.
 */
function errToString(error: Err): string {
  switch (error) {
    case Err.ExpectedBool:
      return "Expected a boolean value.";
    case Err.ExpectedNull:
      return "Expected a null value.";
    case Err.ExpectedNumber:
      return "Expected a number.";
    case Err.ExpectedDigit:
      return "Expected a digit.";
    case Err.ExpectedSign:
      return "Expected a sign: '+' or '-'.";
    case Err.ExpectedExponentE:
      return "Expected an exponent.";
    case Err.ExpectedDecimalSeparator:
      return "Expected a decimal separator.";
    case Err.ExpectedString:
      return "Expected a string.";
    case Err.ExpectedDoubleQuote:
      return 'Expected a double quote: ".';
    case Err.ExpectedChar:
      return "Expected a character.";
    case Err.ExpectedUnicodeU:
      return "Expected a unicode 'u'.";
    case Err.ExpectedUnicodeHex:
      return "Expected a unicode hex.";
    case Err.ExpectedEscapedCharacter:
      return "Expected an escaped character.";
    case Err.ExpectedObject:
      return "Expected an object.";
    case Err.ExpectedArray:
      return "Expected an array.";
    case Err.ExpectedLeftBrace:
      return "Expected a left brace: '{'.";
    case Err.ExpectedRightBrace:
      return "Expected a right brace: '}'.";
    case Err.ExpectedObjectSeparator:
      return "Expected an object separator: ','.";
    case Err.ExpectedKeyValueSeparator:
      return "Expected a key value separator: ':'.";
    case Err.ExpectedLeftBracket:
      return "Expected a left bracket: '['.";
    case Err.ExpectedRightBracket:
      return "Expected a right bracket: ']'.";
    case Err.ExpectedArraySeparator:
      return "Expected an array separator: ','.";
  }
}

function composeErrorMessage(
  intro: string,
  faultyLine: string,
  lineNumber: number,
  underline: readonly [number, number],
  explanation: string,
  tips: string[]
): string {
  const preFaultyLine = `${lineNumber}|    `;

  const explainer =
    tips.length === 0
      ? [explanation]
      : [
          explanation + " Here are some examples:",
          "",
          ...tips.map((tip) => "    " + tip),
        ];

  return [
    intro,
    "",
    preFaultyLine + faultyLine,
    " ".repeat(underline[0] + preFaultyLine.length) +
      "^".repeat(underline[1] - underline[0] + 1),
    ...explainer,
  ].join("\n");
}

/**
 * Convert a stack of errors to a string.
 *
 * @example
 *
 * If we have the following invalid JSON:
 *
 * ```json
 * {
 *  "a": "b
 * }
 * ```
 *
 * We get the following error message:
 *
 * ```txt
 * Cannot parse this value.
 *
 * 2|      "a": "b
 *                ^
 * Expected a double quote: "
 * ```
 *
 * @param src the source string you tried to parse
 * @param errorStack the stack of errors that occured when parsing the source string
 * @returns undefined if the stack of errors was empty, otherwise a string with the error message
 *
 * @category Error Messages
 */
export const createErrorMessage = (
  src: string,
  errorStack: DeadEnd<Ctx, Err>[]
): string | undefined => {
  const error = errorStack[0];

  if (error === undefined) {
    return undefined;
  }

  const top = error.contextStack.last();

  const context: Ctx = top === undefined ? Ctx.Value : getContext(top);

  const intro = ctxToString(context);
  const example = src.split("\n")[error.row - 1];
  const underline = [error.col - 1, error.col - 1] as const;
  const explenation = errToString(error.problem);
  const tips = tipGenerator(context, error.problem);

  return composeErrorMessage(
    intro,
    example,
    error.row,
    underline,
    explenation,
    tips
  );
};

/**
 * Parse whitespace
 *
 * @category Parser
 */
export const whitespaceParser: Parser<false, never, never> = A.chompWhile(
  (c) => c === " " || c === "\n" || c === "\r" || c === "\t"
);

// Null

/**
 * Parse null
 *
 * @category Parser
 */
export const nullParser = A.succeed(null).skip(
  A.symbol(A.Token("null", Err.ExpectedNull))
);

// Bool

const trueParser = A.succeed(true).skip(
  A.symbol(A.Token("true", Err.ExpectedBool))
);
const falseParser = A.succeed(false).skip(
  A.symbol(A.Token("false", Err.ExpectedBool))
);

/**
 * Parse a boolean
 *
 * @category Parser
 */
export const boolParser = trueParser.or(falseParser);

// Number

const isDigit = (c: string) => c >= "0" && c <= "9";

const digitsParser = A.chompWhile1(Err.ExpectedDigit, isDigit)
  .getChompedString()
  .map(Number.parseInt);

const fractionParser = A.inContext(Ctx.Fraction)(
  A.succeed((n: string) => parseInt(n) / 10 ** n.length)
    .skip(A.symbol(A.Token(".", Err.ExpectedDecimalSeparator)))
    .apply(A.chompWhile1(Err.ExpectedDigit, isDigit).getChompedString())
);

const signParser = A.succeed((sign: string) => (sign === "-" ? -1 : 1)).apply(
  A.chompIf((c) => c === "-" || c === "+")(Err.ExpectedSign)
    .getChompedString()
    .or(A.succeed("+"))
);

const exponentParser = A.inContext(Ctx.Exponent)(
  A.succeed((sign: number) => (e: number) => 10 ** (sign * e))
    .skip(A.chompIf((c) => c === "e" || c === "E")(Err.ExpectedExponentE))
    .apply(signParser)
    .apply(digitsParser)
);

/**
 * Parse a number
 *
 * @category Parser
 */
export const numberParser: Parser<number, Ctx, Err> = A.inContext(Ctx.Number)(
  A.succeed(
    (sign: number) => (n: number) => (fraction: number) => (exponent: number) =>
      sign * (n + fraction) * exponent
  )
    .apply(
      A.chompIf((c) => c === "-")(Err.ExpectedNumber)
        .map(() => -1)
        .or(A.succeed(1))
    )
    .apply(digitsParser)
    .apply(fractionParser.or(A.succeed(0)))
    .apply(exponentParser.or(A.succeed(1)))
);

// String

/**
 * Parse a unicode hex.
 *
 * @category Parser
 */
export const unicodeParser: Parser<string, Ctx, Err> = A.inContext(Ctx.Unicode)(
  A.succeed((s: string) => String.fromCodePoint(parseInt(s, 16)))
    .skip(A.symbol(A.Token("u", Err.ExpectedUnicodeU)))
    .apply(
      A.chompWhile1(
        Err.ExpectedUnicodeHex,
        (c) =>
          (c >= "0" && c <= "9") ||
          (c >= "a" && c <= "f") ||
          (c >= "A" && c <= "F")
      ).getChompedString()
    )
);

/**
 * Parse an escaped character.
 *
 * @category Parser
 */
export const escapeParser: Parser<string, Ctx, Err> = A.symbol(
  A.Token("\\", Err.ExpectedEscapedCharacter)
).keep(
  A.oneOfMany(
    A.symbol(A.Token("n", Err.ExpectedEscapedCharacter)).map(() => "\n"),
    A.symbol(A.Token("r", Err.ExpectedEscapedCharacter)).map(() => "\r"),
    A.symbol(A.Token("\\", Err.ExpectedEscapedCharacter)).map(() => "\\"),
    A.symbol(A.Token("b", Err.ExpectedEscapedCharacter)).map(() => "\b"),
    A.symbol(A.Token("f", Err.ExpectedEscapedCharacter)).map(() => "\f"),
    A.symbol(A.Token("t", Err.ExpectedEscapedCharacter)).map(() => "\t"),
    A.symbol(A.Token("/", Err.ExpectedEscapedCharacter)).map(() => "/"),
    A.symbol(A.Token('"', Err.ExpectedEscapedCharacter)).map(() => '"'),
    unicodeParser
  )
);

// The range of valid unicode characters that can be parsed is 0x0020 to 0x10ffff.
const bottomChar = String.fromCodePoint(0x0020);
const topChar = String.fromCodePoint(0x10ffff);

const charParser = A.chompIf(
  (c) => c !== '"' && c !== "\\" && c >= bottomChar && c <= topChar
)(Err.ExpectedChar).getChompedString();

const characterParser = A.oneOf(escapeParser, charParser);

/**
 * Parse a String
 *
 * @category Parser
 */
export const stringParser: Parser<string, Ctx, Err> = A.inContext(Ctx.String)(
  A.succeed((chars: string[]) => chars.join(""))
)
  .skip(A.symbol(A.Token('"', Err.ExpectedDoubleQuote)))
  .apply(A.many(characterParser))
  .skip(A.symbol(A.Token('"', Err.ExpectedDoubleQuote)));

// Value

/**
 * Parse any JSON value
 *
 * @category Parser
 */
export const valueParser: Parser<JsonValue, Ctx, Err> = A.inContext(Ctx.Value)(
  whitespaceParser
    .keep(
      A.oneOfMany<JsonValue, never, Err>(
        nullParser,
        boolParser,
        numberParser,
        stringParser,
        A.lazy(() => objectParser),
        A.lazy(() => arrayParser)
      )
    )
    .skip(whitespaceParser)
);

// Object

/**
 * Parse a JSON object
 *
 * @category Parser
 */
export const objectParser: Parser<JsonObject, Ctx, Err> = A.inContext(
  Ctx.Object
)(
  A.sequence({
    start: A.Token("{", Err.ExpectedLeftBrace),
    separator: A.Token(",", Err.ExpectedObjectSeparator),
    end: A.Token("}", Err.ExpectedRightBrace),
    spaces: whitespaceParser,
    item: A.succeed(
      (key: string) => (value: JsonValue) => [key, value] as const
    )
      .skip(whitespaceParser)
      .apply(A.inContext(Ctx.ObjectKey)(stringParser))
      .skip(whitespaceParser)
      .skip(A.symbol(A.Token(":", Err.ExpectedKeyValueSeparator)))
      .skip(whitespaceParser)
      .apply(A.inContext(Ctx.ObjectValue)(valueParser)),
    trailing: A.Trailing.Forbidden,
  }).map((items) => Object.fromEntries(items))
);

// Array

/**
 * Parse a JSON array
 *
 * @category Parser
 */
export const arrayParser: Parser<JsonArray, Ctx, Err> = A.inContext(Ctx.Array)(
  A.sequence({
    start: A.Token("[", Err.ExpectedLeftBracket),
    separator: A.Token(",", Err.ExpectedArraySeparator),
    end: A.Token("]", Err.ExpectedRightBracket),
    spaces: whitespaceParser,
    item: valueParser,
    trailing: A.Trailing.Forbidden,
  }).map((items) => items.toArray())
);
