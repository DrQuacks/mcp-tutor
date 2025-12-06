/**
 * Provides JavaScript hello world exercise prompt
 */

import type { ToolResponse } from "../shared/types.js";

export async function tutorJsHelloPrompt(): Promise<ToolResponse> {
  return {
    content: [
      {
        type: "text",
        text: [
          "Exercise: Write a JavaScript function named helloWorld.",
          "",
          "Requirements:",
          "1. It should be a function called `helloWorld` (or a default export that is a function).",
          "2. It should take no arguments.",
          '3. When called, it should return a string that contains the words "hello" and "world" (case-insensitive).',
          "",
          "Example shapes that are acceptable:",
          "  function helloWorld() {",
          '    return "Hello, world!";',
          "  }",
          "",
          "or:",
          "  module.exports = function helloWorld() {",
          '    return "hello world";',
          "  };",
          "",
          "Once you've written your function, call the `tutor_js_hello_check` tool with your code as a string.",
        ].join("\n"),
      },
    ],
  };
}
