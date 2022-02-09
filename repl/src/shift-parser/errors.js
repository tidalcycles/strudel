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

export const ErrorMessages = {
  UNEXPECTED_TOKEN(id) {
    return `Unexpected token ${JSON.stringify(id)}`;
  },
  UNEXPECTED_ILLEGAL_TOKEN(id) {
    return `Unexpected ${JSON.stringify(id)}`;
  },
  UNEXPECTED_ESCAPED_KEYWORD: 'Unexpected escaped keyword',
  UNEXPECTED_NUMBER: 'Unexpected number',
  UNEXPECTED_STRING: 'Unexpected string',
  UNEXPECTED_IDENTIFIER: 'Unexpected identifier',
  UNEXPECTED_RESERVED_WORD: 'Unexpected reserved word',
  UNEXPECTED_TEMPLATE: 'Unexpected template',
  UNEXPECTED_EOS: 'Unexpected end of input',
  UNEXPECTED_LINE_TERMINATOR: 'Unexpected line terminator',
  UNEXPECTED_COMMA_AFTER_REST: 'Unexpected comma after rest',
  UNEXPECTED_REST_PARAMETERS_INITIALIZATION: 'Rest parameter may not have a default initializer',
  NEWLINE_AFTER_THROW: 'Illegal newline after throw',
  UNTERMINATED_REGEXP: 'Invalid regular expression: missing /',
  INVALID_LAST_REST_PARAMETER: 'Rest parameter must be last formal parameter',
  INVALID_REST_PARAMETERS_INITIALIZATION: 'Rest parameter may not have a default initializer',
  INVALID_REGEXP_FLAGS: 'Invalid regular expression flags',
  INVALID_REGEX: 'Invalid regular expression',
  INVALID_LHS_IN_ASSIGNMENT: 'Invalid left-hand side in assignment',
  INVALID_LHS_IN_BINDING: 'Invalid left-hand side in binding', // todo collapse messages?
  INVALID_LHS_IN_FOR_IN: 'Invalid left-hand side in for-in',
  INVALID_LHS_IN_FOR_OF: 'Invalid left-hand side in for-of',
  INVALID_LHS_IN_FOR_AWAIT: 'Invalid left-hand side in for-await',
  INVALID_UPDATE_OPERAND: 'Increment/decrement target must be an identifier or member expression',
  INVALID_EXPONENTIATION_LHS: 'Unary expressions as the left operand of an exponentation expression ' +
    'must be disambiguated with parentheses',
  MULTIPLE_DEFAULTS_IN_SWITCH: 'More than one default clause in switch statement',
  NO_CATCH_OR_FINALLY: 'Missing catch or finally after try',
  ILLEGAL_RETURN: 'Illegal return statement',
  ILLEGAL_ARROW_FUNCTION_PARAMS: 'Illegal arrow function parameter list',
  INVALID_ASYNC_PARAMS: 'Async function parameters must not contain await expressions',
  INVALID_VAR_INIT_FOR_IN: 'Invalid variable declaration in for-in statement',
  INVALID_VAR_INIT_FOR_OF: 'Invalid variable declaration in for-of statement',
  INVALID_VAR_INIT_FOR_AWAIT: 'Invalid variable declaration in for-await statement',
  UNINITIALIZED_BINDINGPATTERN_IN_FOR_INIT: 'Binding pattern appears without initializer in for statement init',
  ILLEGAL_PROPERTY: 'Illegal property initializer',
  INVALID_ID_BINDING_STRICT_MODE(id) {
    return `The identifier ${JSON.stringify(id)} must not be in binding position in strict mode`;
  },
  INVALID_ID_IN_LABEL_STRICT_MODE(id) {
    return `The identifier ${JSON.stringify(id)} must not be in label position in strict mode`;
  },
  INVALID_ID_IN_EXPRESSION_STRICT_MODE(id) {
    return `The identifier ${JSON.stringify(id)} must not be in expression position in strict mode`;
  },
  INVALID_CALL_TO_SUPER: 'Calls to super must be in the "constructor" method of a class expression ' +
    'or class declaration that has a superclass',
  INVALID_DELETE_STRICT_MODE: 'Identifier expressions must not be deleted in strict mode',
  DUPLICATE_BINDING(id) {
    return `Duplicate binding ${JSON.stringify(id)}`;
  },
  ILLEGAL_ID_IN_LEXICAL_DECLARATION(id) {
    return `Lexical declarations must not have a binding named ${JSON.stringify(id)}`;
  },
  UNITIALIZED_CONST: 'Constant lexical declarations must have an initialiser',
  ILLEGAL_LABEL_IN_BODY(stmt) {
    return `The body of a ${stmt} statement must not be a labeled function declaration`;
  },
  ILLEGEAL_LABEL_IN_IF: 'The consequent of an if statement must not be a labeled function declaration',
  ILLEGAL_LABEL_IN_ELSE: 'The alternate of an if statement must not be a labeled function declaration',
  ILLEGAL_CONTINUE_WITHOUT_ITERATION_WITH_ID(id) {
    return `Continue statement must be nested within an iteration statement with label ${JSON.stringify(id)}`;
  },
  ILLEGAL_CONTINUE_WITHOUT_ITERATION: 'Continue statement must be nested within an iteration statement',
  ILLEGAL_BREAK_WITHOUT_ITERATION_OR_SWITCH:
    'Break statement must be nested within an iteration statement or a switch statement',
  ILLEGAL_WITH_STRICT_MODE: 'Strict mode code must not include a with statement',
  ILLEGAL_ACCESS_SUPER_MEMBER: 'Member access on super must be in a method',
  ILLEGAL_SUPER_CALL: 'Calls to super must be in the "constructor" method of a class expression or class declaration that has a superclass',
  DUPLICATE_LABEL_DECLARATION(label) {
    return `Label ${JSON.stringify(label)} has already been declared`;
  },
  ILLEGAL_BREAK_WITHIN_LABEL(label) {
    return `Break statement must be nested within a statement with label ${JSON.stringify(label)}`;
  },
  ILLEGAL_YIELD_EXPRESSIONS(paramType) {
    return `${paramType} parameters must not contain yield expressions`;
  },
  ILLEGAL_YIELD_IDENTIFIER: '"yield" may not be used as an identifier in this context',
  ILLEGAL_AWAIT_IDENTIFIER: '"await" may not be used as an identifier in this context',
  DUPLICATE_CONSTRUCTOR: 'Duplicate constructor method in class',
  ILLEGAL_CONSTRUCTORS: 'Constructors cannot be async, generators, getters or setters',
  ILLEGAL_STATIC_CLASS_NAME: 'Static class methods cannot be named "prototype"',
  NEW_TARGET_ERROR: 'new.target must be within function (but not arrow expression) code',
  DUPLICATE_EXPORT(id) {
    return `Duplicate export ${JSON.stringify(id)}`;
  },
  UNDECLARED_BINDING(id) {
    return `Exported binding ${JSON.stringify(id)} is not declared`;
  },
  DUPLICATE_PROPTO_PROP: 'Duplicate __proto__ property in object literal not allowed',
  ILLEGAL_LABEL_FUNC_DECLARATION: 'Labeled FunctionDeclarations are disallowed in strict mode',
  ILLEGAL_FUNC_DECL_IF: 'FunctionDeclarations in IfStatements are disallowed in strict mode',
  ILLEGAL_USE_STRICT: 'Functions with non-simple parameter lists may not contain a "use strict" directive',
  ILLEGAL_EXPORTED_NAME: 'Names of variables used in an export specifier from the current module must be identifiers',
  NO_OCTALS_IN_TEMPLATES: 'Template literals may not contain octal escape sequences',
  NO_AWAIT_IN_ASYNC_PARAMS: 'Async arrow parameters may not contain "await"',
};
