import { test, Group } from "@japa/runner";
import * as Core from "./core.js";
import { Parser } from "@honungsburk/kombo/Simple";
import * as Kombo from "@honungsburk/kombo";
import * as Result from "@honungsburk/kombo/Result";
import { Expect } from "@japa/expect";

// Helper functions for testing parsers.

const testSuccessBuilder =
  <A>(parser: Parser<A>) =>
  (description: string, input: string, expected: A) => {
    return test(description, ({ expect }) => {
      const result = parser.run(input);
      expect(result.value).toStrictEqual(expected);
    });
  };

const testFailSimpleBuilder =
  <A>(parser: Parser<A>) =>
  (description: string, input: string) => {
    return test(description, ({ expect }) => {
      const result = parser.run(input);
      expect(result.kind).toEqual("Err");
    });
  };

function expectProblem<A, CTX>(
  expect: Expect,
  result: Result.Result<any, Kombo.Parser.DeadEnd<CTX, A>[]>,
  toBe: A[]
): void {
  expect(Result.isErr(result)).toBeTruthy();
  if (Result.isErr(result)) {
    expect(result.value.map((d) => d.problem)).toStrictEqual(toBe);
  }
}

// Tests for the core JSON parsers.

// Whitespace

const testWhitespaceSuccess = testSuccessBuilder(
  Core.whitespaceParser.getChompedString()
);
const testWhitespaceFail = testFailSimpleBuilder(Core.whitespaceParser);

test.group("whitespaceParser", (group: Group) => {
  testWhitespaceSuccess("parses empty string", "", "");
  testWhitespaceSuccess("parses space", " ", " ");
  testWhitespaceSuccess("parses newline", "\n", "\n");
  testWhitespaceSuccess("parses carriage return", "\r", "\r");
  testWhitespaceSuccess("parses tab", "\t", "\t");
  testWhitespaceSuccess("parses multiple spaces", "   ", "   ");
  testWhitespaceSuccess("parses multiple newlines", "\n\n\n", "\n\n\n");
  testWhitespaceSuccess("parses multiple carriage returns", "\r\r\r", "\r\r\r");
  testWhitespaceSuccess("parses multiple tabs", "\t\t\t", "\t\t\t");
  testWhitespaceSuccess("parses mixed whitespace", " \n\r\t", " \n\r\t");
  testWhitespaceSuccess("nothing is parsed if there is no whitespace", "a", "");
});

// Null

const testNullSuccess = testSuccessBuilder(Core.nullParser);
const testNullFail = testFailSimpleBuilder(Core.nullParser);

test.group("nullParser", (group: Group) => {
  testNullSuccess("parses null", "null", null);
  testNullFail("fails on leading space", " null");
  testNullFail("fail on gibberish", "asdq32er");
});

// Bool

const testBoolSuccess = testSuccessBuilder(Core.boolParser);
const testBoolFail = testFailSimpleBuilder(Core.boolParser);

test.group("boolParser", (group: Group) => {
  testBoolSuccess("parses true", "true", true);
  testBoolSuccess("parses false", "false", false);
  testBoolFail("fails on leading space", " false");
  testBoolFail("fail on gibberish", "asdq32er");
});

// Number

const testNumberSuccess = (
  description: string,
  input: string,
  expected: number
) => {
  return test(description, ({ expect }) => {
    const result = Core.numberParser.run(input);
    const epsilon = expected / 10;
    expect(result.value).toBeGreaterThanOrEqual(expected - epsilon);
    expect(result.value).toBeLessThanOrEqual(expected + epsilon);
  });
};

const testNumberFail = testFailSimpleBuilder(Core.numberParser);

test.group("numberParser", (group: Group) => {
  testNumberSuccess("parses 1", "1", 1);
  testNumberSuccess("parses 13213", "13213", 13213);
  testNumberSuccess("parses -0", "-0", -0);
  testNumberSuccess("parses 0", "0", 0);
  testNumberSuccess("parses 1.23123", "1.23123", 1.23123);
  testNumberSuccess("parses 10e1", "10e1", 100);
  testNumberSuccess("parses 10e+1", "10e+1", 100);
  testNumberSuccess("parses 10e-1", "10e-1", 1);
  testNumberSuccess("parses 10E1", "10e1", 100);
  testNumberSuccess("parses 10E+1", "10e+1", 100);
  testNumberSuccess("parses 10E-1", "10e-1", 1);
  testNumberSuccess("parses 10e5", "10e5", 1000000);
  testNumberSuccess("parses 10e-5", "10e-5", 0.0001);
  testNumberSuccess("parses 1.23123e+2", "1.23123e+2", 123.123);
  testNumberFail("fail on leading +", "+1");
  testNumberFail("fails on leading space", " 1.23123");
  testNumberFail("fail on gibberish", "asdq32er");
  testNumberFail("fail on 10e", "10e");
});

// Unicode

const testUnicodeSuccess = testSuccessBuilder(Core.unicodeParser);

test.group("unicodeParser", (group: Group) => {
  testUnicodeSuccess("parses 'u8000'", "u8000", "耀");
});

// Escape

const testEscapeSuccess = testSuccessBuilder(Core.escapeParser);
const testEscapeFail = testFailSimpleBuilder(Core.escapeParser);

test.group("escapeParser", (group: Group) => {
  testEscapeSuccess("parses quote", '\\"', '"');
  testEscapeSuccess("parses backslash", "\\\\", "\\");
  testEscapeSuccess("parses solidus", "\\/", "/");
  testEscapeSuccess("parses backspace", "\\b", "\b");
  testEscapeSuccess("parses formfeed", "\\f", "\f");
  testEscapeSuccess("parses newline", "\\n", "\n");
  testEscapeSuccess("parses carriage return", "\\r", "\r");
  testEscapeSuccess("parses tab", "\\t", "\t");
  testEscapeSuccess("parses unicode", "\\u8000", "耀");

  testEscapeFail("fails on leading space", " \\");
});

// String

const testStringSuccess = testSuccessBuilder(Core.stringParser);
const testStringFail = testFailSimpleBuilder(Core.stringParser);

test.group("stringParser", (group: Group) => {
  testStringSuccess('parses ""', '""', "");
  testStringSuccess('parses "1"', '"1"', "1");
  testStringSuccess('parses "1.23123"', '"1.23123"', "1.23123");
  testStringSuccess("parses hex string", '"\\u8000"', "耀");
  testStringSuccess("parses weird characters", '"耀"', "耀");
  testStringSuccess("parses escaped quote", '"\\""', '"');
  testStringSuccess("parses escaped backslash", '"\\\\"', "\\");
  testStringSuccess("parses escaped solidus", '"\\/"', "/");
  testStringSuccess("parses escaped backspace", '"\\b"', "\b");
  testStringSuccess("parses escaped formfeed", '"\\f"', "\f");
  testStringSuccess("parses escaped newline", '"\\n"', "\n");
  testStringSuccess("parses escaped carriage return", '"\\r"', "\r");
  testStringSuccess("parses escaped tab", '"\\t"', "\t");
  testStringFail('fail on backspace "\\b"', '"\b"');
  testStringFail('fail on linefeed "\\f"', '"\f"');
  testStringFail('fail on newline "\\n"', '"\n"');
  testStringFail('fail on carriage return "\\r"', '"\r"');
  testStringFail('fail on tab "\\t"', '"\t"');
  testStringFail('fail on unterminted string "\\t"', '"\\"');
  //   testStringFail('fail on solidus "\\/"', '"\\/"'); I think it should fail according to the spec, but JSON.parse accepts it.
  testStringFail('fail on badly escaped character "\\x"', '"\\x"');
});

// Array

const testArraySuccess = testSuccessBuilder(Core.arrayParser);
const testArrayFail = testFailSimpleBuilder(Core.arrayParser);

test.group("arrayParser", (group: Group) => {
  testArraySuccess("parses empty array", "[]", []);
  testArraySuccess("parses array with one element", "[1]", [1]);
  testArraySuccess("parses array with multiple elements", "[1,2,3]", [1, 2, 3]);
  testArraySuccess(
    "parses array with multiple elements and whitespace",
    "[ 1 , 2 , 3 ]",
    [1, 2, 3]
  );
  testArraySuccess("parses array with nested array", "[[1,2,3], [1,2,3]]", [
    [1, 2, 3],
    [1, 2, 3],
  ]);
  testArraySuccess("parses array with empty nested object", "[{}]", [{}]);
  testArraySuccess("parses array with nested object", '[{"a":1}]', [{ a: 1 }]);
  testArraySuccess(
    "parses array with nested array and object",
    '[{"a":[1,2,3]}]',
    [{ a: [1, 2, 3] }]
  );
  testArrayFail("fails on leading space", " []");
  testArrayFail("fails on missing comma", "[1 2]");
  testArrayFail("fails on missing comma and whitespace", "[1 2 3]");
});

// Object

const testObjectSuccess = testSuccessBuilder(Core.objectParser);
const testObjectFail = testFailSimpleBuilder(Core.objectParser);

test.group("objectParser", (group: Group) => {
  testObjectSuccess("parses empty object", "{}", {});
  testObjectSuccess("parses object with one key", '{"a":1}', { a: 1 });
  testObjectSuccess("parses object with multiple keys", '{"a":1,"b":2,"c":3}', {
    a: 1,
    b: 2,
    c: 3,
  });
  testObjectSuccess(
    "parses object with multiple keys and whitespace",
    '{ "a" : 1 , "b" : 2 , "c" : 3 }',
    { a: 1, b: 2, c: 3 }
  );
  testObjectSuccess("parses object with nested object", '{"a":{"b":1}}', {
    a: { b: 1 },
  });
  testObjectSuccess(
    "parses object with nested objects",
    '{"a":{"b":1}, "b" : { "a" : 1}}',
    {
      a: { b: 1 },
      b: { a: 1 },
    }
  );
  testObjectSuccess(
    "parses object with nested array",
    '{"a":[1,2,3] , "b": [1,2]}',
    {
      a: [1, 2, 3],
      b: [1, 2],
    }
  );
  testObjectSuccess(
    "parses object with nested object and array",
    '{"a":{"b":[1,2,3]}}',
    { a: { b: [1, 2, 3] } }
  );
  testObjectFail("fails on leading space", " {}");
  testObjectFail("fails on missing comma", '{"a":1 "b":2}');
});
