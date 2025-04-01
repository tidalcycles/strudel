/*
mondo.test.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/mini/test/mini.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { describe, expect, it } from 'vitest';
import { MondoParser, printAst, MondoRunner } from '../mondo.mjs';

const parser = new MondoParser();
const p = (code) => parser.parse(code, -1);

describe('mondo tokenizer', () => {
  const parser = new MondoParser();
  it('should tokenize with locations', () =>
    expect(
      parser
        .tokenize('(one two three)')
        .map((t) => t.value + '=' + t.loc.join('-'))
        .join(' '),
    ).toEqual('(=0-1 one=1-4 two=5-8 three=9-14 )=14-15'));
  // it('should parse with loangleions', () => expect(parser.parse('(one two three)')).toEqual());
  it('should get loangleions', () =>
    expect(parser.get_locations('s bd rim')).toEqual([
      [0, 1],
      [2, 4],
      [5, 8],
    ]));
});
describe('mondo s-expressions parser', () => {
  it('should parse an empty string', () => expect(p('')).toEqual({ type: 'list', children: [] }));
  it('should parse a single item', () =>
    expect(p('a')).toEqual({ type: 'list', children: [{ type: 'plain', value: 'a' }] }));
  it('should parse an empty list', () => expect(p('()')).toEqual({ type: 'list', children: [] }));
  it('should parse a list with 1 item', () =>
    expect(p('(a)')).toEqual({ type: 'list', children: [{ type: 'plain', value: 'a' }] }));
  it('should parse a list with 2 items', () =>
    expect(p('(a b)')).toEqual({
      type: 'list',
      children: [
        { type: 'plain', value: 'a' },
        { type: 'plain', value: 'b' },
      ],
    }));
  it('should parse a list with 2 items', () =>
    expect(p('(a (b c))')).toEqual({
      type: 'list',
      children: [
        { type: 'plain', value: 'a' },
        {
          type: 'list',
          children: [
            { type: 'plain', value: 'b' },
            { type: 'plain', value: 'c' },
          ],
        },
      ],
    }));
  it('should parse numbers', () =>
    expect(p('(1 .2 1.2 10 22.3)')).toEqual({
      type: 'list',
      children: [
        { type: 'number', value: '1' },
        { type: 'number', value: '.2' },
        { type: 'number', value: '1.2' },
        { type: 'number', value: '10' },
        { type: 'number', value: '22.3' },
      ],
    }));
});

let desguar = (a) => {
  return printAst(parser.parse(a), true);
};

describe('mondo sugar', () => {
  it('should desugar []', () => expect(desguar('[a b c]')).toEqual('(square a b c)'));
  it('should desugar [] nested', () => expect(desguar('[a [b c] d]')).toEqual('(square a (square b c) d)'));
  it('should desugar <>', () => expect(desguar('<a b c>')).toEqual('(angle a b c)'));
  it('should desugar <> nested', () => expect(desguar('<a <b c> d>')).toEqual('(angle a (angle b c) d)'));
  it('should desugar mixed [] <>', () => expect(desguar('[a <b c>]')).toEqual('(square a (angle b c))'));
  it('should desugar mixed <> []', () => expect(desguar('<a [b c]>')).toEqual('(angle a (square b c))'));

  it('should desugar .', () => expect(desguar('s jazz . fast 2')).toEqual('(fast 2 (s jazz))'));
  it('should desugar . square', () => expect(desguar('[bd cp . fast 2]')).toEqual('(fast 2 (square bd cp))'));
  it('should desugar . twice', () => expect(desguar('s jazz . fast 2 . slow 2')).toEqual('(slow 2 (fast 2 (s jazz)))'));
  it('should desugar . nested', () => expect(desguar('(s cp . fast 2)')).toEqual('(fast 2 (s cp))'));
  it('should desugar . within []', () => expect(desguar('[bd cp . fast 2]')).toEqual('(fast 2 (square bd cp))'));
  it('should desugar . within , within []', () =>
    expect(desguar('[bd cp . fast 2, x]')).toEqual('(stack (fast 2 (square bd cp)) x)'));

  // it('should desugar .(.', () => expect(desguar('[jazz hh.(.fast 2)]')).toEqual('(square jazz (fast 2 hh))'));

  it('should desugar , |', () => expect(desguar('[bd, hh | oh]')).toEqual('(stack bd (or hh oh))'));
  it('should desugar , | of []', () =>
    expect(desguar('[bd, hh | [oh rim]]')).toEqual('(stack bd (or hh (square oh rim)))'));
  it('should desugar , square', () => expect(desguar('[bd, hh]')).toEqual('(stack bd hh)'));
  it('should desugar , square 2', () => expect(desguar('[bd, hh oh]')).toEqual('(stack bd (square hh oh))'));
  it('should desugar , square 3', () =>
    expect(desguar('[bd cp, hh oh]')).toEqual('(stack (square bd cp) (square hh oh))'));
  it('should desugar , angle', () => expect(desguar('<bd, hh>')).toEqual('(stack bd hh)'));
  it('should desugar , angle 2', () => expect(desguar('<bd, hh oh>')).toEqual('(stack bd (angle hh oh))'));
  it('should desugar , angle 3', () =>
    expect(desguar('<bd cp, hh oh>')).toEqual('(stack (angle bd cp) (angle hh oh))'));
  it('should desugar , ()', () => expect(desguar('(s bd, s cp)')).toEqual('(stack (s bd) (s cp))'));
  it('should desugar * /', () => expect(desguar('[a b*2 c d/3 e]')).toEqual('(square a (* 2 b) c (/ 3 d) e)'));
  it('should desugar []*x', () => expect(desguar('[a [b c]*3]')).toEqual('(square a (* 3 (square b c)))'));
  it('should desugar []*<x y>', () => expect(desguar('[a b*<2 3> c]')).toEqual('(square a (* (angle 2 3) b) c)'));
  it('should desugar x:y', () => expect(desguar('x:y')).toEqual('(: y x)'));
  it('should desugar x:y:z', () => expect(desguar('x:y:z')).toEqual('(: z (: y x))'));
  it('should desugar x:y*x', () => expect(desguar('bd:0*2')).toEqual('(* 2 (: 0 bd))'));
  it('should desugar a..b', () => expect(desguar('0..2')).toEqual('(.. 2 0)'));
  /* it('should desugar x $ y', () => expect(desguar('x $ y')).toEqual('(x y)'));
  it('should desugar x $ y z', () => expect(desguar('x $ y z')).toEqual('(x (y z))'));
  it('should desugar x $ y . z', () => expect(desguar('x $ y . z')).toEqual('(z (x y))')); */

  it('should desugar README example', () =>
    expect(desguar('s [bd hh*2 (cp.crush 4) <mt ht lt>] . speed .8')).toEqual(
      '(speed .8 (s (square bd (* 2 hh) (crush 4 cp) (angle mt ht lt))))',
    ));

  it('should desugar (.)', () => expect(desguar('(.)')).toEqual('(fn (_) _)'));
  it('should desugar lambda', () => expect(desguar('(.fast 2)')).toEqual('(fn (_) (fast 2 _))'));
  it('should desugar lambda call', () => expect(desguar('((.mul 2) 2)')).toEqual('((fn (_) (mul 2 _)) 2)'));
  it('should desugar lambda with pipe', () =>
    expect(desguar('(.fast 2 .room 1)')).toEqual('(fn (_) (room 1 (fast 2 _)))'));
  /* const lambda = parser.parse('(lambda (_) (fast 2 _))');
  const target = { type: 'plain', value: 'xyz' };
  it('should desugar_lambda', () =>
    expect(printAst(parser.desugar_lambda(lambda.children, target))).toEqual('(fast 2 xyz)')); */
});

describe('mondo arithmetic', () => {
  let multi =
    (op) =>
    (init, ...rest) =>
      rest.reduce((acc, arg) => op(acc, arg), init);

  let lib = {
    '+': multi((a, b) => a + b),
    '-': multi((a, b) => a - b),
    '*': multi((a, b) => a * b),
    '/': multi((a, b) => a / b),
    eq: (a, b) => a === b,
    lt: (a, b) => a < b,
    gt: (a, b) => a > b,
    and: (a, b) => a && b,
    or: (a, b) => a || b,
    not: (a) => !a,
    run: (...args) => args[args.length - 1],
    def: () => 0,
    PI: Math.PI,
  };
  function evaluator(node, scope) {
    if (node.type !== 'list') {
      // is leaf
      return scope[node.value] ?? lib[node.value] ?? node.value;
    }
    // is list
    const [fn, ...args] = node.children;
    if (typeof fn !== 'function') {
      throw new Error(`"${fn}": expected function, got ${typeof fn} "${JSON.stringify(fn)}"`);
    }
    return fn(...args);
  }
  const runner = new MondoRunner({ evaluator });
  let evaluate = (exp, scope) => runner.run(`run ${exp}`, scope);
  let pretty = (exp) => printAst(runner.parser.parse(exp), false);
  //it('should eval nested expression', () => expect(runner.run('add 1 (mul 2 PI)').toFixed(2)).toEqual('7.28'));

  it('eval number', () => expect(evaluate('2')).toEqual(2));
  it('eval string', () => expect(evaluate('abc')).toEqual('abc'));
  it('eval list', () => expect(evaluate('(+ 1 2)')).toEqual(3));
  it('eval nested list', () => expect(evaluate('(+ 1 (+ 2 3))')).toEqual(6));
  it('def number', () => expect(evaluate('(def a 2) a')).toEqual(2));
  it('def + ref number', () => expect(evaluate('(def a 2) (* a a)')).toEqual(4));
  it('def + call lambda', () => expect(evaluate('(def sqr (fn (x) (* x x))) (sqr 3)')).toEqual(9));

  // sicp
  it('sicp 8.1', () => expect(evaluate('(+ 137 349)')).toEqual(486));
  it('sicp 8.2', () => expect(evaluate('(- 1000 334)')).toEqual(666));
  it('sicp 8.3', () => expect(evaluate('(* 5 99)')).toEqual(495));
  it('sicp 8.4', () => expect(evaluate('(/ 10 5)')).toEqual(2));
  it('sicp 8.5', () => expect(evaluate('(+ 2.7 10)')).toEqual(12.7));
  it('sicp 9.1', () => expect(evaluate('(+ 21 35 12 7)')).toEqual(75));
  it('sicp 9.2', () => expect(evaluate('(* 25 4 12)')).toEqual(1200));
  it('sicp 9.3', () => expect(evaluate('(+ (* 3 5) (- 10 6))')).toEqual(19));
  it('sicp 9.4', () =>
    expect(pretty('(+ (* 3 (+ (* 2 4) (+ 3 5))) (+ (- 10 7) 6))')).toEqual(`(+ 
 (* 3 
  (+ 
   (* 2 4) 
   (+ 3 5)
  )
 ) 
 (+ 
  (- 10 7) 6
 )
)`)); // this is not exactly pretty printing by convention..

  let scope = {};
  it('sicp 11.1', () => expect(evaluate('(def size 2) (* 5 size)', scope)).toEqual(10));
  it('sicp 11.2', () =>
    expect(evaluate('(def pi 3.14159) (def radius 10) (* pi (* radius radius))', scope)).toEqual(314.159));
  it('sicp 11.3', () => expect(evaluate('(def circumference (* 2 pi radius))', scope)).toEqual(0));
  it('sicp 11.4', () => expect(evaluate('circumference', scope)).toEqual(62.8318));
  it('sicp 13.1', () => expect(evaluate('(* (+ 2 (* 4 6)) (+ 3 5 7))')).toEqual(390));
  it('sicp 16.1', () => expect(evaluate('(def square (fn (x) (* x x)))', scope)).toEqual(0));
  // it('sicp 16.1', () => expect(evaluate('(def (square x) (* x x))', scope)).toEqual(0));
  it('sicp 17.1', () => expect(evaluate('(square 21)', scope)).toEqual(441));
  it('sicp 17.2', () => expect(evaluate('(square (+ 2 5))', scope)).toEqual(49));
  it('sicp 17.3', () => expect(evaluate('(square (square 3))', scope)).toEqual(81));
  it('sicp 17.4', () => expect(evaluate(`(def sumofsquares (fn (x y) (+ (square x) (square y))))`, scope)).toEqual(0));
  it('sicp 17.5', () => expect(evaluate(`(sumofsquares 3 4)`, scope)).toEqual(25));
  it('sicp 17.6', () => expect(evaluate(`(def f (fn (a) (sumofsquares (+ a 1) (* a 2)))) (f 5)`, scope)).toEqual(136));
  it('sicp 21.1', () => expect(evaluate(`(sumofsquares (+ 5 1) (* 5 2))`, scope)).toEqual(136));

  it('sicp 22.1', () =>
    expect(
      evaluate(
        `(def abs (fn (x) 
        (match 
         ((gt x 0) x) 
         ((eq x 0) 0)
         ((lt x 0) (- 0 x))
      )))`, // sicp was doing (- x), which doesnt work with our -
        scope,
      ),
    ).toEqual(0));

  it('sicp gt1', () => expect(evaluate(`(gt -12 0)`, scope)).toEqual(false));
  it('sicp gt2', () => expect(evaluate(`(gt 0 -12)`, scope)).toEqual(true));
  it('sicp lt1', () => expect(evaluate(`(lt -12 0)`, scope)).toEqual(true));
  it('sicp lt2', () => expect(evaluate(`(lt 0 -12)`, scope)).toEqual(false));

  it('sicp 24.1', () => expect(evaluate(`(abs (- 3))`, scope)).toEqual(3));
  it('sicp 24.2', () => expect(evaluate(`(abs (+ 3))`, scope)).toEqual(3));
  it('sicp 24.3', () => expect(evaluate(`(abs -12)`, scope)).toEqual(12));

  it('sicp 24.4', () => expect(evaluate(`(def abs (fn (x) (if (lt x 0) (- 0 x) x)))`, scope)).toEqual(0));
  it('sicp 24.5', () => expect(evaluate(`(abs -13)`, scope)).toEqual(13));
  it('sicp 25.1', () => expect(evaluate(`(and (gt 6 5) (lt 6 10))`, scope)).toEqual(true));
  it('sicp 25.2', () => expect(evaluate(`(and (gt 4 5) (lt 6 10))`, scope)).toEqual(false));

  /* it('sicp 11.1', () => expect(evaluate('(* 5 size)', { size: 3 })).toEqual(15));
  it('sicp 11.1', () => expect(evaluate('(def b 3) (* a b)', scope)).toEqual(12));
  it('sicp 11.1', () => expect(scope.b).toEqual(3)); */
});
