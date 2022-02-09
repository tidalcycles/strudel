/**
 * Copyright 2014 Shape Security, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


import { getHexValue, isLineTerminator, isWhiteSpace, isIdentifierStart, isIdentifierPart, isDecimalDigit } from './utils.js';
import { ErrorMessages } from './errors.js';

export const TokenClass = {
  Eof: { name: '<End>' },
  Ident: { name: 'Identifier', isIdentifierName: true },
  Keyword: { name: 'Keyword', isIdentifierName: true },
  NumericLiteral: { name: 'Numeric' },
  TemplateElement: { name: 'Template' },
  Punctuator: { name: 'Punctuator' },
  StringLiteral: { name: 'String' },
  RegularExpression: { name: 'RegularExpression' },
  Illegal: { name: 'Illegal' },
};

export const TokenType = {
  EOS: { klass: TokenClass.Eof, name: 'EOS' },
  LPAREN: { klass: TokenClass.Punctuator, name: '(' },
  RPAREN: { klass: TokenClass.Punctuator, name: ')' },
  LBRACK: { klass: TokenClass.Punctuator, name: '[' },
  RBRACK: { klass: TokenClass.Punctuator, name: ']' },
  LBRACE: { klass: TokenClass.Punctuator, name: '{' },
  RBRACE: { klass: TokenClass.Punctuator, name: '}' },
  COLON: { klass: TokenClass.Punctuator, name: ':' },
  SEMICOLON: { klass: TokenClass.Punctuator, name: ';' },
  PERIOD: { klass: TokenClass.Punctuator, name: '.' },
  ELLIPSIS: { klass: TokenClass.Punctuator, name: '...' },
  ARROW: { klass: TokenClass.Punctuator, name: '=>' },
  CONDITIONAL: { klass: TokenClass.Punctuator, name: '?' },
  INC: { klass: TokenClass.Punctuator, name: '++' },
  DEC: { klass: TokenClass.Punctuator, name: '--' },
  ASSIGN: { klass: TokenClass.Punctuator, name: '=' },
  ASSIGN_BIT_OR: { klass: TokenClass.Punctuator, name: '|=' },
  ASSIGN_BIT_XOR: { klass: TokenClass.Punctuator, name: '^=' },
  ASSIGN_BIT_AND: { klass: TokenClass.Punctuator, name: '&=' },
  ASSIGN_SHL: { klass: TokenClass.Punctuator, name: '<<=' },
  ASSIGN_SHR: { klass: TokenClass.Punctuator, name: '>>=' },
  ASSIGN_SHR_UNSIGNED: { klass: TokenClass.Punctuator, name: '>>>=' },
  ASSIGN_ADD: { klass: TokenClass.Punctuator, name: '+=' },
  ASSIGN_SUB: { klass: TokenClass.Punctuator, name: '-=' },
  ASSIGN_MUL: { klass: TokenClass.Punctuator, name: '*=' },
  ASSIGN_DIV: { klass: TokenClass.Punctuator, name: '/=' },
  ASSIGN_MOD: { klass: TokenClass.Punctuator, name: '%=' },
  ASSIGN_EXP: { klass: TokenClass.Punctuator, name: '**=' },
  COMMA: { klass: TokenClass.Punctuator, name: ',' },
  OR: { klass: TokenClass.Punctuator, name: '||' },
  AND: { klass: TokenClass.Punctuator, name: '&&' },
  BIT_OR: { klass: TokenClass.Punctuator, name: '|' },
  BIT_XOR: { klass: TokenClass.Punctuator, name: '^' },
  BIT_AND: { klass: TokenClass.Punctuator, name: '&' },
  SHL: { klass: TokenClass.Punctuator, name: '<<' },
  SHR: { klass: TokenClass.Punctuator, name: '>>' },
  SHR_UNSIGNED: { klass: TokenClass.Punctuator, name: '>>>' },
  ADD: { klass: TokenClass.Punctuator, name: '+' },
  SUB: { klass: TokenClass.Punctuator, name: '-' },
  MUL: { klass: TokenClass.Punctuator, name: '*' },
  DIV: { klass: TokenClass.Punctuator, name: '/' },
  MOD: { klass: TokenClass.Punctuator, name: '%' },
  EXP: { klass: TokenClass.Punctuator, name: '**' },
  EQ: { klass: TokenClass.Punctuator, name: '==' },
  NE: { klass: TokenClass.Punctuator, name: '!=' },
  EQ_STRICT: { klass: TokenClass.Punctuator, name: '===' },
  NE_STRICT: { klass: TokenClass.Punctuator, name: '!==' },
  LT: { klass: TokenClass.Punctuator, name: '<' },
  GT: { klass: TokenClass.Punctuator, name: '>' },
  LTE: { klass: TokenClass.Punctuator, name: '<=' },
  GTE: { klass: TokenClass.Punctuator, name: '>=' },
  INSTANCEOF: { klass: TokenClass.Keyword, name: 'instanceof' },
  IN: { klass: TokenClass.Keyword, name: 'in' },
  NOT: { klass: TokenClass.Punctuator, name: '!' },
  BIT_NOT: { klass: TokenClass.Punctuator, name: '~' },
  ASYNC: { klass: TokenClass.Keyword, name: 'async' },
  AWAIT: { klass: TokenClass.Keyword, name: 'await' },
  ENUM: { klass: TokenClass.Keyword, name: 'enum' },
  DELETE: { klass: TokenClass.Keyword, name: 'delete' },
  TYPEOF: { klass: TokenClass.Keyword, name: 'typeof' },
  VOID: { klass: TokenClass.Keyword, name: 'void' },
  BREAK: { klass: TokenClass.Keyword, name: 'break' },
  CASE: { klass: TokenClass.Keyword, name: 'case' },
  CATCH: { klass: TokenClass.Keyword, name: 'catch' },
  CLASS: { klass: TokenClass.Keyword, name: 'class' },
  CONTINUE: { klass: TokenClass.Keyword, name: 'continue' },
  DEBUGGER: { klass: TokenClass.Keyword, name: 'debugger' },
  DEFAULT: { klass: TokenClass.Keyword, name: 'default' },
  DO: { klass: TokenClass.Keyword, name: 'do' },
  ELSE: { klass: TokenClass.Keyword, name: 'else' },
  EXPORT: { klass: TokenClass.Keyword, name: 'export' },
  EXTENDS: { klass: TokenClass.Keyword, name: 'extends' },
  FINALLY: { klass: TokenClass.Keyword, name: 'finally' },
  FOR: { klass: TokenClass.Keyword, name: 'for' },
  FUNCTION: { klass: TokenClass.Keyword, name: 'function' },
  IF: { klass: TokenClass.Keyword, name: 'if' },
  IMPORT: { klass: TokenClass.Keyword, name: 'import' },
  LET: { klass: TokenClass.Keyword, name: 'let' },
  NEW: { klass: TokenClass.Keyword, name: 'new' },
  RETURN: { klass: TokenClass.Keyword, name: 'return' },
  SUPER: { klass: TokenClass.Keyword, name: 'super' },
  SWITCH: { klass: TokenClass.Keyword, name: 'switch' },
  THIS: { klass: TokenClass.Keyword, name: 'this' },
  THROW: { klass: TokenClass.Keyword, name: 'throw' },
  TRY: { klass: TokenClass.Keyword, name: 'try' },
  VAR: { klass: TokenClass.Keyword, name: 'var' },
  WHILE: { klass: TokenClass.Keyword, name: 'while' },
  WITH: { klass: TokenClass.Keyword, name: 'with' },
  NULL: { klass: TokenClass.Keyword, name: 'null' },
  TRUE: { klass: TokenClass.Keyword, name: 'true' },
  FALSE: { klass: TokenClass.Keyword, name: 'false' },
  YIELD: { klass: TokenClass.Keyword, name: 'yield' },
  NUMBER: { klass: TokenClass.NumericLiteral, name: '' },
  STRING: { klass: TokenClass.StringLiteral, name: '' },
  REGEXP: { klass: TokenClass.RegularExpression, name: '' },
  IDENTIFIER: { klass: TokenClass.Ident, name: '' },
  CONST: { klass: TokenClass.Keyword, name: 'const' },
  TEMPLATE: { klass: TokenClass.TemplateElement, name: '' },
  ESCAPED_KEYWORD: { klass: TokenClass.Keyword, name: '' },
  ILLEGAL: { klass: TokenClass.Illegal, name: '' },
};

const TT = TokenType;
const I = TT.ILLEGAL;
const F = false;
const T = true;

const ONE_CHAR_PUNCTUATOR = [
  I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, TT.NOT, I, I, I,
  TT.MOD, TT.BIT_AND, I, TT.LPAREN, TT.RPAREN, TT.MUL, TT.ADD, TT.COMMA, TT.SUB, TT.PERIOD, TT.DIV, I, I, I, I, I, I, I,
  I, I, I, TT.COLON, TT.SEMICOLON, TT.LT, TT.ASSIGN, TT.GT, TT.CONDITIONAL, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I,
  I, I, I, I, I, I, I, I, I, I, I, I, TT.LBRACK, I, TT.RBRACK, TT.BIT_XOR, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I,
  I, I, I, I, I, I, I, I, I, I, I, I, I, TT.LBRACE, TT.BIT_OR, TT.RBRACE, TT.BIT_NOT,
];

const PUNCTUATOR_START = [
  F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, F, F, F, T, T,
  F, T, T, T, T, T, T, F, T, F, F, F, F, F, F, F, F, F, F, T, T, T, T, T, T, F, F, F, F, F, F, F, F, F, F, F, F, F, F,
  F, F, F, F, F, F, F, F, F, F, F, F, F, T, F, T, T, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F,
  F, F, F, F, F, F, T, T, T, T, F,
];

export class JsError extends Error {
  constructor(index, line, column, msg) {
    super(msg);
    this.index = index;
    // Safari defines these properties as non-writable and non-configurable on Error objects
    try {
      this.line = line;
      this.column = column;
    } catch (e) {}
    // define these as well so Safari still has access to this info
    this.parseErrorLine = line;
    this.parseErrorColumn = column;
    this.description = msg;
    this.message = `[${line}:${column}]: ${msg}`;
  }
}

function fromCodePoint(cp) {
  if (cp <= 0xFFFF) return String.fromCharCode(cp);
  let cu1 = String.fromCharCode(Math.floor((cp - 0x10000) / 0x400) + 0xD800);
  let cu2 = String.fromCharCode((cp - 0x10000) % 0x400 + 0xDC00);
  return cu1 + cu2;
}

function decodeUtf16(lead, trail) {
  return (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
}

export default class Tokenizer {
  constructor(source) {
    this.source = source;
    this.index = 0;
    this.line = 0;
    this.lineStart = 0;
    this.startIndex = 0;
    this.startLine = 0;
    this.startLineStart = 0;
    this.lastIndex = 0;
    this.lastLine = 0;
    this.lastLineStart = 0;
    this.hasLineTerminatorBeforeNext = false;
    this.tokenIndex = 0;
  }

  saveLexerState() {
    return {
      source: this.source,
      index: this.index,
      line: this.line,
      lineStart: this.lineStart,
      startIndex: this.startIndex,
      startLine: this.startLine,
      startLineStart: this.startLineStart,
      lastIndex: this.lastIndex,
      lastLine: this.lastLine,
      lastLineStart: this.lastLineStart,
      lookahead: this.lookahead,
      hasLineTerminatorBeforeNext: this.hasLineTerminatorBeforeNext,
      tokenIndex: this.tokenIndex,
    };
  }

  restoreLexerState(state) {
    this.source = state.source;
    this.index = state.index;
    this.line = state.line;
    this.lineStart = state.lineStart;
    this.startIndex = state.startIndex;
    this.startLine = state.startLine;
    this.startLineStart = state.startLineStart;
    this.lastIndex = state.lastIndex;
    this.lastLine = state.lastLine;
    this.lastLineStart = state.lastLineStart;
    this.lookahead = state.lookahead;
    this.hasLineTerminatorBeforeNext = state.hasLineTerminatorBeforeNext;
    this.tokenIndex = state.tokenIndex;
  }

  createILLEGAL() {
    this.startIndex = this.index;
    this.startLine = this.line;
    this.startLineStart = this.lineStart;
    return this.index < this.source.length
      ? this.createError(ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, this.source.charAt(this.index))
      : this.createError(ErrorMessages.UNEXPECTED_EOS);
  }

  createUnexpected(token) {
    switch (token.type.klass) {
      case TokenClass.Eof:
        return this.createError(ErrorMessages.UNEXPECTED_EOS);
      case TokenClass.Ident:
        return this.createError(ErrorMessages.UNEXPECTED_IDENTIFIER);
      case TokenClass.Keyword:
        if (token.type === TokenType.ESCAPED_KEYWORD) {
          return this.createError(ErrorMessages.UNEXPECTED_ESCAPED_KEYWORD);
        }
        return this.createError(ErrorMessages.UNEXPECTED_TOKEN, token.slice.text);
      case TokenClass.NumericLiteral:
        return this.createError(ErrorMessages.UNEXPECTED_NUMBER);
      case TokenClass.TemplateElement:
        return this.createError(ErrorMessages.UNEXPECTED_TEMPLATE);
      case TokenClass.Punctuator:
        return this.createError(ErrorMessages.UNEXPECTED_TOKEN, token.type.name);
      case TokenClass.StringLiteral:
        return this.createError(ErrorMessages.UNEXPECTED_STRING);
      // the other token classes are RegularExpression and Illegal, but they cannot reach here
    }
    // istanbul ignore next
    throw new Error('Unreachable: unexpected token of class ' + token.type.klass);
  }

  createError(message, ...params) {
    let msg;
    if (typeof message === 'function') {
      msg = message(...params);
    } else {
      msg = message;
    }
    return new JsError(this.startIndex, this.startLine + 1, this.startIndex - this.startLineStart + 1, msg);
  }

  createErrorWithLocation(location, message) {
    /* istanbul ignore next */
    let msg = message.replace(/\{(\d+)\}/g, (_, n) => JSON.stringify(arguments[+n + 2]));
    if (location.slice && location.slice.startLocation) {
      location = location.slice.startLocation;
    }
    return new JsError(location.offset, location.line, location.column + 1, msg);
  }

  static cse2(id, ch1, ch2) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2;
  }

  static cse3(id, ch1, ch2, ch3) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3;
  }

  static cse4(id, ch1, ch2, ch3, ch4) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4;
  }

  static cse5(id, ch1, ch2, ch3, ch4, ch5) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4 && id.charAt(5) === ch5;
  }

  static cse6(id, ch1, ch2, ch3, ch4, ch5, ch6) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4 && id.charAt(5) === ch5 && id.charAt(6) === ch6;
  }

  static cse7(id, ch1, ch2, ch3, ch4, ch5, ch6, ch7) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4 && id.charAt(5) === ch5 && id.charAt(6) === ch6 && id.charAt(7) === ch7;
  }

  getKeyword(id) {
    if (id.length === 1 || id.length > 10) {
      return TokenType.IDENTIFIER;
    }

    /* istanbul ignore next */
    switch (id.length) {
      case 2:
        switch (id.charAt(0)) {
          case 'i':
            switch (id.charAt(1)) {
              case 'f':
                return TokenType.IF;
              case 'n':
                return TokenType.IN;
              default:
                break;
            }
            break;
          case 'd':
            if (id.charAt(1) === 'o') {
              return TokenType.DO;
            }
            break;
        }
        break;
      case 3:
        switch (id.charAt(0)) {
          case 'v':
            if (Tokenizer.cse2(id, 'a', 'r')) {
              return TokenType.VAR;
            }
            break;
          case 'f':
            if (Tokenizer.cse2(id, 'o', 'r')) {
              return TokenType.FOR;
            }
            break;
          case 'n':
            if (Tokenizer.cse2(id, 'e', 'w')) {
              return TokenType.NEW;
            }
            break;
          case 't':
            if (Tokenizer.cse2(id, 'r', 'y')) {
              return TokenType.TRY;
            }
            break;
          case 'l':
            if (Tokenizer.cse2(id, 'e', 't')) {
              return TokenType.LET;
            }
            break;
        }
        break;
      case 4:
        switch (id.charAt(0)) {
          case 't':
            if (Tokenizer.cse3(id, 'h', 'i', 's')) {
              return TokenType.THIS;
            } else if (Tokenizer.cse3(id, 'r', 'u', 'e')) {
              return TokenType.TRUE;
            }
            break;
          case 'n':
            if (Tokenizer.cse3(id, 'u', 'l', 'l')) {
              return TokenType.NULL;
            }
            break;
          case 'e':
            if (Tokenizer.cse3(id, 'l', 's', 'e')) {
              return TokenType.ELSE;
            } else if (Tokenizer.cse3(id, 'n', 'u', 'm')) {
              return TokenType.ENUM;
            }
            break;
          case 'c':
            if (Tokenizer.cse3(id, 'a', 's', 'e')) {
              return TokenType.CASE;
            }
            break;
          case 'v':
            if (Tokenizer.cse3(id, 'o', 'i', 'd')) {
              return TokenType.VOID;
            }
            break;
          case 'w':
            if (Tokenizer.cse3(id, 'i', 't', 'h')) {
              return TokenType.WITH;
            }
            break;
        }
        break;
      case 5:
        switch (id.charAt(0)) {
          case 'a':
            if (Tokenizer.cse4(id, 's', 'y', 'n', 'c')) {
              return TokenType.ASYNC;
            }
            if (Tokenizer.cse4(id, 'w', 'a', 'i', 't')) {
              return TokenType.AWAIT;
            }
            break;
          case 'w':
            if (Tokenizer.cse4(id, 'h', 'i', 'l', 'e')) {
              return TokenType.WHILE;
            }
            break;
          case 'b':
            if (Tokenizer.cse4(id, 'r', 'e', 'a', 'k')) {
              return TokenType.BREAK;
            }
            break;
          case 'f':
            if (Tokenizer.cse4(id, 'a', 'l', 's', 'e')) {
              return TokenType.FALSE;
            }
            break;
          case 'c':
            if (Tokenizer.cse4(id, 'a', 't', 'c', 'h')) {
              return TokenType.CATCH;
            } else if (Tokenizer.cse4(id, 'o', 'n', 's', 't')) {
              return TokenType.CONST;
            } else if (Tokenizer.cse4(id, 'l', 'a', 's', 's')) {
              return TokenType.CLASS;
            }
            break;
          case 't':
            if (Tokenizer.cse4(id, 'h', 'r', 'o', 'w')) {
              return TokenType.THROW;
            }
            break;
          case 'y':
            if (Tokenizer.cse4(id, 'i', 'e', 'l', 'd')) {
              return TokenType.YIELD;
            }
            break;
          case 's':
            if (Tokenizer.cse4(id, 'u', 'p', 'e', 'r')) {
              return TokenType.SUPER;
            }
            break;
        }
        break;
      case 6:
        switch (id.charAt(0)) {
          case 'r':
            if (Tokenizer.cse5(id, 'e', 't', 'u', 'r', 'n')) {
              return TokenType.RETURN;
            }
            break;
          case 't':
            if (Tokenizer.cse5(id, 'y', 'p', 'e', 'o', 'f')) {
              return TokenType.TYPEOF;
            }
            break;
          case 'd':
            if (Tokenizer.cse5(id, 'e', 'l', 'e', 't', 'e')) {
              return TokenType.DELETE;
            }
            break;
          case 's':
            if (Tokenizer.cse5(id, 'w', 'i', 't', 'c', 'h')) {
              return TokenType.SWITCH;
            }
            break;
          case 'e':
            if (Tokenizer.cse5(id, 'x', 'p', 'o', 'r', 't')) {
              return TokenType.EXPORT;
            }
            break;
          case 'i':
            if (Tokenizer.cse5(id, 'm', 'p', 'o', 'r', 't')) {
              return TokenType.IMPORT;
            }
            break;
        }
        break;
      case 7:
        switch (id.charAt(0)) {
          case 'd':
            if (Tokenizer.cse6(id, 'e', 'f', 'a', 'u', 'l', 't')) {
              return TokenType.DEFAULT;
            }
            break;
          case 'f':
            if (Tokenizer.cse6(id, 'i', 'n', 'a', 'l', 'l', 'y')) {
              return TokenType.FINALLY;
            }
            break;
          case 'e':
            if (Tokenizer.cse6(id, 'x', 't', 'e', 'n', 'd', 's')) {
              return TokenType.EXTENDS;
            }
            break;
        }
        break;
      case 8:
        switch (id.charAt(0)) {
          case 'f':
            if (Tokenizer.cse7(id, 'u', 'n', 'c', 't', 'i', 'o', 'n')) {
              return TokenType.FUNCTION;
            }
            break;
          case 'c':
            if (Tokenizer.cse7(id, 'o', 'n', 't', 'i', 'n', 'u', 'e')) {
              return TokenType.CONTINUE;
            }
            break;
          case 'd':
            if (Tokenizer.cse7(id, 'e', 'b', 'u', 'g', 'g', 'e', 'r')) {
              return TokenType.DEBUGGER;
            }
            break;
        }
        break;
      case 10:
        if (id === 'instanceof') {
          return TokenType.INSTANCEOF;
        }
        break;
    }
    return TokenType.IDENTIFIER;
  }

  skipSingleLineComment(offset) {
    this.index += offset;
    while (this.index < this.source.length) {
      /**
       * @type {Number}
       */
      let chCode = this.source.charCodeAt(this.index);
      this.index++;
      if (isLineTerminator(chCode)) {
        this.hasLineTerminatorBeforeNext = true;
        if (chCode === 0xD /* "\r" */ && this.source.charCodeAt(this.index) === 0xA /* "\n" */) {
          this.index++;
        }
        this.lineStart = this.index;
        this.line++;
        return;
      }
    }
  }

  skipMultiLineComment() {
    this.index += 2;
    const length = this.source.length;
    let isLineStart = false;
    while (this.index < length) {
      let chCode = this.source.charCodeAt(this.index);
      if (chCode < 0x80) {
        switch (chCode) {
          case 42: // "*"
            // Block comment ends with "*/".
            if (this.source.charAt(this.index + 1) === '/') {
              this.index = this.index + 2;
              return isLineStart;
            }
            this.index++;
            break;
          case 10: // "\n"
            isLineStart = true;
            this.hasLineTerminatorBeforeNext = true;
            this.index++;
            this.lineStart = this.index;
            this.line++;
            break;
          case 13: // "\r":
            isLineStart = true;
            this.hasLineTerminatorBeforeNext = true;
            if (this.source.charAt(this.index + 1) === '\n') {
              this.index++;
            }
            this.index++;
            this.lineStart = this.index;
            this.line++;
            break;
          default:
            this.index++;
        }
      } else if (chCode === 0x2028 || chCode === 0x2029) {
        isLineStart = true;
        this.hasLineTerminatorBeforeNext = true;
        this.index++;
        this.lineStart = this.index;
        this.line++;
      } else {
        this.index++;
      }
    }
    throw this.createILLEGAL();
  }


  skipComment() {
    this.hasLineTerminatorBeforeNext = false;

    let isLineStart = this.index === 0;
    const length = this.source.length;

    while (this.index < length) {
      let chCode = this.source.charCodeAt(this.index);
      if (isWhiteSpace(chCode)) {
        this.index++;
      } else if (isLineTerminator(chCode)) {
        this.hasLineTerminatorBeforeNext = true;
        this.index++;
        if (chCode === 13 /* "\r" */ && this.source.charAt(this.index) === '\n') {
          this.index++;
        }
        this.lineStart = this.index;
        this.line++;
        isLineStart = true;
      } else if (chCode === 47 /* "/" */) {
        if (this.index + 1 >= length) {
          break;
        }
        chCode = this.source.charCodeAt(this.index + 1);
        if (chCode === 47 /* "/" */) {
          this.skipSingleLineComment(2);
          isLineStart = true;
        } else if (chCode === 42 /* "*" */) {
          isLineStart = this.skipMultiLineComment() || isLineStart;
        } else {
          break;
        }
      } else if (!this.moduleIsTheGoalSymbol && isLineStart && chCode === 45 /* "-" */) {
        if (this.index + 2 >= length) {
          break;
        }
        // U+003E is ">"
        if (this.source.charAt(this.index + 1) === '-' && this.source.charAt(this.index + 2) === '>') {
          // "-->" is a single-line comment
          this.skipSingleLineComment(3);
        } else {
          break;
        }
      } else if (!this.moduleIsTheGoalSymbol && chCode === 60 /* "<" */) {
        if (this.source.slice(this.index + 1, this.index + 4) === '!--') {
          this.skipSingleLineComment(4);
          isLineStart = true;
        } else {
          break;
        }
      } else {
        break;
      }
    }
  }

  scanHexEscape2() {
    if (this.index + 2 > this.source.length) {
      return -1;
    }
    let r1 = getHexValue(this.source.charAt(this.index));
    if (r1 === -1) {
      return -1;
    }
    let r2 = getHexValue(this.source.charAt(this.index + 1));
    if (r2 === -1) {
      return -1;
    }
    this.index += 2;
    return r1 << 4 | r2;
  }

  scanUnicode() {
    if (this.source.charAt(this.index) === '{') {
      // \u{HexDigits}
      let i = this.index + 1;
      let hexDigits = 0, ch;
      while (i < this.source.length) {
        ch = this.source.charAt(i);
        let hex = getHexValue(ch);
        if (hex === -1) {
          break;
        }
        hexDigits = hexDigits << 4 | hex;
        if (hexDigits > 0x10FFFF) {
          throw this.createILLEGAL();
        }
        i++;
      }
      if (ch !== '}') {
        throw this.createILLEGAL();
      }
      if (i === this.index + 1) {
        ++this.index; // This is so that the error is 'Unexpected "}"' instead of 'Unexpected "{"'.
        throw this.createILLEGAL();
      }
      this.index = i + 1;
      return hexDigits;
    }
    // \uHex4Digits
    if (this.index + 4 > this.source.length) {
      return -1;
    }
    let r1 = getHexValue(this.source.charAt(this.index));
    if (r1 === -1) {
      return -1;
    }
    let r2 = getHexValue(this.source.charAt(this.index + 1));
    if (r2 === -1) {
      return -1;
    }
    let r3 = getHexValue(this.source.charAt(this.index + 2));
    if (r3 === -1) {
      return -1;
    }
    let r4 = getHexValue(this.source.charAt(this.index + 3));
    if (r4 === -1) {
      return -1;
    }
    this.index += 4;
    return r1 << 12 | r2 << 8 | r3 << 4 | r4;
  }

  getEscapedIdentifier() {
    let id = '';
    let check = isIdentifierStart;

    while (this.index < this.source.length) {
      let ch = this.source.charAt(this.index);
      let code = ch.charCodeAt(0);
      let start = this.index;
      ++this.index;
      if (ch === '\\') {
        if (this.index >= this.source.length) {
          throw this.createILLEGAL();
        }
        if (this.source.charAt(this.index) !== 'u') {
          throw this.createILLEGAL();
        }
        ++this.index;
        code = this.scanUnicode();
        if (code < 0) {
          throw this.createILLEGAL();
        }
        ch = fromCodePoint(code);
      } else if (code >= 0xD800 && code <= 0xDBFF) {
        if (this.index >= this.source.length) {
          throw this.createILLEGAL();
        }
        let lowSurrogateCode = this.source.charCodeAt(this.index);
        ++this.index;
        if (!(lowSurrogateCode >= 0xDC00 && lowSurrogateCode <= 0xDFFF)) {
          throw this.createILLEGAL();
        }
        code = decodeUtf16(code, lowSurrogateCode);
        ch = fromCodePoint(code);
      }
      if (!check(code)) {
        if (id.length < 1) {
          throw this.createILLEGAL();
        }
        this.index = start;
        return id;
      }
      check = isIdentifierPart;
      id += ch;
    }
    return id;
  }

  getIdentifier() {
    let start = this.index;
    let l = this.source.length;
    let i = this.index;
    let check = isIdentifierStart;
    while (i < l) {
      let ch = this.source.charAt(i);
      let code = ch.charCodeAt(0);
      if (ch === '\\' || code >= 0xD800 && code <= 0xDBFF) {
        // Go back and try the hard one.
        this.index = start;
        return this.getEscapedIdentifier();
      }
      if (!check(code)) {
        this.index = i;
        return this.source.slice(start, i);
      }
      ++i;
      check = isIdentifierPart;
    }
    this.index = i;
    return this.source.slice(start, i);
  }

  scanIdentifier() {
    let startLocation = this.getLocation();
    let start = this.index;

    // Backslash (U+005C) starts an escaped character.
    let id = this.source.charAt(this.index) === '\\' ? this.getEscapedIdentifier() : this.getIdentifier();

    let slice = this.getSlice(start, startLocation);
    slice.text = id;
    let hasEscape = this.index - start !== id.length;

    let type = this.getKeyword(id);
    if (hasEscape && type !== TokenType.IDENTIFIER) {
      type = TokenType.ESCAPED_KEYWORD;
    }
    return { type, value: id, slice, escaped: hasEscape };
  }

  getLocation() {
    return {
      line: this.startLine + 1,
      column: this.startIndex - this.startLineStart,
      offset: this.startIndex,
    };
  }

  getLastTokenEndLocation() {
    return {
      line: this.lastLine + 1,
      column: this.lastIndex - this.lastLineStart,
      offset: this.lastIndex,
    };
  }

  getSlice(start, startLocation) {
    return { text: this.source.slice(start, this.index), start, startLocation, end: this.index };
  }

  scanPunctuatorHelper() {
    let ch1 = this.source.charAt(this.index);

    switch (ch1) {
      // Check for most common single-character punctuators.
      case '.': {
        let ch2 = this.source.charAt(this.index + 1);
        if (ch2 !== '.') return TokenType.PERIOD;
        let ch3 = this.source.charAt(this.index + 2);
        if (ch3 !== '.') return TokenType.PERIOD;
        return TokenType.ELLIPSIS;
      }
      case '(':
        return TokenType.LPAREN;
      case ')':
      case ';':
      case ',':
        return ONE_CHAR_PUNCTUATOR[ch1.charCodeAt(0)];
      case '{':
        return TokenType.LBRACE;
      case '}':
      case '[':
      case ']':
      case ':':
      case '?':
      case '~':
        return ONE_CHAR_PUNCTUATOR[ch1.charCodeAt(0)];
      default:
        // "=" (U+003D) marks an assignment or comparison operator.
        if (this.index + 1 < this.source.length && this.source.charAt(this.index + 1) === '=') {
          switch (ch1) {
            case '=':
              if (this.index + 2 < this.source.length && this.source.charAt(this.index + 2) === '=') {
                return TokenType.EQ_STRICT;
              }
              return TokenType.EQ;
            case '!':
              if (this.index + 2 < this.source.length && this.source.charAt(this.index + 2) === '=') {
                return TokenType.NE_STRICT;
              }
              return TokenType.NE;
            case '|':
              return TokenType.ASSIGN_BIT_OR;
            case '+':
              return TokenType.ASSIGN_ADD;
            case '-':
              return TokenType.ASSIGN_SUB;
            case '*':
              return TokenType.ASSIGN_MUL;
            case '<':
              return TokenType.LTE;
            case '>':
              return TokenType.GTE;
            case '/':
              return TokenType.ASSIGN_DIV;
            case '%':
              return TokenType.ASSIGN_MOD;
            case '^':
              return TokenType.ASSIGN_BIT_XOR;
            case '&':
              return TokenType.ASSIGN_BIT_AND;
            // istanbul ignore next
            default:
              break; // failed
          }
        }
    }

    if (this.index + 1 < this.source.length) {
      let ch2 = this.source.charAt(this.index + 1);
      if (ch1 === ch2) {
        if (this.index + 2 < this.source.length) {
          let ch3 = this.source.charAt(this.index + 2);
          if (ch1 === '>' && ch3 === '>') {
            // 4-character punctuator: >>>=
            if (this.index + 3 < this.source.length && this.source.charAt(this.index + 3) === '=') {
              return TokenType.ASSIGN_SHR_UNSIGNED;
            }
            return TokenType.SHR_UNSIGNED;
          }

          if (ch1 === '<' && ch3 === '=') {
            return TokenType.ASSIGN_SHL;
          }

          if (ch1 === '>' && ch3 === '=') {
            return TokenType.ASSIGN_SHR;
          }

          if (ch1 === '*' && ch3 === '=') {
            return TokenType.ASSIGN_EXP;
          }
        }
        // Other 2-character punctuators: ++ -- << >> && ||
        switch (ch1) {
          case '*':
            return TokenType.EXP;
          case '+':
            return TokenType.INC;
          case '-':
            return TokenType.DEC;
          case '<':
            return TokenType.SHL;
          case '>':
            return TokenType.SHR;
          case '&':
            return TokenType.AND;
          case '|':
            return TokenType.OR;
          // istanbul ignore next
          default:
            break; // failed
        }
      } else if (ch1 === '=' && ch2 === '>') {
        return TokenType.ARROW;
      }
    }

    return ONE_CHAR_PUNCTUATOR[ch1.charCodeAt(0)];
  }

  // 7.7 Punctuators
  scanPunctuator() {
    let startLocation = this.getLocation();
    let start = this.index;
    let subType = this.scanPunctuatorHelper();
    this.index += subType.name.length;
    return { type: subType, value: subType.name, slice: this.getSlice(start, startLocation) };
  }

  scanHexLiteral(start, startLocation) {
    let i = this.index;
    while (i < this.source.length) {
      let ch = this.source.charAt(i);
      let hex = getHexValue(ch);
      if (hex === -1) {
        break;
      }
      i++;
    }

    if (this.index === i) {
      throw this.createILLEGAL();
    }

    if (i < this.source.length && isIdentifierStart(this.source.charCodeAt(i))) {
      throw this.createILLEGAL();
    }

    this.index = i;

    let slice = this.getSlice(start, startLocation);
    return { type: TokenType.NUMBER, value: parseInt(slice.text.substr(2), 16), slice };
  }

  scanBinaryLiteral(start, startLocation) {
    let offset = this.index - start;

    while (this.index < this.source.length) {
      let ch = this.source.charAt(this.index);
      if (ch !== '0' && ch !== '1') {
        break;
      }
      this.index++;
    }

    if (this.index - start <= offset) {
      throw this.createILLEGAL();
    }

    if (this.index < this.source.length && (isIdentifierStart(this.source.charCodeAt(this.index))
        || isDecimalDigit(this.source.charCodeAt(this.index)))) {
      throw this.createILLEGAL();
    }

    return {
      type: TokenType.NUMBER,
      value: parseInt(this.getSlice(start, startLocation).text.substr(offset), 2),
      slice: this.getSlice(start, startLocation),
      octal: false,
      noctal: false,
    };
  }

  scanOctalLiteral(start, startLocation) {
    while (this.index < this.source.length) {
      let ch = this.source.charAt(this.index);
      if (ch >= '0' && ch <= '7') {
        this.index++;
      } else if (isIdentifierPart(ch.charCodeAt(0))) {
        throw this.createILLEGAL();
      } else {
        break;
      }
    }

    if (this.index - start === 2) {
      throw this.createILLEGAL();
    }

    return {
      type: TokenType.NUMBER,
      value: parseInt(this.getSlice(start, startLocation).text.substr(2), 8),
      slice: this.getSlice(start, startLocation),
      octal: false,
      noctal: false,
    };
  }

  scanLegacyOctalLiteral(start, startLocation) {
    let isOctal = true;

    while (this.index < this.source.length) {
      let ch = this.source.charAt(this.index);
      if (ch >= '0' && ch <= '7') {
        this.index++;
      } else if (ch === '8' || ch === '9') {
        isOctal = false;
        this.index++;
      } else if (isIdentifierPart(ch.charCodeAt(0))) {
        throw this.createILLEGAL();
      } else {
        break;
      }
    }

    let slice = this.getSlice(start, startLocation);
    if (!isOctal) {
      this.eatDecimalLiteralSuffix();
      return {
        type: TokenType.NUMBER,
        slice,
        value: +slice.text,
        octal: true,
        noctal: !isOctal,
      };
    }

    return {
      type: TokenType.NUMBER,
      slice,
      value: parseInt(slice.text.substr(1), 8),
      octal: true,
      noctal: !isOctal,
    };
  }

  scanNumericLiteral() {
    let ch = this.source.charAt(this.index);
    // assert(ch === "." || "0" <= ch && ch <= "9")
    let startLocation = this.getLocation();
    let start = this.index;

    if (ch === '0') {
      this.index++;
      if (this.index < this.source.length) {
        ch = this.source.charAt(this.index);
        if (ch === 'x' || ch === 'X') {
          this.index++;
          return this.scanHexLiteral(start, startLocation);
        } else if (ch === 'b' || ch === 'B') {
          this.index++;
          return this.scanBinaryLiteral(start, startLocation);
        } else if (ch === 'o' || ch === 'O') {
          this.index++;
          return this.scanOctalLiteral(start, startLocation);
        } else if (ch >= '0' && ch <= '9') {
          return this.scanLegacyOctalLiteral(start, startLocation);
        }
      } else {
        let slice = this.getSlice(start, startLocation);
        return {
          type: TokenType.NUMBER,
          value: +slice.text,
          slice,
          octal: false,
          noctal: false,
        };
      }
    } else if (ch !== '.') {
      // Must be "1".."9"
      ch = this.source.charAt(this.index);
      while (ch >= '0' && ch <= '9') {
        this.index++;
        if (this.index === this.source.length) {
          let slice = this.getSlice(start, startLocation);
          return {
            type: TokenType.NUMBER,
            value: +slice.text,
            slice,
            octal: false,
            noctal: false,
          };
        }
        ch = this.source.charAt(this.index);
      }
    }

    this.eatDecimalLiteralSuffix();

    if (this.index !== this.source.length && isIdentifierStart(this.source.charCodeAt(this.index))) {
      throw this.createILLEGAL();
    }

    let slice = this.getSlice(start, startLocation);
    return {
      type: TokenType.NUMBER,
      value: +slice.text,
      slice,
      octal: false,
      noctal: false,
    };
  }

  eatDecimalLiteralSuffix() {
    let ch = this.source.charAt(this.index);
    if (ch === '.') {
      this.index++;
      if (this.index === this.source.length) {
        return;
      }

      ch = this.source.charAt(this.index);
      while (ch >= '0' && ch <= '9') {
        this.index++;
        if (this.index === this.source.length) {
          return;
        }
        ch = this.source.charAt(this.index);
      }
    }

    // EOF not reached here
    if (ch === 'e' || ch === 'E') {
      this.index++;
      if (this.index === this.source.length) {
        throw this.createILLEGAL();
      }

      ch = this.source.charAt(this.index);
      if (ch === '+' || ch === '-') {
        this.index++;
        if (this.index === this.source.length) {
          throw this.createILLEGAL();
        }
        ch = this.source.charAt(this.index);
      }

      if (ch >= '0' && ch <= '9') {
        while (ch >= '0' && ch <= '9') {
          this.index++;
          if (this.index === this.source.length) {
            break;
          }
          ch = this.source.charAt(this.index);
        }
      } else {
        throw this.createILLEGAL();
      }
    }
  }

  scanStringEscape(str, octal) {
    this.index++;
    if (this.index === this.source.length) {
      throw this.createILLEGAL();
    }
    let ch = this.source.charAt(this.index);
    if (isLineTerminator(ch.charCodeAt(0))) {
      this.index++;
      if (ch === '\r' && this.source.charAt(this.index) === '\n') {
        this.index++;
      }
      this.lineStart = this.index;
      this.line++;
    } else {
      switch (ch) {
        case 'n':
          str += '\n';
          this.index++;
          break;
        case 'r':
          str += '\r';
          this.index++;
          break;
        case 't':
          str += '\t';
          this.index++;
          break;
        case 'u':
        case 'x': {
          let unescaped;
          this.index++;
          if (this.index >= this.source.length) {
            throw this.createILLEGAL();
          }
          unescaped = ch === 'u' ? this.scanUnicode() : this.scanHexEscape2();
          if (unescaped < 0) {
            throw this.createILLEGAL();
          }
          str += fromCodePoint(unescaped);
          break;
        }
        case 'b':
          str += '\b';
          this.index++;
          break;
        case 'f':
          str += '\f';
          this.index++;
          break;
        case 'v':
          str += '\u000B';
          this.index++;
          break;
        default:
          if (ch >= '0' && ch <= '7') {
            let octalStart = this.index;
            let octLen = 1;
            // 3 digits are only allowed when string starts
            // with 0, 1, 2, 3
            if (ch >= '0' && ch <= '3') {
              octLen = 0;
            }
            let code = 0;
            while (octLen < 3 && ch >= '0' && ch <= '7') {
              this.index++;
              if (octLen > 0 || ch !== '0') {
                octal = this.source.slice(octalStart, this.index);
              }
              code *= 8;
              code += ch - '0';
              octLen++;
              if (this.index === this.source.length) {
                throw this.createILLEGAL();
              }
              ch = this.source.charAt(this.index);
            }
            if (code === 0 && octLen === 1 && (ch === '8' || ch === '9')) {
              octal = this.source.slice(octalStart, this.index + 1);
            }
            str += String.fromCharCode(code);
          } else if (ch === '8' || ch === '9') {
            throw this.createILLEGAL();
          } else {
            str += ch;
            this.index++;
          }
      }
    }
    return [str, octal];
  }
  // 7.8.4 String Literals
  scanStringLiteral() {
    let str = '';

    let quote = this.source.charAt(this.index);
    //  assert((quote === "\"" || quote === """), "String literal must starts with a quote")

    let startLocation = this.getLocation();
    let start = this.index;
    this.index++;

    let octal = null;
    while (this.index < this.source.length) {
      let ch = this.source.charAt(this.index);
      if (ch === quote) {
        this.index++;
        return { type: TokenType.STRING, slice: this.getSlice(start, startLocation), str, octal };
      } else if (ch === '\\') {
        [str, octal] = this.scanStringEscape(str, octal);
      } else if (isLineTerminator(ch.charCodeAt(0))) {
        throw this.createILLEGAL();
      } else {
        str += ch;
        this.index++;
      }
    }

    throw this.createILLEGAL();
  }

  scanTemplateElement() {
    let startLocation = this.getLocation();
    let start = this.index;
    this.index++;
    while (this.index < this.source.length) {
      let ch = this.source.charCodeAt(this.index);
      switch (ch) {
        case 0x60: { // `
          this.index++;
          return { type: TokenType.TEMPLATE, tail: true, slice: this.getSlice(start, startLocation) };
        }
        case 0x24: { // $
          if (this.source.charCodeAt(this.index + 1) === 0x7B) { // {
            this.index += 2;
            return { type: TokenType.TEMPLATE, tail: false, slice: this.getSlice(start, startLocation) };
          }
          this.index++;
          break;
        }
        case 0x5C: { // \\
          let octal = this.scanStringEscape('', null)[1];
          if (octal != null) {
            throw this.createError(ErrorMessages.NO_OCTALS_IN_TEMPLATES);
          }
          break;
        }
        case 0x0D: { // \r
          this.line++;
          this.index++;
          if (this.index < this.source.length && this.source.charAt(this.index) === '\n') {
            this.index++;
          }
          this.lineStart = this.index;
          break;
        }
        case 0x0A: // \r
        case 0x2028:
        case 0x2029: {
          this.line++;
          this.index++;
          this.lineStart = this.index;
          break;
        }
        default:
          this.index++;
      }
    }

    throw this.createILLEGAL();
  }

  scanRegExp(str) {
    let startLocation = this.getLocation();
    let start = this.index;

    let terminated = false;
    let classMarker = false;
    while (this.index < this.source.length) {
      let ch = this.source.charAt(this.index);
      if (ch === '\\') {
        str += ch;
        this.index++;
        ch = this.source.charAt(this.index);
        // ECMA-262 7.8.5
        if (isLineTerminator(ch.charCodeAt(0))) {
          throw this.createError(ErrorMessages.UNTERMINATED_REGEXP);
        }
        str += ch;
        this.index++;
      } else if (isLineTerminator(ch.charCodeAt(0))) {
        throw this.createError(ErrorMessages.UNTERMINATED_REGEXP);
      } else {
        if (classMarker) {
          if (ch === ']') {
            classMarker = false;
          }
        } else if (ch === '/') {
          terminated = true;
          str += ch;
          this.index++;
          break;
        } else if (ch === '[') {
          classMarker = true;
        }
        str += ch;
        this.index++;
      }
    }

    if (!terminated) {
      throw this.createError(ErrorMessages.UNTERMINATED_REGEXP);
    }

    while (this.index < this.source.length) {
      let ch = this.source.charAt(this.index);
      if (ch === '\\') {
        throw this.createError(ErrorMessages.INVALID_REGEXP_FLAGS);
      }
      if (!isIdentifierPart(ch.charCodeAt(0))) {
        break;
      }
      this.index++;
      str += ch;
    }
    return { type: TokenType.REGEXP, value: str, slice: this.getSlice(start, startLocation) };
  }

  advance() {
    let startLocation = this.getLocation();

    this.lastIndex = this.index;
    this.lastLine = this.line;
    this.lastLineStart = this.lineStart;

    this.skipComment();

    this.startIndex = this.index;
    this.startLine = this.line;
    this.startLineStart = this.lineStart;

    if (this.lastIndex === 0) {
      this.lastIndex = this.index;
      this.lastLine = this.line;
      this.lastLineStart = this.lineStart;
    }

    if (this.index >= this.source.length) {
      return { type: TokenType.EOS, slice: this.getSlice(this.index, startLocation) };
    }

    let charCode = this.source.charCodeAt(this.index);

    if (charCode < 0x80) {
      if (PUNCTUATOR_START[charCode]) {
        return this.scanPunctuator();
      }

      if (isIdentifierStart(charCode) || charCode === 0x5C /* backslash (\) */) {
        return this.scanIdentifier();
      }

      // Dot (.) U+002E can also start a floating-point number, hence the need
      // to check the next character.
      if (charCode === 0x2E) {
        if (this.index + 1 < this.source.length && isDecimalDigit(this.source.charCodeAt(this.index + 1))) {
          return this.scanNumericLiteral();
        }
        return this.scanPunctuator();
      }

      // String literal starts with single quote (U+0027) or double quote (U+0022).
      if (charCode === 0x27 || charCode === 0x22) {
        return this.scanStringLiteral();
      }

      // Template literal starts with back quote (U+0060)
      if (charCode === 0x60) {
        return this.scanTemplateElement();
      }

      if (charCode /* "0" */ >= 0x30 && charCode <= 0x39 /* "9" */) {
        return this.scanNumericLiteral();
      }

      // Slash (/) U+002F can also start a regex.
      throw this.createILLEGAL();
    } else {
      if (isIdentifierStart(charCode) || charCode >= 0xD800 && charCode <= 0xDBFF) {
        return this.scanIdentifier();
      }

      throw this.createILLEGAL();
    }
  }

  eof() {
    return this.lookahead.type === TokenType.EOS;
  }

  lex() {
    let prevToken = this.lookahead;
    this.lookahead = this.advance();
    this.tokenIndex++;
    return prevToken;
  }
}
