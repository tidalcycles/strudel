#!/usr/bin/env python3
import sys

from pandocfilters import toJSONFilter, RawBlock

def toMiniREPL(key, value, format, meta):
    # print(value, file=sys.stderr)
    if key == 'CodeBlock':
        return RawBlock("markdown", "<MiniRepl tune={`" + value[1] + "`} />")

if __name__ == "__main__":
    toJSONFilter(toMiniREPL)
