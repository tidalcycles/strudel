# @strudel/eval

This package contains the strudel code transformer and evaluator.
It allows creating strudel patterns from input code that is optimized for minimal keystrokes and human readability.

## Dev Notes

shift-traverser is currently monkey patched because its package.json uses estraverse@^4.2.0,
which does not support the spread operator (Error: Unknown node type SpreadProperty.).
By monkey patched, I mean I copied the source of shift-traverser to a subfolder and installed the dependencies (shift-spec + estraverse@^5.3.0)
