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

import { ErrorMessages } from './errors.js';

import acceptRegex from '../../_snowpack/pkg/shift-regexp-acceptor.js';

import Tokenizer, { TokenClass, TokenType } from './tokenizer.js';

import * as AST from '../../_snowpack/pkg/shift-ast.js';

// Empty parameter list for ArrowExpression
const ARROW_EXPRESSION_PARAMS = 'CoverParenthesizedExpressionAndArrowParameterList';
const EXPORT_UNKNOWN_SPECIFIER = 'ExportNameOfUnknownType';

const Precedence = {
  Sequence: 0,
  Yield: 1,
  Assignment: 1,
  Conditional: 2,
  ArrowFunction: 2,
  LogicalOR: 3,
  LogicalAND: 4,
  BitwiseOR: 5,
  BitwiseXOR: 6,
  BitwiseAND: 7,
  Equality: 8,
  Relational: 9,
  BitwiseSHIFT: 10,
  Additive: 11,
  Multiplicative: 12,
  Unary: 13,
  Postfix: 14,
  Call: 15,
  New: 16,
  TaggedTemplate: 17,
  Member: 18,
  Primary: 19,
};

const BinaryPrecedence = {
  '||': Precedence.LogicalOR,
  '&&': Precedence.LogicalAND,
  '|': Precedence.BitwiseOR,
  '^': Precedence.BitwiseXOR,
  '&': Precedence.BitwiseAND,
  '==': Precedence.Equality,
  '!=': Precedence.Equality,
  '===': Precedence.Equality,
  '!==': Precedence.Equality,
  '<': Precedence.Relational,
  '>': Precedence.Relational,
  '<=': Precedence.Relational,
  '>=': Precedence.Relational,
  'in': Precedence.Relational,
  'instanceof': Precedence.Relational,
  '<<': Precedence.BitwiseSHIFT,
  '>>': Precedence.BitwiseSHIFT,
  '>>>': Precedence.BitwiseSHIFT,
  '+': Precedence.Additive,
  '-': Precedence.Additive,
  '*': Precedence.Multiplicative,
  '%': Precedence.Multiplicative,
  '/': Precedence.Multiplicative,
};

function isValidSimpleAssignmentTarget(node) {
  if (node == null) return false;
  switch (node.type) {
    case 'IdentifierExpression':
    case 'ComputedMemberExpression':
    case 'StaticMemberExpression':
      return true;
  }
  return false;
}

function isPrefixOperator(token) {
  switch (token.type) {
    case TokenType.INC:
    case TokenType.DEC:
    case TokenType.ADD:
    case TokenType.SUB:
    case TokenType.BIT_NOT:
    case TokenType.NOT:
    case TokenType.DELETE:
    case TokenType.VOID:
    case TokenType.TYPEOF:
      return true;
  }
  return false;
}

function isUpdateOperator(token) {
  return token.type === TokenType.INC || token.type === TokenType.DEC;
}

export class GenericParser extends Tokenizer {
  constructor(source) {
    super(source);
    this.allowIn = true;
    this.inFunctionBody = false;
    this.inParameter = false;
    this.allowYieldExpression = false;
    this.allowAwaitExpression = false;
    this.firstAwaitLocation = null; // for forbidding `await` in async arrow params.
    this.module = false;
    this.moduleIsTheGoalSymbol = false;
    this.strict = false;

    // Cover grammar
    this.isBindingElement = true;
    this.isAssignmentTarget = true;
    this.firstExprError = null;
  }

  match(subType) {
    return this.lookahead.type === subType;
  }

  matchIdentifier() {
    switch (this.lookahead.type) {
      case TokenType.IDENTIFIER:
      case TokenType.LET:
      case TokenType.YIELD:
      case TokenType.ASYNC:
        return true;
      case TokenType.AWAIT:
        if (!this.moduleIsTheGoalSymbol) {
          if (this.firstAwaitLocation === null) {
            this.firstAwaitLocation = this.getLocation();
          }
          return true;
        }
        return false;
      case TokenType.ESCAPED_KEYWORD:
        if (this.lookahead.value === 'await' && !this.moduleIsTheGoalSymbol) {
          if (this.firstAwaitLocation === null) {
            this.firstAwaitLocation = this.getLocation();
          }
          return true;
        }
        return this.lookahead.value === 'let'
          || this.lookahead.value === 'yield'
          || this.lookahead.value === 'async';
    }
    return false;
  }

  eat(tokenType) {
    if (this.lookahead.type === tokenType) {
      return this.lex();
    }
    return null;
  }

  expect(tokenType) {
    if (this.lookahead.type === tokenType) {
      return this.lex();
    }
    throw this.createUnexpected(this.lookahead);
  }

  matchContextualKeyword(keyword) {
    return this.lookahead.type === TokenType.IDENTIFIER && !this.lookahead.escaped && this.lookahead.value === keyword;
  }

  expectContextualKeyword(keyword) {
    if (this.lookahead.type === TokenType.IDENTIFIER && !this.lookahead.escaped && this.lookahead.value === keyword) {
      return this.lex();
    }
    throw this.createUnexpected(this.lookahead);
  }

  eatContextualKeyword(keyword) {
    if (this.lookahead.type === TokenType.IDENTIFIER && !this.lookahead.escaped && this.lookahead.value === keyword) {
      return this.lex();
    }
    return null;
  }

  consumeSemicolon() {
    if (this.eat(TokenType.SEMICOLON)) return;
    if (this.hasLineTerminatorBeforeNext) return;
    if (!this.eof() && !this.match(TokenType.RBRACE)) {
      throw this.createUnexpected(this.lookahead);
    }
  }

  // this is a no-op, reserved for future use
  startNode(node) {
    return node;
  }

  copyNode(src, dest) {
    return dest;
  }

  finishNode(node /* , startState */) {
    return node;
  }

  parseModule() {
    this.moduleIsTheGoalSymbol = this.module = this.strict = true;
    this.lookahead = this.advance();

    let startState = this.startNode();
    let { directives, statements } = this.parseBody();
    if (!this.match(TokenType.EOS)) {
      throw this.createUnexpected(this.lookahead);
    }
    return this.finishNode(new AST.Module({ directives, items: statements }), startState);
  }

  parseScript() {
    this.lookahead = this.advance();

    let startState = this.startNode();
    let { directives, statements } = this.parseBody();
    if (!this.match(TokenType.EOS)) {
      throw this.createUnexpected(this.lookahead);
    }
    return this.finishNode(new AST.Script({ directives, statements }), startState);
  }

  parseFunctionBody() {
    let oldInFunctionBody = this.inFunctionBody;
    let oldModule = this.module;
    let oldStrict = this.strict;
    this.inFunctionBody = true;
    this.module = false;

    let startState = this.startNode();
    this.expect(TokenType.LBRACE);
    let body = new AST.FunctionBody(this.parseBody());
    this.expect(TokenType.RBRACE);
    body = this.finishNode(body, startState);

    this.inFunctionBody = oldInFunctionBody;
    this.module = oldModule;
    this.strict = oldStrict;

    return body;
  }

  parseBody() {
    let directives = [], statements = [], parsingDirectives = true, directiveOctal = null;

    while (true) {
      if (this.eof() || this.match(TokenType.RBRACE)) break;
      let token = this.lookahead;
      let text = token.slice.text;
      let isStringLiteral = token.type === TokenType.STRING;
      let isModule = this.module;
      let directiveLocation = this.getLocation();
      let directiveStartState = this.startNode();
      let stmt = isModule ? this.parseModuleItem() : this.parseStatementListItem();
      if (parsingDirectives) {
        if (isStringLiteral && stmt.type === 'ExpressionStatement' && stmt.expression.type === 'LiteralStringExpression') {
          if (!directiveOctal && token.octal) {
            directiveOctal = this.createErrorWithLocation(directiveLocation, 'Unexpected legacy octal escape sequence: \\' + token.octal);
          }
          let rawValue = text.slice(1, -1);
          if (rawValue === 'use strict') {
            this.strict = true;
          }
          directives.push(this.finishNode(new AST.Directive({ rawValue }), directiveStartState));
        } else {
          parsingDirectives = false;
          if (directiveOctal && this.strict) {
            throw directiveOctal;
          }
          statements.push(stmt);
        }
      } else {
        statements.push(stmt);
      }
    }
    if (directiveOctal && this.strict) {
      throw directiveOctal;
    }

    return { directives, statements };
  }

  parseImportSpecifier() {
    let startState = this.startNode(), name;
    if (this.matchIdentifier()) {
      name = this.parseIdentifier();
      if (!this.eatContextualKeyword('as')) {
        return this.finishNode(new AST.ImportSpecifier({
          name: null,
          binding: this.finishNode(new AST.BindingIdentifier({ name }), startState),
        }), startState);
      }
    } else if (this.lookahead.type.klass.isIdentifierName) {
      name = this.parseIdentifierName();
      this.expectContextualKeyword('as');
    }

    return this.finishNode(new AST.ImportSpecifier({ name, binding: this.parseBindingIdentifier() }), startState);
  }

  parseNameSpaceBinding() {
    this.expect(TokenType.MUL);
    this.expectContextualKeyword('as');
    return this.parseBindingIdentifier();
  }

  parseNamedImports() {
    let result = [];
    this.expect(TokenType.LBRACE);
    while (!this.eat(TokenType.RBRACE)) {
      result.push(this.parseImportSpecifier());
      if (!this.eat(TokenType.COMMA)) {
        this.expect(TokenType.RBRACE);
        break;
      }
    }
    return result;
  }

  parseFromClause() {
    this.expectContextualKeyword('from');
    let value = this.expect(TokenType.STRING).str;
    return value;
  }

  parseImportDeclaration() {
    let startState = this.startNode(), defaultBinding = null, moduleSpecifier;
    this.expect(TokenType.IMPORT);
    if (this.match(TokenType.STRING)) {
      moduleSpecifier = this.lex().str;
      this.consumeSemicolon();
      return this.finishNode(new AST.Import({ defaultBinding: null, namedImports: [], moduleSpecifier }), startState);
    }
    if (this.matchIdentifier()) {
      defaultBinding = this.parseBindingIdentifier();
      if (!this.eat(TokenType.COMMA)) {
        let decl = new AST.Import({ defaultBinding, namedImports: [], moduleSpecifier: this.parseFromClause() });
        this.consumeSemicolon();
        return this.finishNode(decl, startState);
      }
    }
    if (this.match(TokenType.MUL)) {
      let decl = new AST.ImportNamespace({
        defaultBinding,
        namespaceBinding: this.parseNameSpaceBinding(),
        moduleSpecifier: this.parseFromClause(),
      });
      this.consumeSemicolon();
      return this.finishNode(decl, startState);
    } else if (this.match(TokenType.LBRACE)) {
      let decl = new AST.Import({
        defaultBinding,
        namedImports: this.parseNamedImports(),
        moduleSpecifier: this.parseFromClause(),
      });
      this.consumeSemicolon();
      return this.finishNode(decl, startState);
    }
    throw this.createUnexpected(this.lookahead);
  }

  parseExportSpecifier() {
    let startState = this.startNode();
    let name = this.finishNode({ type: EXPORT_UNKNOWN_SPECIFIER, isIdentifier: this.matchIdentifier(), value: this.parseIdentifierName() }, startState);
    if (this.eatContextualKeyword('as')) {
      let exportedName = this.parseIdentifierName();
      return this.finishNode({ name, exportedName }, startState);
    }
    return this.finishNode({ name, exportedName: null }, startState);
  }

  parseExportClause() {
    this.expect(TokenType.LBRACE);
    let result = [];
    while (!this.eat(TokenType.RBRACE)) {
      result.push(this.parseExportSpecifier());
      if (!this.eat(TokenType.COMMA)) {
        this.expect(TokenType.RBRACE);
        break;
      }
    }
    return result;
  }

  parseExportDeclaration() {
    let startState = this.startNode(), decl;
    this.expect(TokenType.EXPORT);
    switch (this.lookahead.type) {
      case TokenType.MUL:
        this.lex();
        // export * FromClause ;
        decl = new AST.ExportAllFrom({ moduleSpecifier: this.parseFromClause() });
        this.consumeSemicolon();
        break;
      case TokenType.LBRACE: {
        // export ExportClause FromClause ;
        // export ExportClause ;
        let namedExports = this.parseExportClause();
        let moduleSpecifier = null;
        if (this.matchContextualKeyword('from')) {
          moduleSpecifier = this.parseFromClause();
          decl = new AST.ExportFrom({ namedExports: namedExports.map(e => this.copyNode(e, new AST.ExportFromSpecifier({ name: e.name.value, exportedName: e.exportedName }))), moduleSpecifier });
        } else {
          namedExports.forEach(({ name }) => {
            if (!name.isIdentifier) {
              throw this.createError(ErrorMessages.ILLEGAL_EXPORTED_NAME);
            }
          });
          decl = new AST.ExportLocals({ namedExports: namedExports.map(e => this.copyNode(e, new AST.ExportLocalSpecifier({ name: this.copyNode(e.name, new AST.IdentifierExpression({ name: e.name.value })), exportedName: e.exportedName }))) });
        }
        this.consumeSemicolon();
        break;
      }
      case TokenType.CLASS:
        // export ClassDeclaration
        decl = new AST.Export({ declaration: this.parseClass({ isExpr: false, inDefault: false }) });
        break;
      case TokenType.FUNCTION:
        // export HoistableDeclaration
        decl = new AST.Export({ declaration: this.parseFunction({ isExpr: false, inDefault: false, allowGenerator: true, isAsync: false }) });
        break;
      case TokenType.ASYNC: {
        let preAsyncStartState = this.startNode();
        this.lex();
        decl = new AST.Export({ declaration: this.parseFunction({ isExpr: false, inDefault: false, allowGenerator: true, isAsync: true, startState: preAsyncStartState }) });
        break;
      }
      case TokenType.DEFAULT:
        this.lex();
        switch (this.lookahead.type) {
          case TokenType.FUNCTION:
            // export default HoistableDeclaration[Default]
            decl = new AST.ExportDefault({
              body: this.parseFunction({ isExpr: false, inDefault: true, allowGenerator: true, isAsync: false }),
            });
            break;
          case TokenType.CLASS:
            // export default ClassDeclaration[Default]
            decl = new AST.ExportDefault({ body: this.parseClass({ isExpr: false, inDefault: true }) });
            break;
          case TokenType.ASYNC: {
            let preAsyncStartState = this.startNode();
            let lexerState = this.saveLexerState();
            this.lex();
            if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.FUNCTION)) {
              decl = new AST.ExportDefault({
                body: this.parseFunction({ isExpr: false, inDefault: true, allowGenerator: false, isAsync: true, startState: preAsyncStartState }),
              });
              break;
            }
            this.restoreLexerState(lexerState);
          }
          // else fall through
          default:
            // export default [lookahead ∉ {function, async [no LineTerminatorHere] function, class}] AssignmentExpression[In] ;
            decl = new AST.ExportDefault({ body: this.parseAssignmentExpression() });
            this.consumeSemicolon();
            break;
        }
        break;
      case TokenType.VAR:
      case TokenType.LET:
      case TokenType.CONST:
        // export LexicalDeclaration
        decl = new AST.Export({ declaration: this.parseVariableDeclaration(true) });
        this.consumeSemicolon();
        break;
      default:
        throw this.createUnexpected(this.lookahead);
    }
    return this.finishNode(decl, startState);
  }

  parseModuleItem() {
    switch (this.lookahead.type) {
      case TokenType.IMPORT:
        return this.parseImportDeclaration();
      case TokenType.EXPORT:
        return this.parseExportDeclaration();
      default:
        return this.parseStatementListItem();
    }
  }

  lookaheadLexicalDeclaration() {
    if (this.match(TokenType.LET) || this.match(TokenType.CONST)) {
      let lexerState = this.saveLexerState();
      this.lex();
      if (
        this.matchIdentifier() ||
        this.match(TokenType.LBRACE) ||
        this.match(TokenType.LBRACK)
      ) {
        this.restoreLexerState(lexerState);
        return true;
      }
      this.restoreLexerState(lexerState);
    }
    return false;
  }

  parseStatementListItem() {
    if (this.eof()) throw this.createUnexpected(this.lookahead);

    switch (this.lookahead.type) {
      case TokenType.FUNCTION:
        return this.parseFunction({ isExpr: false, inDefault: false, allowGenerator: true, isAsync: false });
      case TokenType.CLASS:
        return this.parseClass({ isExpr: false, inDefault: false });
      case TokenType.ASYNC: {
        let preAsyncStartState = this.getLocation();
        let lexerState = this.saveLexerState();
        this.lex();
        if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.FUNCTION)) {
          return this.parseFunction({ isExpr: false, inDefault: false, allowGenerator: true, isAsync: true, startState: preAsyncStartState });
        }
        this.restoreLexerState(lexerState);
        return this.parseStatement();
      }
      default:
        if (this.lookaheadLexicalDeclaration()) {
          let startState = this.startNode();
          return this.finishNode(this.parseVariableDeclarationStatement(), startState);
        }
        return this.parseStatement();
    }
  }

  parseStatement() {
    let startState = this.startNode();
    let stmt = this.isolateCoverGrammar(this.parseStatementHelper);
    return this.finishNode(stmt, startState);
  }

  parseStatementHelper() {
    if (this.eof()) {
      throw this.createUnexpected(this.lookahead);
    }

    switch (this.lookahead.type) {
      case TokenType.SEMICOLON:
        return this.parseEmptyStatement();
      case TokenType.LBRACE:
        return this.parseBlockStatement();
      case TokenType.LPAREN:
        return this.parseExpressionStatement();
      case TokenType.BREAK:
        return this.parseBreakStatement();
      case TokenType.CONTINUE:
        return this.parseContinueStatement();
      case TokenType.DEBUGGER:
        return this.parseDebuggerStatement();
      case TokenType.DO:
        return this.parseDoWhileStatement();
      case TokenType.FOR:
        return this.parseForStatement();
      case TokenType.IF:
        return this.parseIfStatement();
      case TokenType.RETURN:
        return this.parseReturnStatement();
      case TokenType.SWITCH:
        return this.parseSwitchStatement();
      case TokenType.THROW:
        return this.parseThrowStatement();
      case TokenType.TRY:
        return this.parseTryStatement();
      case TokenType.VAR:
        return this.parseVariableDeclarationStatement();
      case TokenType.WHILE:
        return this.parseWhileStatement();
      case TokenType.WITH:
        return this.parseWithStatement();
      case TokenType.FUNCTION:
      case TokenType.CLASS:
        throw this.createUnexpected(this.lookahead);

      default: {
        let lexerState = this.saveLexerState();
        if (this.eat(TokenType.LET)) {
          if (this.match(TokenType.LBRACK)) {
            this.restoreLexerState(lexerState);
            throw this.createUnexpected(this.lookahead);
          }
          this.restoreLexerState(lexerState);
        } else if (this.eat(TokenType.ASYNC)) {
          if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.FUNCTION)) {
            throw this.createUnexpected(this.lookahead);
          }
          this.restoreLexerState(lexerState);
        }
        let expr = this.parseExpression();
        // 12.12 Labelled Statements;
        if (expr.type === 'IdentifierExpression' && this.eat(TokenType.COLON)) {
          let labeledBody = this.match(TokenType.FUNCTION)
            ? this.parseFunction({ isExpr: false, inDefault: false, allowGenerator: false, isAsync: false })
            : this.parseStatement();
          return new AST.LabeledStatement({ label: expr.name, body: labeledBody });
        }
        this.consumeSemicolon();
        return new AST.ExpressionStatement({ expression: expr });
      }
    }
  }

  parseEmptyStatement() {
    this.lex();
    return new AST.EmptyStatement;
  }

  parseBlockStatement() {
    return new AST.BlockStatement({ block: this.parseBlock() });
  }

  parseExpressionStatement() {
    let expr = this.parseExpression();
    this.consumeSemicolon();
    return new AST.ExpressionStatement({ expression: expr });
  }

  parseBreakStatement() {
    this.lex();

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.eat(TokenType.SEMICOLON) || this.hasLineTerminatorBeforeNext) {
      return new AST.BreakStatement({ label: null });
    }

    let label = null;
    if (this.matchIdentifier()) {
      label = this.parseIdentifier();
    }

    this.consumeSemicolon();

    return new AST.BreakStatement({ label });
  }

  parseContinueStatement() {
    this.lex();

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.eat(TokenType.SEMICOLON) || this.hasLineTerminatorBeforeNext) {
      return new AST.ContinueStatement({ label: null });
    }

    let label = null;
    if (this.matchIdentifier()) {
      label = this.parseIdentifier();
    }

    this.consumeSemicolon();

    return new AST.ContinueStatement({ label });
  }


  parseDebuggerStatement() {
    this.lex();
    this.consumeSemicolon();
    return new AST.DebuggerStatement;
  }

  parseDoWhileStatement() {
    this.lex();
    let body = this.parseStatement();
    this.expect(TokenType.WHILE);
    this.expect(TokenType.LPAREN);
    let test = this.parseExpression();
    this.expect(TokenType.RPAREN);
    this.eat(TokenType.SEMICOLON);
    return new AST.DoWhileStatement({ body, test });
  }

  parseForStatement() {
    this.lex();
    let isAwait = this.allowAwaitExpression && this.eat(TokenType.AWAIT);
    this.expect(TokenType.LPAREN);
    let test = null;
    let right = null;
    if (isAwait && this.match(TokenType.SEMICOLON)) {
      throw this.createUnexpected(this.lookahead);
    }
    if (this.eat(TokenType.SEMICOLON)) {
      if (!this.match(TokenType.SEMICOLON)) {
        test = this.parseExpression();
      }
      this.expect(TokenType.SEMICOLON);
      if (!this.match(TokenType.RPAREN)) {
        right = this.parseExpression();
      }
      return new AST.ForStatement({ init: null, test, update: right, body: this.getIteratorStatementEpilogue() });
    }
    let startsWithLet = this.match(TokenType.LET);
    let isForDecl = this.lookaheadLexicalDeclaration();
    let leftStartState = this.startNode();
    if (this.match(TokenType.VAR) || isForDecl) {
      let previousAllowIn = this.allowIn;
      this.allowIn = false;
      let init = this.parseVariableDeclaration(false);
      this.allowIn = previousAllowIn;

      if (init.declarators.length === 1 && (this.match(TokenType.IN) || this.matchContextualKeyword('of'))) {
        let ctor;
        let decl = init.declarators[0];

        if (this.match(TokenType.IN)) {
          if (isAwait) {
            throw this.createUnexpected(this.lookahead);
          }
          if (decl.init !== null && (this.strict || init.kind !== 'var' || decl.binding.type !== 'BindingIdentifier')) {
            throw this.createError(ErrorMessages.INVALID_VAR_INIT_FOR_IN);
          }
          ctor = AST.ForInStatement;
          this.lex();
          right = this.parseExpression();
        } else {
          if (decl.init !== null) {
            throw this.createError(isAwait ? ErrorMessages.INVALID_VAR_INIT_FOR_AWAIT : ErrorMessages.INVALID_VAR_INIT_FOR_OF);
          }
          if (isAwait) {
            ctor = AST.ForAwaitStatement;
          } else {
            ctor = AST.ForOfStatement;
          }
          this.lex();
          right = this.parseAssignmentExpression();
        }

        let body = this.getIteratorStatementEpilogue();

        return new ctor({ left: init, right, body });
      } else if (isAwait) {
        throw this.createUnexpected(this.lookahead);
      }
      this.expect(TokenType.SEMICOLON);
      if (init.declarators.some(decl => decl.binding.type !== 'BindingIdentifier' && decl.init === null)) {
        throw this.createError(ErrorMessages.UNINITIALIZED_BINDINGPATTERN_IN_FOR_INIT);
      }
      if (!this.match(TokenType.SEMICOLON)) {
        test = this.parseExpression();
      }
      this.expect(TokenType.SEMICOLON);
      if (!this.match(TokenType.RPAREN)) {
        right = this.parseExpression();
      }
      return new AST.ForStatement({ init, test, update: right, body: this.getIteratorStatementEpilogue() });

    }
    let previousAllowIn = this.allowIn;
    this.allowIn = false;
    let expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrTarget);
    this.allowIn = previousAllowIn;

    if (this.isAssignmentTarget && expr.type !== 'AssignmentExpression' && (this.match(TokenType.IN) || this.matchContextualKeyword('of'))) {
      if (expr.type === 'ObjectAssignmentTarget' || expr.type === 'ArrayAssignmentTarget') {
        this.firstExprError = null;
      }
      if (startsWithLet && this.matchContextualKeyword('of')) {
        throw this.createError(isAwait ? ErrorMessages.INVALID_LHS_IN_FOR_AWAIT : ErrorMessages.INVALID_LHS_IN_FOR_OF);
      }
      let ctor;
      if (this.match(TokenType.IN)) {
        if (isAwait) {
          throw this.createUnexpected(this.lookahead);
        }
        ctor = AST.ForInStatement;
        this.lex();
        right = this.parseExpression();
      } else {
        if (isAwait) {
          ctor = AST.ForAwaitStatement;
        } else {
          ctor = AST.ForOfStatement;
        }
        this.lex();
        right = this.parseAssignmentExpression();
      }

      return new ctor({ left: this.transformDestructuring(expr), right, body: this.getIteratorStatementEpilogue() });
    } else if (isAwait) {
      throw this.createError(ErrorMessages.INVALID_LHS_IN_FOR_AWAIT);
    }
    if (this.firstExprError) {
      throw this.firstExprError;
    }
    while (this.eat(TokenType.COMMA)) {
      let rhs = this.parseAssignmentExpression();
      expr = this.finishNode(new AST.BinaryExpression({ left: expr, operator: ',', right: rhs }), leftStartState);
    }
    if (this.match(TokenType.IN)) {
      throw this.createError(ErrorMessages.INVALID_LHS_IN_FOR_IN);
    }
    if (this.matchContextualKeyword('of')) {
      throw this.createError(ErrorMessages.INVALID_LHS_IN_FOR_OF);
    }
    this.expect(TokenType.SEMICOLON);
    if (!this.match(TokenType.SEMICOLON)) {
      test = this.parseExpression();
    }
    this.expect(TokenType.SEMICOLON);
    if (!this.match(TokenType.RPAREN)) {
      right = this.parseExpression();
    }
    return new AST.ForStatement({ init: expr, test, update: right, body: this.getIteratorStatementEpilogue() });
  }

  getIteratorStatementEpilogue() {
    this.expect(TokenType.RPAREN);
    let body = this.parseStatement();
    return body;
  }

  parseIfStatementChild() {
    return this.match(TokenType.FUNCTION)
      ? this.parseFunction({ isExpr: false, inDefault: false, allowGenerator: false, isAsync: false })
      : this.parseStatement();
  }

  parseIfStatement() {
    this.lex();
    this.expect(TokenType.LPAREN);
    let test = this.parseExpression();
    this.expect(TokenType.RPAREN);
    let consequent = this.parseIfStatementChild();
    let alternate = null;
    if (this.eat(TokenType.ELSE)) {
      alternate = this.parseIfStatementChild();
    }
    return new AST.IfStatement({ test, consequent, alternate });
  }

  parseReturnStatement() {
    if (!this.inFunctionBody) {
      throw this.createError(ErrorMessages.ILLEGAL_RETURN);
    }

    this.lex();

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.eat(TokenType.SEMICOLON) || this.hasLineTerminatorBeforeNext) {
      return new AST.ReturnStatement({ expression: null });
    }

    let expression = null;
    if (!this.match(TokenType.RBRACE) && !this.eof()) {
      expression = this.parseExpression();
    }

    this.consumeSemicolon();
    return new AST.ReturnStatement({ expression });
  }

  parseSwitchStatement() {
    this.lex();
    this.expect(TokenType.LPAREN);
    let discriminant = this.parseExpression();
    this.expect(TokenType.RPAREN);
    this.expect(TokenType.LBRACE);

    if (this.eat(TokenType.RBRACE)) {
      return new AST.SwitchStatement({ discriminant, cases: [] });
    }

    let cases = this.parseSwitchCases();
    if (this.match(TokenType.DEFAULT)) {
      let defaultCase = this.parseSwitchDefault();
      let postDefaultCases = this.parseSwitchCases();
      if (this.match(TokenType.DEFAULT)) {
        throw this.createError(ErrorMessages.MULTIPLE_DEFAULTS_IN_SWITCH);
      }
      this.expect(TokenType.RBRACE);
      return new AST.SwitchStatementWithDefault({
        discriminant,
        preDefaultCases: cases,
        defaultCase,
        postDefaultCases,
      });
    }
    this.expect(TokenType.RBRACE);
    return new AST.SwitchStatement({ discriminant, cases });
  }

  parseSwitchCases() {
    let result = [];
    while (!(this.eof() || this.match(TokenType.RBRACE) || this.match(TokenType.DEFAULT))) {
      result.push(this.parseSwitchCase());
    }
    return result;
  }

  parseSwitchCase() {
    let startState = this.startNode();
    this.expect(TokenType.CASE);
    return this.finishNode(new AST.SwitchCase({
      test: this.parseExpression(),
      consequent: this.parseSwitchCaseBody(),
    }), startState);
  }

  parseSwitchDefault() {
    let startState = this.startNode();
    this.expect(TokenType.DEFAULT);
    return this.finishNode(new AST.SwitchDefault({ consequent: this.parseSwitchCaseBody() }), startState);
  }

  parseSwitchCaseBody() {
    this.expect(TokenType.COLON);
    return this.parseStatementListInSwitchCaseBody();
  }

  parseStatementListInSwitchCaseBody() {
    let result = [];
    while (!(this.eof() || this.match(TokenType.RBRACE) || this.match(TokenType.DEFAULT) || this.match(TokenType.CASE))) {
      result.push(this.parseStatementListItem());
    }
    return result;
  }

  parseThrowStatement() {
    let token = this.lex();
    if (this.hasLineTerminatorBeforeNext) {
      throw this.createErrorWithLocation(token, ErrorMessages.NEWLINE_AFTER_THROW);
    }
    let expression = this.parseExpression();
    this.consumeSemicolon();
    return new AST.ThrowStatement({ expression });
  }

  parseTryStatement() {
    this.lex();
    let body = this.parseBlock();

    if (this.match(TokenType.CATCH)) {
      let catchClause = this.parseCatchClause();
      if (this.eat(TokenType.FINALLY)) {
        let finalizer = this.parseBlock();
        return new AST.TryFinallyStatement({ body, catchClause, finalizer });
      }
      return new AST.TryCatchStatement({ body, catchClause });
    }

    if (this.eat(TokenType.FINALLY)) {
      let finalizer = this.parseBlock();
      return new AST.TryFinallyStatement({ body, catchClause: null, finalizer });
    }
    throw this.createError(ErrorMessages.NO_CATCH_OR_FINALLY);
  }

  parseVariableDeclarationStatement() {
    let declaration = this.parseVariableDeclaration(true);
    this.consumeSemicolon();
    return new AST.VariableDeclarationStatement({ declaration });
  }

  parseWhileStatement() {
    this.lex();
    this.expect(TokenType.LPAREN);
    let test = this.parseExpression();
    let body = this.getIteratorStatementEpilogue();
    return new AST.WhileStatement({ test, body });
  }

  parseWithStatement() {
    this.lex();
    this.expect(TokenType.LPAREN);
    let object = this.parseExpression();
    this.expect(TokenType.RPAREN);
    let body = this.parseStatement();
    return new AST.WithStatement({ object, body });
  }

  parseCatchClause() {
    let startState = this.startNode();

    this.lex();
    this.expect(TokenType.LPAREN);
    if (this.match(TokenType.RPAREN) || this.match(TokenType.LPAREN)) {
      throw this.createUnexpected(this.lookahead);
    }
    let binding = this.parseBindingTarget();
    this.expect(TokenType.RPAREN);
    let body = this.parseBlock();

    return this.finishNode(new AST.CatchClause({ binding, body }), startState);
  }

  parseBlock() {
    let startState = this.startNode();
    this.expect(TokenType.LBRACE);
    let body = [];
    while (!this.match(TokenType.RBRACE)) {
      body.push(this.parseStatementListItem());
    }
    this.expect(TokenType.RBRACE);
    return this.finishNode(new AST.Block({ statements: body }), startState);
  }

  parseVariableDeclaration(bindingPatternsMustHaveInit) {
    let startState = this.startNode();
    let token = this.lex();

    // preceded by this.match(TokenSubType.VAR) || this.match(TokenSubType.LET);
    let kind = token.type === TokenType.VAR ? 'var' : token.type === TokenType.CONST ? 'const' : 'let';
    let declarators = this.parseVariableDeclaratorList(bindingPatternsMustHaveInit);
    return this.finishNode(new AST.VariableDeclaration({ kind, declarators }), startState);
  }

  parseVariableDeclaratorList(bindingPatternsMustHaveInit) {
    let result = [];
    do {
      result.push(this.parseVariableDeclarator(bindingPatternsMustHaveInit));
    } while (this.eat(TokenType.COMMA));
    return result;
  }

  parseVariableDeclarator(bindingPatternsMustHaveInit) {
    let startState = this.startNode();

    if (this.match(TokenType.LPAREN)) {
      throw this.createUnexpected(this.lookahead);
    }

    let previousAllowIn = this.allowIn;
    this.allowIn = true;
    let binding = this.parseBindingTarget();
    this.allowIn = previousAllowIn;

    if (bindingPatternsMustHaveInit && binding.type !== 'BindingIdentifier' && !this.match(TokenType.ASSIGN)) {
      this.expect(TokenType.ASSIGN);
    }

    let init = null;
    if (this.eat(TokenType.ASSIGN)) {
      init = this.parseAssignmentExpression();
    }

    return this.finishNode(new AST.VariableDeclarator({ binding, init }), startState);
  }

  isolateCoverGrammar(parser) {
    let oldIsBindingElement = this.isBindingElement,
        oldIsAssignmentTarget = this.isAssignmentTarget,
        oldFirstExprError = this.firstExprError,
        result;
    this.isBindingElement = this.isAssignmentTarget = true;
    this.firstExprError = null;
    result = parser.call(this);
    if (this.firstExprError !== null) {
      throw this.firstExprError;
    }
    this.isBindingElement = oldIsBindingElement;
    this.isAssignmentTarget = oldIsAssignmentTarget;
    this.firstExprError = oldFirstExprError;
    return result;
  }

  inheritCoverGrammar(parser) {
    let oldIsBindingElement = this.isBindingElement,
        oldIsAssignmentTarget = this.isAssignmentTarget,
        oldFirstExprError = this.firstExprError,
        result;
    this.isBindingElement = this.isAssignmentTarget = true;
    this.firstExprError = null;
    result = parser.call(this);
    this.isBindingElement = this.isBindingElement && oldIsBindingElement;
    this.isAssignmentTarget = this.isAssignmentTarget && oldIsAssignmentTarget;
    this.firstExprError = oldFirstExprError || this.firstExprError;
    return result;
  }

  parseExpression() {
    let startState = this.startNode();

    let left = this.parseAssignmentExpression();
    if (this.match(TokenType.COMMA)) {
      while (!this.eof()) {
        if (!this.match(TokenType.COMMA)) break;
        this.lex();
        let right = this.parseAssignmentExpression();
        left = this.finishNode(new AST.BinaryExpression({ left, operator: ',', right }), startState);
      }
    }
    return left;
  }

  finishArrowParams(head) {
    let { params = null, rest = null } = head;
    if (head.type !== ARROW_EXPRESSION_PARAMS) {
      if (head.type === 'IdentifierExpression') {
        params = [this.targetToBinding(this.transformDestructuring(head))];
      } else {
        throw this.createUnexpected(this.lookahead);
      }
    }
    return this.copyNode(head, new AST.FormalParameters({ items: params, rest }));
  }

  parseArrowExpressionTail(params, isAsync, startState) {
    this.expect(TokenType.ARROW);
    let previousYield = this.allowYieldExpression;
    let previousAwait = this.allowAwaitExpression;
    let previousAwaitLocation = this.firstAwaitLocation;
    this.allowYieldExpression = false;
    this.allowAwaitExpression = isAsync;
    this.firstAwaitLocation = null;
    let body;
    if (this.match(TokenType.LBRACE)) {
      let previousAllowIn = this.allowIn;
      this.allowIn = true;
      body = this.parseFunctionBody();
      this.allowIn = previousAllowIn;
    } else {
      body = this.parseAssignmentExpression();
    }
    this.allowYieldExpression = previousYield;
    this.allowAwaitExpression = previousAwait;
    this.firstAwaitLocation = previousAwaitLocation;
    return this.finishNode(new AST.ArrowExpression({ isAsync, params, body }), startState);
  }

  parseAssignmentExpression() {
    return this.isolateCoverGrammar(this.parseAssignmentExpressionOrTarget);
  }

  parseAssignmentExpressionOrTarget() {
    let startState = this.startNode();
    if (this.allowYieldExpression && this.match(TokenType.YIELD)) {
      this.isBindingElement = this.isAssignmentTarget = false;
      return this.parseYieldExpression();
    }
    let expr = this.parseConditionalExpression();
    if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.ARROW)) {
      this.isBindingElement = this.isAssignmentTarget = false;
      this.firstExprError = null;
      let isAsync = expr.type === ARROW_EXPRESSION_PARAMS && expr.isAsync;
      return this.parseArrowExpressionTail(this.finishArrowParams(expr), isAsync, startState);
    }
    let isAssignmentOperator = false;
    let operator = this.lookahead;
    switch (operator.type) {
      case TokenType.ASSIGN_BIT_OR:
      case TokenType.ASSIGN_BIT_XOR:
      case TokenType.ASSIGN_BIT_AND:
      case TokenType.ASSIGN_SHL:
      case TokenType.ASSIGN_SHR:
      case TokenType.ASSIGN_SHR_UNSIGNED:
      case TokenType.ASSIGN_ADD:
      case TokenType.ASSIGN_SUB:
      case TokenType.ASSIGN_MUL:
      case TokenType.ASSIGN_DIV:
      case TokenType.ASSIGN_MOD:
      case TokenType.ASSIGN_EXP:
        isAssignmentOperator = true;
        break;
    }
    if (isAssignmentOperator) {
      if (!this.isAssignmentTarget || !isValidSimpleAssignmentTarget(expr)) {
        throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
      }
      expr = this.transformDestructuring(expr);
    } else if (operator.type === TokenType.ASSIGN) {
      if (!this.isAssignmentTarget) {
        throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
      }
      expr = this.transformDestructuring(expr);
    } else {
      return expr;
    }
    this.lex();
    let rhs = this.parseAssignmentExpression();

    this.firstExprError = null;
    let node;
    if (operator.type === TokenType.ASSIGN) {
      node = new AST.AssignmentExpression({ binding: expr, expression: rhs });
    } else {
      node = new AST.CompoundAssignmentExpression({ binding: expr, operator: operator.type.name, expression: rhs });
      this.isBindingElement = this.isAssignmentTarget = false;
    }
    return this.finishNode(node, startState);
  }

  targetToBinding(node) {
    if (node === null) {
      return null;
    }

    switch (node.type) {
      case 'AssignmentTargetIdentifier':
        return this.copyNode(node, new AST.BindingIdentifier({ name: node.name }));
      case 'ArrayAssignmentTarget':
        return this.copyNode(node, new AST.ArrayBinding({ elements: node.elements.map(e => this.targetToBinding(e)), rest: this.targetToBinding(node.rest) }));
      case 'ObjectAssignmentTarget':
        return this.copyNode(node, new AST.ObjectBinding({ properties: node.properties.map(p => this.targetToBinding(p)), rest: this.targetToBinding(node.rest) }));
      case 'AssignmentTargetPropertyIdentifier':
        return this.copyNode(node, new AST.BindingPropertyIdentifier({ binding: this.targetToBinding(node.binding), init: node.init }));
      case 'AssignmentTargetPropertyProperty':
        return this.copyNode(node, new AST.BindingPropertyProperty({ name: node.name, binding: this.targetToBinding(node.binding) }));
      case 'AssignmentTargetWithDefault':
        return this.copyNode(node, new AST.BindingWithDefault({ binding: this.targetToBinding(node.binding), init: node.init }));
    }

    // istanbul ignore next
    throw new Error('Not reached');
  }

  transformDestructuring(node) {
    switch (node.type) {

      case 'DataProperty':
        return this.copyNode(node, new AST.AssignmentTargetPropertyProperty({
          name: node.name,
          binding: this.transformDestructuringWithDefault(node.expression),
        }));
      case 'ShorthandProperty':
        return this.copyNode(node, new AST.AssignmentTargetPropertyIdentifier({
          binding: this.copyNode(node, new AST.AssignmentTargetIdentifier({ name: node.name.name })),
          init: null,
        }));

      case 'ObjectExpression': {
        let last = node.properties.length > 0 ? node.properties[node.properties.length - 1] : void 0;
        if (last != null && last.type === 'SpreadProperty') {
          return this.copyNode(node, new AST.ObjectAssignmentTarget({
            properties: node.properties.slice(0, -1).map(e => e && this.transformDestructuringWithDefault(e)),
            rest: this.transformDestructuring(last.expression),
          }));
        }

        return this.copyNode(node, new AST.ObjectAssignmentTarget({
          properties: node.properties.map(e => e && this.transformDestructuringWithDefault(e)),
          rest: null,
        }));
      }
      case 'ArrayExpression': {
        let last = node.elements[node.elements.length - 1];
        if (last != null && last.type === 'SpreadElement') {
          return this.copyNode(node, new AST.ArrayAssignmentTarget({
            elements: node.elements.slice(0, -1).map(e => e && this.transformDestructuringWithDefault(e)),
            rest: this.copyNode(last.expression, this.transformDestructuring(last.expression)),
          }));
        }
        return this.copyNode(node, new AST.ArrayAssignmentTarget({
          elements: node.elements.map(e => e && this.transformDestructuringWithDefault(e)),
          rest: null,
        }));
      }
      case 'IdentifierExpression':
        return this.copyNode(node, new AST.AssignmentTargetIdentifier({ name: node.name }));

      case 'StaticPropertyName':
        return this.copyNode(node, new AST.AssignmentTargetIdentifier({ name: node.value }));

      case 'ComputedMemberExpression':
        return this.copyNode(node, new AST.ComputedMemberAssignmentTarget({ object: node.object, expression: node.expression }));
      case 'StaticMemberExpression':
        return this.copyNode(node, new AST.StaticMemberAssignmentTarget({ object: node.object, property: node.property }));

      case 'ArrayAssignmentTarget':
      case 'ObjectAssignmentTarget':
      case 'ComputedMemberAssignmentTarget':
      case 'StaticMemberAssignmentTarget':
      case 'AssignmentTargetIdentifier':
      case 'AssignmentTargetPropertyIdentifier':
      case 'AssignmentTargetPropertyProperty':
      case 'AssignmentTargetWithDefault':
        return node;
    }
    // istanbul ignore next
    throw new Error('Not reached');
  }

  transformDestructuringWithDefault(node) {
    switch (node.type) {
      case 'AssignmentExpression':
        return this.copyNode(node, new AST.AssignmentTargetWithDefault({
          binding: this.transformDestructuring(node.binding),
          init: node.expression,
        }));
    }
    return this.transformDestructuring(node);
  }

  lookaheadAssignmentExpression() {
    if (this.matchIdentifier()) {
      return true;
    }
    switch (this.lookahead.type) {
      case TokenType.ADD:
      case TokenType.ASSIGN_DIV:
      case TokenType.BIT_NOT:
      case TokenType.CLASS:
      case TokenType.DEC:
      case TokenType.DELETE:
      case TokenType.DIV:
      case TokenType.FALSE:
      case TokenType.FUNCTION:
      case TokenType.INC:
      case TokenType.LBRACE:
      case TokenType.LBRACK:
      case TokenType.LPAREN:
      case TokenType.NEW:
      case TokenType.NOT:
      case TokenType.NULL:
      case TokenType.NUMBER:
      case TokenType.STRING:
      case TokenType.SUB:
      case TokenType.SUPER:
      case TokenType.THIS:
      case TokenType.TRUE:
      case TokenType.TYPEOF:
      case TokenType.VOID:
      case TokenType.TEMPLATE:
        return true;
    }
    return false;
  }

  parseYieldExpression() {
    let startState = this.startNode();

    this.lex();
    if (this.hasLineTerminatorBeforeNext) {
      return this.finishNode(new AST.YieldExpression({ expression: null }), startState);
    }
    let isGenerator = !!this.eat(TokenType.MUL);
    let expr = null;
    if (isGenerator || this.lookaheadAssignmentExpression()) {
      expr = this.parseAssignmentExpression();
    }
    let ctor = isGenerator ? AST.YieldGeneratorExpression : AST.YieldExpression;
    return this.finishNode(new ctor({ expression: expr }), startState);
  }

  parseConditionalExpression() {
    let startState = this.startNode();
    let test = this.parseBinaryExpression();
    if (this.firstExprError) return test;
    if (this.eat(TokenType.CONDITIONAL)) {
      this.isBindingElement = this.isAssignmentTarget = false;
      let previousAllowIn = this.allowIn;
      this.allowIn = true;
      let consequent = this.isolateCoverGrammar(this.parseAssignmentExpression);
      this.allowIn = previousAllowIn;
      this.expect(TokenType.COLON);
      let alternate = this.isolateCoverGrammar(this.parseAssignmentExpression);
      return this.finishNode(new AST.ConditionalExpression({ test, consequent, alternate }), startState);
    }
    return test;
  }

  isBinaryOperator(type) {
    switch (type) {
      case TokenType.OR:
      case TokenType.AND:
      case TokenType.BIT_OR:
      case TokenType.BIT_XOR:
      case TokenType.BIT_AND:
      case TokenType.EQ:
      case TokenType.NE:
      case TokenType.EQ_STRICT:
      case TokenType.NE_STRICT:
      case TokenType.LT:
      case TokenType.GT:
      case TokenType.LTE:
      case TokenType.GTE:
      case TokenType.INSTANCEOF:
      case TokenType.SHL:
      case TokenType.SHR:
      case TokenType.SHR_UNSIGNED:
      case TokenType.ADD:
      case TokenType.SUB:
      case TokenType.MUL:
      case TokenType.DIV:
      case TokenType.MOD:
        return true;
      case TokenType.IN:
        return this.allowIn;
      default:
        return false;
    }
  }

  parseBinaryExpression() {
    let startState = this.startNode();
    let left = this.parseExponentiationExpression();
    if (this.firstExprError) {
      return left;
    }

    let operator = this.lookahead.type;
    if (!this.isBinaryOperator(operator)) return left;

    this.isBindingElement = this.isAssignmentTarget = false;

    this.lex();
    let stack = [];
    stack.push({ startState, left, operator, precedence: BinaryPrecedence[operator.name] });
    startState = this.startNode();
    let right = this.isolateCoverGrammar(this.parseExponentiationExpression);
    operator = this.lookahead.type;
    while (this.isBinaryOperator(operator)) {
      let precedence = BinaryPrecedence[operator.name];
      // Reduce: make a binary expression from the three topmost entries.
      while (stack.length && precedence <= stack[stack.length - 1].precedence) {
        let stackItem = stack[stack.length - 1];
        let stackOperator = stackItem.operator;
        left = stackItem.left;
        stack.pop();
        startState = stackItem.startState;
        right = this.finishNode(new AST.BinaryExpression({ left, operator: stackOperator.name, right }), startState);
      }

      this.lex();
      stack.push({ startState, left: right, operator, precedence });

      startState = this.startNode();
      right = this.isolateCoverGrammar(this.parseExponentiationExpression);
      operator = this.lookahead.type;
    }

    // Final reduce to clean-up the stack.
    return stack.reduceRight((expr, stackItem) =>
      this.finishNode(new AST.BinaryExpression({
        left: stackItem.left,
        operator: stackItem.operator.name,
        right: expr,
      }), stackItem.startState),
    right);
  }

  parseExponentiationExpression() {
    let startState = this.startNode();

    let leftIsParenthesized = this.lookahead.type === TokenType.LPAREN;
    let left = this.parseUnaryExpression();
    if (this.lookahead.type !== TokenType.EXP) {
      return left;
    }
    if (left.type === 'UnaryExpression' && !leftIsParenthesized) {
      throw this.createError(ErrorMessages.INVALID_EXPONENTIATION_LHS);
    }
    this.lex();

    this.isBindingElement = this.isAssignmentTarget = false;

    let right = this.isolateCoverGrammar(this.parseExponentiationExpression);
    return this.finishNode(new AST.BinaryExpression({ left, operator: '**', right }), startState);
  }

  parseUnaryExpression() {
    if (this.lookahead.type.klass !== TokenClass.Punctuator && this.lookahead.type.klass !== TokenClass.Keyword) {
      return this.parseUpdateExpression();
    }

    let startState = this.startNode();
    if (this.allowAwaitExpression && this.eat(TokenType.AWAIT)) {
      this.isBindingElement = this.isAssignmentTarget = false;
      let expression = this.isolateCoverGrammar(this.parseUnaryExpression);
      return this.finishNode(new AST.AwaitExpression({ expression }), startState);
    }

    let operator = this.lookahead;
    if (!isPrefixOperator(operator)) {
      return this.parseUpdateExpression();
    }

    this.lex();
    this.isBindingElement = this.isAssignmentTarget = false;

    let node;
    if (isUpdateOperator(operator)) {
      let operandStartLocation = this.getLocation();
      let operand = this.isolateCoverGrammar(this.parseUnaryExpression);
      if (!isValidSimpleAssignmentTarget(operand)) {
        throw this.createErrorWithLocation(operandStartLocation, ErrorMessages.INVALID_UPDATE_OPERAND);
      }
      operand = this.transformDestructuring(operand);
      node = new AST.UpdateExpression({ isPrefix: true, operator: operator.value, operand });
    } else {
      let operand = this.isolateCoverGrammar(this.parseUnaryExpression);
      node = new AST.UnaryExpression({ operator: operator.value, operand });
    }

    return this.finishNode(node, startState);
  }

  parseUpdateExpression() {
    let startLocation = this.getLocation();
    let startState = this.startNode();

    let operand = this.parseLeftHandSideExpression({ allowCall: true });
    if (this.firstExprError || this.hasLineTerminatorBeforeNext) return operand;

    let operator = this.lookahead;
    if (!isUpdateOperator(operator)) return operand;
    this.lex();
    this.isBindingElement = this.isAssignmentTarget = false;
    if (!isValidSimpleAssignmentTarget(operand)) {
      throw this.createErrorWithLocation(startLocation, ErrorMessages.INVALID_UPDATE_OPERAND);
    }
    operand = this.transformDestructuring(operand);

    return this.finishNode(new AST.UpdateExpression({ isPrefix: false, operator: operator.value, operand }), startState);
  }

  parseLeftHandSideExpression({ allowCall }) {
    let startState = this.startNode();
    let previousAllowIn = this.allowIn;
    this.allowIn = true;

    let expr, token = this.lookahead;

    if (this.eat(TokenType.SUPER)) {
      this.isBindingElement = false;
      this.isAssignmentTarget = false;
      expr = this.finishNode(new AST.Super, startState);
      if (this.match(TokenType.LPAREN)) {
        if (allowCall) {
          expr = this.finishNode(new AST.CallExpression({
            callee: expr,
            arguments: this.parseArgumentList().args,
          }), startState);
        } else {
          throw this.createUnexpected(token);
        }
      } else if (this.match(TokenType.LBRACK)) {
        expr = this.finishNode(new AST.ComputedMemberExpression({
          object: expr,
          expression: this.parseComputedMember(),
        }), startState);
        this.isAssignmentTarget = true;
      } else if (this.match(TokenType.PERIOD)) {
        expr = this.finishNode(new AST.StaticMemberExpression({
          object: expr,
          property: this.parseStaticMember(),
        }), startState);
        this.isAssignmentTarget = true;
      } else {
        throw this.createUnexpected(token);
      }
    } else if (this.match(TokenType.NEW)) {
      this.isBindingElement = this.isAssignmentTarget = false;
      expr = this.parseNewExpression();
    } else if (this.match(TokenType.ASYNC)) {
      expr = this.parsePrimaryExpression();
      // there's only three things this could be: an identifier, an async arrow, or an async function expression.
      if (expr.type === 'IdentifierExpression' && allowCall && !this.hasLineTerminatorBeforeNext) {
        if (this.matchIdentifier()) {
          // `async [no lineterminator here] identifier` must be an async arrow
          let afterAsyncStartState = this.startNode();
          let previousAwait = this.allowAwaitExpression;
          this.allowAwaitExpression = true;
          let param = this.parseBindingIdentifier();
          this.allowAwaitExpression = previousAwait;
          this.ensureArrow();
          return this.finishNode({
            type: ARROW_EXPRESSION_PARAMS,
            params: [param],
            rest: null,
            isAsync: true,
          }, afterAsyncStartState);
        }
        if (this.match(TokenType.LPAREN)) {
          // the maximally obnoxious case: `async (`
          let afterAsyncStartState = this.startNode();
          let previousAwaitLocation = this.firstAwaitLocation;
          this.firstAwaitLocation = null;
          let { args, locationFollowingFirstSpread } = this.parseArgumentList();
          if (this.isBindingElement && !this.hasLineTerminatorBeforeNext && this.match(TokenType.ARROW)) {
            if (locationFollowingFirstSpread !== null) {
              throw this.createErrorWithLocation(locationFollowingFirstSpread, ErrorMessages.UNEXPECTED_TOKEN(','));
            }
            if (this.firstAwaitLocation !== null) {
              throw this.createErrorWithLocation(this.firstAwaitLocation, ErrorMessages.NO_AWAIT_IN_ASYNC_PARAMS);
            }
            let rest = null;
            if (args.length > 0 && args[args.length - 1].type === 'SpreadElement') {
              rest = this.targetToBinding(this.transformDestructuringWithDefault(args[args.length - 1].expression));
              if (rest.init != null) {
                throw this.createError(ErrorMessages.UNEXPECTED_REST_PARAMETERS_INITIALIZATION);
              }
              args = args.slice(0, -1);
            }
            let params = args.map(arg => this.targetToBinding(this.transformDestructuringWithDefault(arg)));
            return this.finishNode({
              type: ARROW_EXPRESSION_PARAMS,
              params,
              rest,
              isAsync: true,
            }, afterAsyncStartState);
          }
          this.firstAwaitLocation = previousAwaitLocation || this.firstAwaitLocation;
          // otherwise we've just taken the first iteration of the loop below
          this.isBindingElement = this.isAssignmentTarget = false;
          expr = this.finishNode(new AST.CallExpression({
            callee: expr,
            arguments: args,
          }), startState);
        }
      }
    } else {
      expr = this.parsePrimaryExpression();
      if (this.firstExprError) {
        return expr;
      }
    }

    while (true) {
      if (allowCall && this.match(TokenType.LPAREN)) {
        this.isBindingElement = this.isAssignmentTarget = false;
        expr = this.finishNode(new AST.CallExpression({
          callee: expr,
          arguments: this.parseArgumentList().args,
        }), startState);
      } else if (this.match(TokenType.LBRACK)) {
        this.isBindingElement = false;
        this.isAssignmentTarget = true;
        expr = this.finishNode(new AST.ComputedMemberExpression({
          object: expr,
          expression: this.parseComputedMember(),
        }), startState);
      } else if (this.match(TokenType.PERIOD)) {
        this.isBindingElement = false;
        this.isAssignmentTarget = true;
        expr = this.finishNode(new AST.StaticMemberExpression({
          object: expr,
          property: this.parseStaticMember(),
        }), startState);
      } else if (this.match(TokenType.TEMPLATE)) {
        this.isBindingElement = this.isAssignmentTarget = false;
        expr = this.finishNode(new AST.TemplateExpression({
          tag: expr,
          elements: this.parseTemplateElements(),
        }), startState);
      } else {
        break;
      }
    }

    this.allowIn = previousAllowIn;

    return expr;
  }

  parseTemplateElements() {
    let startState = this.startNode();
    let token = this.lookahead;
    if (token.tail) {
      this.lex();
      return [this.finishNode(new AST.TemplateElement({ rawValue: token.slice.text.slice(1, -1) }), startState)];
    }
    let result = [
      this.finishNode(new AST.TemplateElement({ rawValue: this.lex().slice.text.slice(1, -2) }), startState),
    ];
    while (true) {
      result.push(this.parseExpression());
      if (!this.match(TokenType.RBRACE)) {
        throw this.createILLEGAL();
      }
      this.index = this.startIndex;
      this.line = this.startLine;
      this.lineStart = this.startLineStart;
      this.lookahead = this.scanTemplateElement();
      startState = this.startNode();
      token = this.lex();
      if (token.tail) {
        result.push(this.finishNode(new AST.TemplateElement({ rawValue: token.slice.text.slice(1, -1) }), startState));
        return result;
      }
      result.push(this.finishNode(new AST.TemplateElement({ rawValue: token.slice.text.slice(1, -2) }), startState));
    }
  }

  parseStaticMember() {
    this.lex();
    if (this.lookahead.type.klass.isIdentifierName) {
      return this.lex().value;
    }
    throw this.createUnexpected(this.lookahead);
  }

  parseComputedMember() {
    this.lex();
    let expr = this.parseExpression();
    this.expect(TokenType.RBRACK);
    return expr;
  }

  parseNewExpression() {
    let startState = this.startNode();
    this.lex();
    if (this.eat(TokenType.PERIOD)) {
      this.expectContextualKeyword('target');
      return this.finishNode(new AST.NewTargetExpression, startState);
    }
    let callee = this.isolateCoverGrammar(() => this.parseLeftHandSideExpression({ allowCall: false }));
    return this.finishNode(new AST.NewExpression({
      callee,
      arguments: this.match(TokenType.LPAREN) ? this.parseArgumentList().args : [],
    }), startState);
  }

  parseRegexFlags(flags) {
    let global = false,
        ignoreCase = false,
        multiLine = false,
        unicode = false,
        sticky = false,
        dotAll = false;
    for (let i = 0; i < flags.length; ++i) {
      let f = flags[i];
      switch (f) {
        case 'g':
          if (global) {
            throw this.createError('Duplicate regular expression flag \'g\'');
          }
          global = true;
          break;
        case 'i':
          if (ignoreCase) {
            throw this.createError('Duplicate regular expression flag \'i\'');
          }
          ignoreCase = true;
          break;
        case 'm':
          if (multiLine) {
            throw this.createError('Duplicate regular expression flag \'m\'');
          }
          multiLine = true;
          break;
        case 'u':
          if (unicode) {
            throw this.createError('Duplicate regular expression flag \'u\'');
          }
          unicode = true;
          break;
        case 'y':
          if (sticky) {
            throw this.createError('Duplicate regular expression flag \'y\'');
          }
          sticky = true;
          break;
        case 's':
          if (dotAll) {
            throw this.createError('Duplicate regular expression flag \'s\'');
          }
          dotAll = true;
          break;
        default:
          throw this.createError(`Invalid regular expression flag '${f}'`);
      }
    }
    return { global, ignoreCase, multiLine, unicode, sticky, dotAll };
  }

  parsePrimaryExpression() {
    if (this.match(TokenType.LPAREN)) {
      return this.parseGroupExpression();
    }

    let startState = this.startNode();

    if (this.eat(TokenType.ASYNC)) {
      if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.FUNCTION)) {
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.finishNode(this.parseFunction({ isExpr: true, inDefault: false, allowGenerator: true, isAsync: true }), startState);
      }
      return this.finishNode(new AST.IdentifierExpression({ name: 'async' }), startState);
    }

    if (this.matchIdentifier()) {
      return this.finishNode(new AST.IdentifierExpression({ name: this.parseIdentifier() }), startState);
    }
    switch (this.lookahead.type) {
      case TokenType.STRING:
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.parseStringLiteral();
      case TokenType.NUMBER:
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.parseNumericLiteral();
      case TokenType.THIS:
        this.lex();
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.finishNode(new AST.ThisExpression, startState);
      case TokenType.FUNCTION:
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.finishNode(this.parseFunction({ isExpr: true, inDefault: false, allowGenerator: true, isAsync: false }), startState);
      case TokenType.TRUE:
        this.lex();
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.finishNode(new AST.LiteralBooleanExpression({ value: true }), startState);
      case TokenType.FALSE:
        this.lex();
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.finishNode(new AST.LiteralBooleanExpression({ value: false }), startState);
      case TokenType.NULL:
        this.lex();
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.finishNode(new AST.LiteralNullExpression, startState);
      case TokenType.LBRACK:
        return this.parseArrayExpression();
      case TokenType.LBRACE:
        return this.parseObjectExpression();
      case TokenType.TEMPLATE:
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.finishNode(new AST.TemplateExpression({ tag: null, elements: this.parseTemplateElements() }), startState);
      case TokenType.DIV:
      case TokenType.ASSIGN_DIV: {
        this.isBindingElement = this.isAssignmentTarget = false;
        this.lookahead = this.scanRegExp(this.match(TokenType.DIV) ? '/' : '/=');
        let token = this.lex();
        let lastSlash = token.value.lastIndexOf('/');
        let pattern = token.value.slice(1, lastSlash);
        let flags = token.value.slice(lastSlash + 1);
        let ctorArgs = this.parseRegexFlags(flags);
        if (!acceptRegex(pattern, ctorArgs)) {
          throw this.createError(ErrorMessages.INVALID_REGEX);
        }
        ctorArgs.pattern = pattern;
        return this.finishNode(new AST.LiteralRegExpExpression(ctorArgs), startState);
      }
      case TokenType.CLASS:
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.parseClass({ isExpr: true, inDefault: false });
      default:
        throw this.createUnexpected(this.lookahead);
    }
  }

  parseNumericLiteral() {
    let startLocation = this.getLocation();
    let startState = this.startNode();
    let token = this.lex();
    if (token.octal && this.strict) {
      if (token.noctal) {
        throw this.createErrorWithLocation(startLocation, 'Unexpected noctal integer literal');
      } else {
        throw this.createErrorWithLocation(startLocation, 'Unexpected legacy octal integer literal');
      }
    }
    let node = token.value === 1 / 0
      ? new AST.LiteralInfinityExpression
      : new AST.LiteralNumericExpression({ value: token.value });
    return this.finishNode(node, startState);
  }

  parseStringLiteral() {
    let startLocation = this.getLocation();
    let startState = this.startNode();
    let token = this.lex();
    if (token.octal != null && this.strict) {
      throw this.createErrorWithLocation(startLocation, 'Unexpected legacy octal escape sequence: \\' + token.octal);
    }
    return this.finishNode(new AST.LiteralStringExpression({ value: token.str }), startState);
  }

  parseIdentifierName() {
    if (this.lookahead.type.klass.isIdentifierName) {
      return this.lex().value;
    }
    throw this.createUnexpected(this.lookahead);
  }

  parseBindingIdentifier() {
    let startState = this.startNode();
    return this.finishNode(new AST.BindingIdentifier({ name: this.parseIdentifier() }), startState);
  }

  parseIdentifier() {
    if (this.lookahead.value === 'yield' && this.allowYieldExpression) {
      throw this.createError(ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    }
    if (this.lookahead.value === 'await' && this.allowAwaitExpression) {
      throw this.createError(ErrorMessages.ILLEGAL_AWAIT_IDENTIFIER);
    }
    if (this.matchIdentifier()) {
      return this.lex().value;
    }
    throw this.createUnexpected(this.lookahead);
  }

  parseArgumentList() {
    this.lex();
    let args = this.parseArguments();
    this.expect(TokenType.RPAREN);
    return args;
  }

  parseArguments() {
    let args = [];
    let locationFollowingFirstSpread = null;
    while (!this.match(TokenType.RPAREN)) {
      let arg;
      let startState = this.startNode();
      if (this.eat(TokenType.ELLIPSIS)) {
        arg = this.finishNode(new AST.SpreadElement({ expression: this.inheritCoverGrammar(this.parseAssignmentExpressionOrTarget) }), startState);
        if (locationFollowingFirstSpread === null) {
          args.push(arg);
          if (this.match(TokenType.RPAREN)) {
            break;
          }
          locationFollowingFirstSpread = this.getLocation();
          this.expect(TokenType.COMMA);
          continue;
        }
      } else {
        arg = this.inheritCoverGrammar(this.parseAssignmentExpressionOrTarget);
      }
      args.push(arg);
      if (this.match(TokenType.RPAREN)) {
        break;
      }
      this.expect(TokenType.COMMA);
    }
    return { args, locationFollowingFirstSpread };
  }

  // 11.2 Left-Hand-Side Expressions;

  ensureArrow() {
    if (this.hasLineTerminatorBeforeNext) {
      throw this.createError(ErrorMessages.UNEXPECTED_LINE_TERMINATOR);
    }
    if (!this.match(TokenType.ARROW)) {
      this.expect(TokenType.ARROW);
    }
  }

  parseGroupExpression() {
    // At this point, we need to parse 3 things:
    //  1. Group expression
    //  2. Assignment target of assignment expression
    //  3. Parameter list of arrow function
    let rest = null;
    let preParenStartState = this.startNode();
    let start = this.expect(TokenType.LPAREN);
    let postParenStartState = this.startNode();
    if (this.match(TokenType.RPAREN)) {
      this.lex();
      let paramsNode = this.finishNode({
        type: ARROW_EXPRESSION_PARAMS,
        params: [],
        rest: null,
        isAsync: false,
      }, preParenStartState);
      this.ensureArrow();
      this.isBindingElement = this.isAssignmentTarget = false;
      return paramsNode;
    } else if (this.eat(TokenType.ELLIPSIS)) {
      rest = this.parseBindingTarget();
      if (this.match(TokenType.ASSIGN)) {
        throw this.createError(ErrorMessages.INVALID_REST_PARAMETERS_INITIALIZATION);
      }
      if (this.match(TokenType.COMMA)) {
        throw this.createError(ErrorMessages.INVALID_LAST_REST_PARAMETER);
      }
      this.expect(TokenType.RPAREN);
      let paramsNode = this.finishNode({
        type: ARROW_EXPRESSION_PARAMS,
        params: [],
        rest,
        isAsync: false,
      }, preParenStartState);
      this.ensureArrow();
      this.isBindingElement = this.isAssignmentTarget = false;
      return paramsNode;
    }
    let group = this.inheritCoverGrammar(this.parseAssignmentExpressionOrTarget);

    let params = this.isBindingElement ? [this.targetToBinding(this.transformDestructuringWithDefault(group))] : null;

    while (this.eat(TokenType.COMMA)) {
      if (this.match(TokenType.RPAREN)) {
        if (!this.isBindingElement) {
          throw this.createUnexpected(this.lookahead);
        }
        this.firstExprError = this.firstExprError || this.createUnexpected(this.lookahead);
        group = null;
        break;
      }
      this.isAssignmentTarget = false;
      if (this.match(TokenType.ELLIPSIS)) {
        if (!this.isBindingElement) {
          throw this.createUnexpected(this.lookahead);
        }
        this.lex();
        rest = this.parseBindingTarget();
        if (this.match(TokenType.ASSIGN)) {
          throw this.createError(ErrorMessages.INVALID_REST_PARAMETERS_INITIALIZATION);
        }
        if (this.match(TokenType.COMMA)) {
          throw this.createError(ErrorMessages.INVALID_LAST_REST_PARAMETER);
        }
        break;
      }

      if (group) {
        // Can be either binding element or assignment target.
        let expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrTarget);
        if (this.isBindingElement) {
          params.push(this.targetToBinding(this.transformDestructuringWithDefault(expr)));
        } else {
          params = null;
        }

        if (this.firstExprError) {
          group = null;
        } else {
          group = this.finishNode(new AST.BinaryExpression({
            left: group,
            operator: ',',
            right: expr,
          }), postParenStartState);
        }
      } else {
        // Can be only binding elements.
        let binding = this.parseBindingElement();
        params.push(binding);
      }
    }
    this.expect(TokenType.RPAREN);

    if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.ARROW)) {
      if (!this.isBindingElement) {
        throw this.createErrorWithLocation(start, ErrorMessages.ILLEGAL_ARROW_FUNCTION_PARAMS);
      }

      this.isBindingElement = false;
      return this.finishNode({
        type: ARROW_EXPRESSION_PARAMS,
        params,
        rest,
        isAsync: false,
      }, preParenStartState);
    }
    // Ensure assignment pattern:
    if (rest) {
      this.ensureArrow();
    }
    this.isBindingElement = false;
    if (!isValidSimpleAssignmentTarget(group)) {
      this.isAssignmentTarget = false;
    }
    return group;
  }

  parseArrayExpression() {
    let startLocation = this.getLocation();
    let startState = this.startNode();

    this.lex();

    let exprs = [];
    let rest = null;

    while (true) {
      if (this.match(TokenType.RBRACK)) {
        break;
      }
      if (this.eat(TokenType.COMMA)) {
        exprs.push(null);
      } else {
        let elementStartState = this.startNode();
        let expr;
        if (this.eat(TokenType.ELLIPSIS)) {
          // Spread/Rest element
          expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrTarget);
          if (!this.isAssignmentTarget && this.firstExprError) {
            throw this.firstExprError;
          }
          if (expr.type === 'ArrayAssignmentTarget' || expr.type === 'ObjectAssignmentTarget') {
            rest = expr;
            break;
          }
          if (expr.type !== 'ArrayExpression' && expr.type !== 'ObjectExpression' && !isValidSimpleAssignmentTarget(expr)) {
            this.isBindingElement = this.isAssignmentTarget = false;
          }
          expr = this.finishNode(new AST.SpreadElement({ expression: expr }), elementStartState);
          if (!this.match(TokenType.RBRACK)) {
            this.isBindingElement = this.isAssignmentTarget = false;
          }
        } else {
          expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrTarget);
          if (!this.isAssignmentTarget && this.firstExprError) {
            throw this.firstExprError;
          }
        }
        exprs.push(expr);

        if (!this.match(TokenType.RBRACK)) {
          this.expect(TokenType.COMMA);
        }
      }
    }

    if (rest && this.match(TokenType.COMMA)) {
      throw this.createErrorWithLocation(startLocation, ErrorMessages.UNEXPECTED_COMMA_AFTER_REST);
    }

    this.expect(TokenType.RBRACK);

    if (rest) {
      // No need to check isAssignmentTarget: the only way to have something we know is a rest element is if we have ...Object/ArrayAssignmentTarget, which implies we have a firstExprError; as such, if isAssignmentTarget were false, we'd've thrown above before setting rest.
      return this.finishNode(new AST.ArrayAssignmentTarget({
        elements: exprs.map(e => e && this.transformDestructuringWithDefault(e)),
        rest,
      }), startState);
    } else if (this.firstExprError) {
      let last = exprs[exprs.length - 1];
      if (last != null && last.type === 'SpreadElement') {
        return this.finishNode(new AST.ArrayAssignmentTarget({
          elements: exprs.slice(0, -1).map(e => e && this.transformDestructuringWithDefault(e)),
          rest: this.transformDestructuring(last.expression),
        }), startState);
      }
      return this.finishNode(new AST.ArrayAssignmentTarget({
        elements: exprs.map(e => e && this.transformDestructuringWithDefault(e)),
        rest: null,
      }), startState);

    }
    return this.finishNode(new AST.ArrayExpression({ elements: exprs }), startState);
  }

  parseObjectExpression() {
    let startState = this.startNode();
    this.lex();
    let properties = [];
    while (!this.match(TokenType.RBRACE)) {
      let isSpreadProperty = false;
      if (this.match(TokenType.ELLIPSIS)) {
        isSpreadProperty = true;
        let spreadPropertyOrAssignmentTarget = this.parseSpreadPropertyDefinition();
        properties.push(spreadPropertyOrAssignmentTarget);
      } else {
        let property = this.inheritCoverGrammar(this.parsePropertyDefinition);
        properties.push(property);
      }
      if (!this.match(TokenType.RBRACE)) {
        this.expect(TokenType.COMMA);
        if (isSpreadProperty) {
          this.isBindingElement = this.isAssignmentTarget = false;
        }
      }
    }
    this.expect(TokenType.RBRACE);
    if (this.firstExprError) {
      if (!this.isAssignmentTarget) {
        throw this.createError(ErrorMessages.INVALID_LHS_IN_BINDING);
      }
      let last = properties[properties.length - 1];
      if (last != null && last.type === 'SpreadProperty') {
        return this.finishNode(new AST.ObjectAssignmentTarget({
          properties: properties.slice(0, -1).map(p => this.transformDestructuringWithDefault(p)),
          rest: this.transformDestructuring(last.expression),
        }), startState);
      }
      return this.finishNode(new AST.ObjectAssignmentTarget({ properties: properties.map(p => this.transformDestructuringWithDefault(p)), rest: null }), startState);
    }
    return this.finishNode(new AST.ObjectExpression({ properties }), startState);
  }

  parseSpreadPropertyDefinition() {
    let startState = this.startNode();
    this.expect(TokenType.ELLIPSIS);
    let expression = this.parseAssignmentExpression();
    if (!isValidSimpleAssignmentTarget(expression)) {
      this.isBindingElement = this.isAssignmentTarget = false;
    } else if (expression.type !== 'IdentifierExpression') {
      this.isBindingElement = false;
    }
    return this.finishNode(new AST.SpreadProperty({ expression }), startState);
  }

  parsePropertyDefinition() {
    let startLocation = this.getLocation();
    let startState = this.startNode();
    let token = this.lookahead;

    let { methodOrKey, kind } = this.parseMethodDefinition();
    switch (kind) {
      case 'method':
        this.isBindingElement = this.isAssignmentTarget = false;
        return methodOrKey;
      case 'identifier':
        if (token.value === 'await' && this.firstAwaitLocation == null) {
          this.firstAwaitLocation = this.getLocation();
        }
        if (this.eat(TokenType.ASSIGN)) {
          if (this.allowYieldExpression && token.value === 'yield') {
            throw this.createError(ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
          }
          if (this.allowAwaitExpression && token.value === 'await') {
            throw this.createError(ErrorMessages.ILLEGAL_AWAIT_IDENTIFIER);
          }
          // CoverInitializedName
          let init = this.isolateCoverGrammar(this.parseAssignmentExpression);
          this.firstExprError = this.createErrorWithLocation(startLocation, ErrorMessages.ILLEGAL_PROPERTY);
          return this.finishNode(new AST.AssignmentTargetPropertyIdentifier({
            binding: this.transformDestructuring(methodOrKey),
            init,
          }), startState);
        } else if (!this.match(TokenType.COLON)) {
          if (this.allowYieldExpression && token.value === 'yield') {
            throw this.createError(ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
          }
          if (this.allowAwaitExpression && token.value === 'await') {
            throw this.createError(ErrorMessages.ILLEGAL_AWAIT_IDENTIFIER);
          }
          if (token.type === TokenType.IDENTIFIER || token.value === 'let' || token.value === 'yield' || token.value === 'async' || token.value === 'await') {
            return this.finishNode(new AST.ShorthandProperty({ name: this.finishNode(new AST.IdentifierExpression({ name: methodOrKey.value }), startState) }), startState);
          }
          throw this.createUnexpected(token);
        }
    }

    // property
    this.expect(TokenType.COLON);

    let expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrTarget);
    if (this.firstExprError) {
      return this.finishNode(new AST.AssignmentTargetPropertyProperty({ name: methodOrKey, binding: expr }), startState);
    }
    return this.finishNode(new AST.DataProperty({ name: methodOrKey, expression: expr }), startState);
  }

  parsePropertyName() {
    // PropertyName[Yield,GeneratorParameter]:
    let token = this.lookahead;
    let startState = this.startNode();

    if (this.eof()) {
      throw this.createUnexpected(token);
    }

    switch (token.type) {
      case TokenType.STRING:
        return {
          name: this.finishNode(new AST.StaticPropertyName({
            value: this.parseStringLiteral().value,
          }), startState),
          binding: null,
        };
      case TokenType.NUMBER: {
        let numLiteral = this.parseNumericLiteral();
        return {
          name: this.finishNode(new AST.StaticPropertyName({
            value: `${numLiteral.type === 'LiteralInfinityExpression' ? 1 / 0 : numLiteral.value}`,
          }), startState),
          binding: null,
        };
      }
      case TokenType.LBRACK: {
        this.lex();
        let expr = this.parseAssignmentExpression();
        this.expect(TokenType.RBRACK);
        return { name: this.finishNode(new AST.ComputedPropertyName({ expression: expr }), startState), binding: null };
      }
    }

    let name = this.parseIdentifierName();
    return {
      name: this.finishNode(new AST.StaticPropertyName({ value: name }), startState),
      binding: this.finishNode(new AST.BindingIdentifier({ name }), startState),
    };
  }

  /**
   * Test if lookahead can be the beginning of a `PropertyName`.
   * @returns {boolean}
   */
  lookaheadPropertyName() {
    switch (this.lookahead.type) {
      case TokenType.NUMBER:
      case TokenType.STRING:
      case TokenType.LBRACK:
        return true;
      default:
        return this.lookahead.type.klass.isIdentifierName;
    }
  }

  // eslint-disable-next-line valid-jsdoc
  /**
   * Try to parse a method definition.
   *
   * If it turns out to be one of:
   *  * `IdentifierReference`
   *  * `CoverInitializedName` (`IdentifierReference "=" AssignmentExpression`)
   *  * `PropertyName : AssignmentExpression`
   * The parser will stop at the end of the leading `Identifier` or `PropertyName` and return it.
   *
   * @returns {{methodOrKey: (Method|PropertyName), kind: string}}
   */
  parseMethodDefinition() {
    let token = this.lookahead;
    let startState = this.startNode();

    let preAsyncTokenState = this.saveLexerState();

    let isAsync = !!this.eat(TokenType.ASYNC);
    if (isAsync && this.hasLineTerminatorBeforeNext) {
      isAsync = false;
      this.restoreLexerState(preAsyncTokenState);
    }

    let isGenerator = !!this.eat(TokenType.MUL);
    if (isAsync && !this.lookaheadPropertyName()) {
      isAsync = false;
      isGenerator = false;
      this.restoreLexerState(preAsyncTokenState);
    }

    let { name } = this.parsePropertyName();

    if (!isGenerator && !isAsync) {
      if (token.type === TokenType.IDENTIFIER && token.value.length === 3) {
        // Property Assignment: Getter and Setter.
        if (token.value === 'get' && this.lookaheadPropertyName() && !token.escaped) {
          ({ name } = this.parsePropertyName());
          this.expect(TokenType.LPAREN);
          this.expect(TokenType.RPAREN);
          let previousYield = this.allowYieldExpression;
          let previousAwait = this.allowAwaitExpression;
          let previousAwaitLocation = this.firstAwaitLocation;
          this.allowYieldExpression = false;
          this.allowAwaitExpression = false;
          this.firstAwaitLocation = null;
          let body = this.parseFunctionBody();
          this.allowYieldExpression = previousYield;
          this.allowAwaitExpression = previousAwait;
          this.firstAwaitLocation = previousAwaitLocation;
          return {
            methodOrKey: this.finishNode(new AST.Getter({ name, body }), startState),
            kind: 'method',
          };
        } else if (token.value === 'set' && this.lookaheadPropertyName() && !token.escaped) {
          ({ name } = this.parsePropertyName());
          this.expect(TokenType.LPAREN);
          let previousYield = this.allowYieldExpression;
          let previousAwait = this.allowAwaitExpression;
          let previousAwaitLocation = this.firstAwaitLocation;
          this.allowYieldExpression = false;
          this.allowAwaitExpression = false;
          this.firstAwaitLocation = null;
          let param = this.parseBindingElement();
          this.expect(TokenType.RPAREN);
          let body = this.parseFunctionBody();
          this.allowYieldExpression = previousYield;
          this.allowAwaitExpression = previousAwait;
          this.firstAwaitLocation = previousAwaitLocation;
          return {
            methodOrKey: this.finishNode(new AST.Setter({ name, param, body }), startState),
            kind: 'method',
          };
        }
      }
    }
    if (isAsync) {
      let previousYield = this.allowYieldExpression;
      let previousAwait = this.allowAwaitExpression;
      this.allowYieldExpression = isGenerator;
      this.allowAwaitExpression = true;
      let params = this.parseParams();
      this.allowYieldExpression = isGenerator;
      this.allowAwaitExpression = true;
      let body = this.parseFunctionBody();
      this.allowYieldExpression = previousYield;
      this.allowAwaitExpression = previousAwait;
      return {
        methodOrKey: this.finishNode(new AST.Method({ isAsync, isGenerator, name, params, body }), startState),
        kind: 'method',
      };
    }

    if (this.match(TokenType.LPAREN)) {
      let previousYield = this.allowYieldExpression;
      let previousAwait = this.allowAwaitExpression;
      let previousAwaitLocation = this.firstAwaitLocation;
      this.allowYieldExpression = isGenerator;
      this.allowAwaitExpression = false;
      this.firstAwaitLocation = null;
      let params = this.parseParams();
      let body = this.parseFunctionBody();
      this.allowYieldExpression = previousYield;
      this.allowAwaitExpression = previousAwait;
      this.firstAwaitLocation = previousAwaitLocation;

      return {
        methodOrKey: this.finishNode(new AST.Method({ isAsync, isGenerator, name, params, body }), startState),
        kind: 'method',
      };
    }

    if (isGenerator && this.match(TokenType.COLON)) {
      throw this.createUnexpected(this.lookahead);
    }

    return {
      methodOrKey: name,
      kind: token.type.klass.isIdentifierName ? 'identifier' : 'property',
      escaped: token.escaped,
    };
  }

  parseClass({ isExpr, inDefault }) {
    let startState = this.startNode();

    this.lex();
    let name = null;
    let heritage = null;

    if (this.matchIdentifier()) {
      name = this.parseBindingIdentifier();
    } else if (!isExpr) {
      if (inDefault) {
        name = new AST.BindingIdentifier({ name: '*default*' });
      } else {
        throw this.createUnexpected(this.lookahead);
      }
    }

    if (this.eat(TokenType.EXTENDS)) {
      heritage = this.isolateCoverGrammar(() => this.parseLeftHandSideExpression({ allowCall: true }));
    }

    this.expect(TokenType.LBRACE);
    let elements = [];
    while (!this.eat(TokenType.RBRACE)) {
      if (this.eat(TokenType.SEMICOLON)) {
        continue;
      }
      let isStatic = false;
      let classElementStart = this.startNode();
      let { methodOrKey, kind, escaped } = this.parseMethodDefinition();
      if (kind === 'identifier' && methodOrKey.value === 'static' && !escaped) {
        isStatic = true;
        ({ methodOrKey, kind } = this.parseMethodDefinition());
      }
      if (kind === 'method') {
        elements.push(this.finishNode(new AST.ClassElement({ isStatic, method: methodOrKey }), classElementStart));
      } else {
        throw this.createError('Only methods are allowed in classes');
      }
    }
    return this.finishNode(new (isExpr ? AST.ClassExpression : AST.ClassDeclaration)({ name, super: heritage, elements }), startState);
  }

  parseFunction({ isExpr, inDefault, allowGenerator, isAsync, startState = this.startNode() }) {
    this.lex();
    let name = null;
    let isGenerator = allowGenerator && !!this.eat(TokenType.MUL);

    let previousYield = this.allowYieldExpression;
    let previousAwait = this.allowAwaitExpression;
    let previousAwaitLocation = this.firstAwaitLocation;

    if (isExpr) {
      this.allowYieldExpression = isGenerator;
      this.allowAwaitExpression = isAsync;
    }

    if (!this.match(TokenType.LPAREN)) {
      name = this.parseBindingIdentifier();
    } else if (!isExpr) {
      if (inDefault) {
        name = new AST.BindingIdentifier({ name: '*default*' });
      } else {
        throw this.createUnexpected(this.lookahead);
      }
    }
    this.allowYieldExpression = isGenerator;
    this.allowAwaitExpression = isAsync;
    this.firstAwaitLocation = null;
    let params = this.parseParams();
    let body = this.parseFunctionBody();
    this.allowYieldExpression = previousYield;
    this.allowAwaitExpression = previousAwait;
    this.firstAwaitLocation = previousAwaitLocation;

    return this.finishNode(new (isExpr ? AST.FunctionExpression : AST.FunctionDeclaration)({ isAsync, isGenerator, name, params, body }), startState);
  }

  parseArrayBinding() {
    let startState = this.startNode();

    this.expect(TokenType.LBRACK);

    let elements = [], rest = null;

    while (true) {
      if (this.match(TokenType.RBRACK)) {
        break;
      }
      let el;

      if (this.eat(TokenType.COMMA)) {
        el = null;
      } else {
        if (this.eat(TokenType.ELLIPSIS)) {
          rest = this.parseBindingTarget();
          break;
        } else {
          el = this.parseBindingElement();
        }
        if (!this.match(TokenType.RBRACK)) {
          this.expect(TokenType.COMMA);
        }
      }
      elements.push(el);
    }

    this.expect(TokenType.RBRACK);

    return this.finishNode(new AST.ArrayBinding({ elements, rest }), startState);
  }

  parseBindingProperty() {
    let startState = this.startNode();
    let isIdentifier = this.matchIdentifier();
    let token = this.lookahead;
    let { name, binding } = this.parsePropertyName();
    if (isIdentifier && name.type === 'StaticPropertyName') {
      if (!this.match(TokenType.COLON)) {
        if (this.allowYieldExpression && token.value === 'yield') {
          throw this.createError(ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
        }
        if (this.allowAwaitExpression && token.value === 'await') {
          throw this.createError(ErrorMessages.ILLEGAL_AWAIT_IDENTIFIER);
        }
        let defaultValue = null;
        if (this.eat(TokenType.ASSIGN)) {
          defaultValue = this.parseAssignmentExpression();
        }
        return this.finishNode(new AST.BindingPropertyIdentifier({
          binding,
          init: defaultValue,
        }), startState);
      }
    }
    this.expect(TokenType.COLON);
    binding = this.parseBindingElement();
    return this.finishNode(new AST.BindingPropertyProperty({ name, binding }), startState);
  }

  parseObjectBinding() {
    let startState = this.startNode();
    this.expect(TokenType.LBRACE);

    let properties = [];
    let rest = null;
    while (!this.match(TokenType.RBRACE)) {
      if (this.eat(TokenType.ELLIPSIS)) {
        rest = this.parseBindingIdentifier();
        break;
      }
      properties.push(this.parseBindingProperty());
      if (!this.match(TokenType.RBRACE)) {
        this.expect(TokenType.COMMA);
      }
    }

    this.expect(TokenType.RBRACE);

    return this.finishNode(new AST.ObjectBinding({ properties, rest }), startState);
  }

  parseBindingTarget() {
    if (this.matchIdentifier()) {
      return this.parseBindingIdentifier();
    }
    switch (this.lookahead.type) {
      case TokenType.LBRACK:
        return this.parseArrayBinding();
      case TokenType.LBRACE:
        return this.parseObjectBinding();
    }
    throw this.createUnexpected(this.lookahead);
  }

  parseBindingElement() {
    let startState = this.startNode();
    let binding = this.parseBindingTarget();
    if (this.eat(TokenType.ASSIGN)) {
      let init = this.parseAssignmentExpression();
      binding = this.finishNode(new AST.BindingWithDefault({ binding, init }), startState);
    }
    return binding;
  }

  parseParam() {
    let previousInParameter = this.inParameter;
    this.inParameter = true;
    let param = this.parseBindingElement();
    this.inParameter = previousInParameter;
    return param;
  }

  parseParams() {
    let startState = this.startNode();
    this.expect(TokenType.LPAREN);

    let items = [], rest = null;
    while (!this.match(TokenType.RPAREN)) {
      if (this.eat(TokenType.ELLIPSIS)) {
        rest = this.parseBindingTarget();
        if (this.lookahead.type === TokenType.ASSIGN) {
          throw this.createError(ErrorMessages.UNEXPECTED_REST_PARAMETERS_INITIALIZATION);
        }
        if (this.match(TokenType.COMMA)) {
          throw this.createError(ErrorMessages.UNEXPECTED_COMMA_AFTER_REST);
        }
        break;
      }
      items.push(this.parseParam());
      if (this.match(TokenType.RPAREN)) break;
      this.expect(TokenType.COMMA);
    }

    this.expect(TokenType.RPAREN);

    return this.finishNode(new AST.FormalParameters({ items, rest }), startState);
  }
}
