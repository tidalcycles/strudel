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

import MultiMap from 'multimap';

function addEach(thisMap, ...otherMaps) {
  otherMaps.forEach(otherMap => {
    otherMap.forEachEntry((v, k) => {
      thisMap.set.apply(thisMap, [k].concat(v));
    });
  });
  return thisMap;
}

let identity; // initialised below EarlyErrorState

export class EarlyErrorState {

  constructor() {
    this.errors = [];
    // errors that are only errors in strict mode code
    this.strictErrors = [];

    // Label values used in LabeledStatement nodes; cleared at function boundaries
    this.usedLabelNames = [];

    // BreakStatement nodes; cleared at iteration; switch; and function boundaries
    this.freeBreakStatements = [];
    // ContinueStatement nodes; cleared at
    this.freeContinueStatements = [];

    // labeled BreakStatement nodes; cleared at LabeledStatement with same Label and function boundaries
    this.freeLabeledBreakStatements = [];
    // labeled ContinueStatement nodes; cleared at labeled iteration statement with same Label and function boundaries
    this.freeLabeledContinueStatements = [];

    // NewTargetExpression nodes; cleared at function (besides arrow expression) boundaries
    this.newTargetExpressions = [];

    // BindingIdentifier nodes; cleared at containing declaration node
    this.boundNames = new MultiMap;
    // BindingIdentifiers that were found to be in a lexical binding position
    this.lexicallyDeclaredNames = new MultiMap;
    // BindingIdentifiers that were the name of a FunctionDeclaration
    this.functionDeclarationNames = new MultiMap;
    // BindingIdentifiers that were found to be in a variable binding position
    this.varDeclaredNames = new MultiMap;
    // BindingIdentifiers that were found to be in a variable binding position
    this.forOfVarDeclaredNames = [];

    // Names that this module exports
    this.exportedNames = new MultiMap;
    // Locally declared names that are referenced in export declarations
    this.exportedBindings = new MultiMap;

    // CallExpressions with Super callee
    this.superCallExpressions = [];
    // SuperCall expressions in the context of a Method named "constructor"
    this.superCallExpressionsInConstructorMethod = [];
    // MemberExpressions with Super object
    this.superPropertyExpressions = [];

    // YieldExpression and YieldGeneratorExpression nodes; cleared at function boundaries
    this.yieldExpressions = [];
    // AwaitExpression nodes; cleared at function boundaries
    this.awaitExpressions = [];
  }


  addFreeBreakStatement(s) {
    this.freeBreakStatements.push(s);
    return this;
  }

  addFreeLabeledBreakStatement(s) {
    this.freeLabeledBreakStatements.push(s);
    return this;
  }

  clearFreeBreakStatements() {
    this.freeBreakStatements = [];
    return this;
  }

  addFreeContinueStatement(s) {
    this.freeContinueStatements.push(s);
    return this;
  }

  addFreeLabeledContinueStatement(s) {
    this.freeLabeledContinueStatements.push(s);
    return this;
  }

  clearFreeContinueStatements() {
    this.freeContinueStatements = [];
    return this;
  }

  enforceFreeBreakStatementErrors(createError) {
    [].push.apply(this.errors, this.freeBreakStatements.map(createError));
    this.freeBreakStatements = [];
    return this;
  }

  enforceFreeLabeledBreakStatementErrors(createError) {
    [].push.apply(this.errors, this.freeLabeledBreakStatements.map(createError));
    this.freeLabeledBreakStatements = [];
    return this;
  }

  enforceFreeContinueStatementErrors(createError) {
    [].push.apply(this.errors, this.freeContinueStatements.map(createError));
    this.freeContinueStatements = [];
    return this;
  }

  enforceFreeLabeledContinueStatementErrors(createError) {
    [].push.apply(this.errors, this.freeLabeledContinueStatements.map(createError));
    this.freeLabeledContinueStatements = [];
    return this;
  }


  observeIterationLabel(label) {
    this.usedLabelNames.push(label);
    this.freeLabeledBreakStatements = this.freeLabeledBreakStatements.filter(s => s.label !== label);
    this.freeLabeledContinueStatements = this.freeLabeledContinueStatements.filter(s => s.label !== label);
    return this;
  }

  observeNonIterationLabel(label) {
    this.usedLabelNames.push(label);
    this.freeLabeledBreakStatements = this.freeLabeledBreakStatements.filter(s => s.label !== label);
    return this;
  }

  clearUsedLabelNames() {
    this.usedLabelNames = [];
    return this;
  }


  observeSuperCallExpression(node) {
    this.superCallExpressions.push(node);
    return this;
  }

  observeConstructorMethod() {
    this.superCallExpressionsInConstructorMethod = this.superCallExpressions;
    this.superCallExpressions = [];
    return this;
  }

  clearSuperCallExpressionsInConstructorMethod() {
    this.superCallExpressionsInConstructorMethod = [];
    return this;
  }

  enforceSuperCallExpressions(createError) {
    [].push.apply(this.errors, this.superCallExpressions.map(createError));
    [].push.apply(this.errors, this.superCallExpressionsInConstructorMethod.map(createError));
    this.superCallExpressions = [];
    this.superCallExpressionsInConstructorMethod = [];
    return this;
  }

  enforceSuperCallExpressionsInConstructorMethod(createError) {
    [].push.apply(this.errors, this.superCallExpressionsInConstructorMethod.map(createError));
    this.superCallExpressionsInConstructorMethod = [];
    return this;
  }


  observeSuperPropertyExpression(node) {
    this.superPropertyExpressions.push(node);
    return this;
  }

  clearSuperPropertyExpressions() {
    this.superPropertyExpressions = [];
    return this;
  }

  enforceSuperPropertyExpressions(createError) {
    [].push.apply(this.errors, this.superPropertyExpressions.map(createError));
    this.superPropertyExpressions = [];
    return this;
  }


  observeNewTargetExpression(node) {
    this.newTargetExpressions.push(node);
    return this;
  }

  clearNewTargetExpressions() {
    this.newTargetExpressions = [];
    return this;
  }


  bindName(name, node) {
    this.boundNames.set(name, node);
    return this;
  }

  clearBoundNames() {
    this.boundNames = new MultiMap;
    return this;
  }

  observeLexicalDeclaration() {
    addEach(this.lexicallyDeclaredNames, this.boundNames);
    this.boundNames = new MultiMap;
    return this;
  }

  observeLexicalBoundary() {
    this.previousLexicallyDeclaredNames = this.lexicallyDeclaredNames;
    this.lexicallyDeclaredNames = new MultiMap;
    this.functionDeclarationNames = new MultiMap;
    return this;
  }

  enforceDuplicateLexicallyDeclaredNames(createError) {
    this.lexicallyDeclaredNames.forEachEntry(nodes => {
      if (nodes.length > 1) {
        nodes.slice(1).forEach(dupeNode => {
          this.addError(createError(dupeNode));
        });
      }
    });
    return this;
  }

  enforceConflictingLexicallyDeclaredNames(otherNames, createError) {
    this.lexicallyDeclaredNames.forEachEntry((nodes, bindingName) => {
      if (otherNames.has(bindingName)) {
        nodes.forEach(conflictingNode => {
          this.addError(createError(conflictingNode));
        });
      }
    });
    return this;
  }

  observeFunctionDeclaration() {
    this.observeVarBoundary();
    addEach(this.functionDeclarationNames, this.boundNames);
    this.boundNames = new MultiMap;
    return this;
  }

  functionDeclarationNamesAreLexical() {
    addEach(this.lexicallyDeclaredNames, this.functionDeclarationNames);
    this.functionDeclarationNames = new MultiMap;
    return this;
  }

  observeVarDeclaration() {
    addEach(this.varDeclaredNames, this.boundNames);
    this.boundNames = new MultiMap;
    return this;
  }

  recordForOfVars() {
    this.varDeclaredNames.forEach(bindingIdentifier => {
      this.forOfVarDeclaredNames.push(bindingIdentifier);
    });
    return this;
  }

  observeVarBoundary() {
    this.lexicallyDeclaredNames = new MultiMap;
    this.functionDeclarationNames = new MultiMap;
    this.varDeclaredNames = new MultiMap;
    this.forOfVarDeclaredNames = [];
    return this;
  }


  exportName(name, node) {
    this.exportedNames.set(name, node);
    return this;
  }

  exportDeclaredNames() {
    addEach(this.exportedNames, this.lexicallyDeclaredNames, this.varDeclaredNames);
    addEach(this.exportedBindings, this.lexicallyDeclaredNames, this.varDeclaredNames);
    return this;
  }

  exportBinding(name, node) {
    this.exportedBindings.set(name, node);
    return this;
  }

  clearExportedBindings() {
    this.exportedBindings = new MultiMap;
    return this;
  }


  observeYieldExpression(node) {
    this.yieldExpressions.push(node);
    return this;
  }

  clearYieldExpressions() {
    this.yieldExpressions = [];
    return this;
  }

  observeAwaitExpression(node) {
    this.awaitExpressions.push(node);
    return this;
  }

  clearAwaitExpressions() {
    this.awaitExpressions = [];
    return this;
  }


  addError(e) {
    this.errors.push(e);
    return this;
  }

  addStrictError(e) {
    this.strictErrors.push(e);
    return this;
  }

  enforceStrictErrors() {
    [].push.apply(this.errors, this.strictErrors);
    this.strictErrors = [];
    return this;
  }


  // MONOID IMPLEMENTATION

  static empty() {
    return identity;
  }

  concat(s) {
    if (this === identity) return s;
    if (s === identity) return this;
    [].push.apply(this.errors, s.errors);
    [].push.apply(this.strictErrors, s.strictErrors);
    [].push.apply(this.usedLabelNames, s.usedLabelNames);
    [].push.apply(this.freeBreakStatements, s.freeBreakStatements);
    [].push.apply(this.freeContinueStatements, s.freeContinueStatements);
    [].push.apply(this.freeLabeledBreakStatements, s.freeLabeledBreakStatements);
    [].push.apply(this.freeLabeledContinueStatements, s.freeLabeledContinueStatements);
    [].push.apply(this.newTargetExpressions, s.newTargetExpressions);
    addEach(this.boundNames, s.boundNames);
    addEach(this.lexicallyDeclaredNames, s.lexicallyDeclaredNames);
    addEach(this.functionDeclarationNames, s.functionDeclarationNames);
    addEach(this.varDeclaredNames, s.varDeclaredNames);
    [].push.apply(this.forOfVarDeclaredNames, s.forOfVarDeclaredNames);
    addEach(this.exportedNames, s.exportedNames);
    addEach(this.exportedBindings, s.exportedBindings);
    [].push.apply(this.superCallExpressions, s.superCallExpressions);
    [].push.apply(this.superCallExpressionsInConstructorMethod, s.superCallExpressionsInConstructorMethod);
    [].push.apply(this.superPropertyExpressions, s.superPropertyExpressions);
    [].push.apply(this.yieldExpressions, s.yieldExpressions);
    [].push.apply(this.awaitExpressions, s.awaitExpressions);
    return this;
  }

}

identity = new EarlyErrorState;
Object.getOwnPropertyNames(EarlyErrorState.prototype).forEach(methodName => {
  if (methodName === 'constructor') return;
  Object.defineProperty(identity, methodName, {
    value() {
      return EarlyErrorState.prototype[methodName].apply(new EarlyErrorState, arguments);
    },
    enumerable: false,
    writable: true,
    configurable: true,
  });
});

export class EarlyError extends Error {
  constructor(node, message) {
    super(message);
    this.node = node;
    this.message = message;
  }
}
