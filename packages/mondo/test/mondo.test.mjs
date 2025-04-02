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
    add: multi((a, b) => a + b),
    '-': multi((a, b) => a - b),
    sub: multi((a, b) => a - b),
    '*': multi((a, b) => a * b),
    '/': multi((a, b) => a / b),
    mod: multi((a, b) => a % b),
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
  it('sicp 16.1', () => expect(evaluate('(def (square x) (* x x))', scope)).toEqual(0));
  // it('sicp 16.1', () => expect(evaluate('(def (square x) (* x x))', scope)).toEqual(0));
  it('sicp 17.1', () => expect(evaluate('(square 21)', scope)).toEqual(441));
  it('sicp 17.2', () => expect(evaluate('(square (+ 2 5))', scope)).toEqual(49));
  it('sicp 17.3', () => expect(evaluate('(square (square 3))', scope)).toEqual(81));
  it('sicp 17.4', () => expect(evaluate(`(def (sumofsquares x y) (+ (square x) (square y)))`, scope)).toEqual(0));
  it('sicp 17.5', () => expect(evaluate(`(sumofsquares 3 4)`, scope)).toEqual(25));
  it('sicp 17.6', () => expect(evaluate(`(def (f a) (sumofsquares (+ a 1) (* a 2))) (f 5)`, scope)).toEqual(136));
  it('sicp 21.1', () => expect(evaluate(`(sumofsquares (+ 5 1) (* 5 2))`, scope)).toEqual(136));

  it('sicp 22.1', () =>
    expect(
      evaluate(
        `(def (abs x) 
        (match 
         ((gt x 0) x) 
         ((eq x 0) 0)
         ((lt x 0) (- 0 x))
      ))`, // sicp was doing (- x), which doesnt work with our -
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

  it('sicp 24.4', () => expect(evaluate(`(def (abs x) (if (lt x 0) (- 0 x) x))`, scope)).toEqual(0));
  it('sicp 24.5', () => expect(evaluate(`(abs -13)`, scope)).toEqual(13));
  it('sicp 25.1', () => expect(evaluate(`(and (gt 6 5) (lt 6 10))`, scope)).toEqual(true));
  it('sicp 25.2', () => expect(evaluate(`(and (gt 4 5) (lt 6 10))`, scope)).toEqual(false));

  it('sicp ex1.1.1', () => expect(evaluate(`(def a 3)`, scope)).toEqual(0));
  it('sicp ex1.1.2', () => expect(evaluate(`(def b (+ a 1))`, scope)).toEqual(0));
  it('sicp ex1.1.3', () => expect(evaluate(`(+ a b (* a b))`, scope)).toEqual(19));
  it('sicp ex1.1.4', () => expect(evaluate(`(if (and (gt b a) (lt b (* a b))) b a)`, scope)).toEqual(4));
  it('sicp ex1.1.5', () => expect(evaluate(`(match ((eq a 4) 6) ((eq b 4) (+ 6 7 a)) (else 25))`, scope)).toEqual(16));
  it('sicp ex1.1.6', () => expect(evaluate(`(+ 2 (if (gt b a) b a))`, scope)).toEqual(6));
  it('sicp ex1.1.7', () =>
    expect(evaluate(`(* (match ((gt a b) a) ((lt a b) b) (else -1)) (+ a 1))`, scope)).toEqual(16));

  // .. cant use "+" and "-" as standalone expressions, because they are parsed as operators...
  it('sicp ex1.4.1', () => expect(evaluate(`(def (foo a b) ((if (gt b 0) add sub) a b))`, scope)).toEqual(0));
  it('sicp ex1.4.1', () => expect(evaluate(`(foo 3 1)`, scope)).toEqual(4));
  it('sicp ex1.4.2', () => expect(evaluate(`(foo 3 -1)`, scope)).toEqual(4));

  // 1.1.7 Example: Square Roots by Newton’s Method
  it('sicp 30.1', () =>
    expect(evaluate(`(def (goodenuf guess x) (lt (abs (- (square guess) x)) 0.001))`, scope)).toEqual(0));
  it('sicp 30.2', () => expect(evaluate(`(goodenuf 1 1.001)`, scope)).toEqual(true));
  it('sicp 30.3', () => expect(evaluate(`(goodenuf 1 1.002)`, scope)).toEqual(false));
  it('sicp 30.4', () => expect(evaluate(`(def (average x y) (/ (+ x y) 2))`, scope)).toEqual(0));
  it('sicp 30.5', () => expect(evaluate(`(average 18 20)`, scope)).toEqual(19));
  it('sicp 30.6', () => expect(evaluate(`(def (improve guess x) (average guess (/ x guess)))`, scope)).toEqual(0));
  it('sicp 31.1', () =>
    expect(
      evaluate(
        `(def (sqrtiter guess x) (if (goodenuf guess x)
      guess
      (sqrtiter (improve guess x) x)))`,
        scope,
      ),
    ).toEqual(0));
  it('sicp 31.2', () => expect(evaluate(`(def (sqrt x) (sqrtiter 1.0 x))`, scope)).toEqual(0));
  it('sicp 31.3', () => expect(evaluate(`(sqrt 9)`, scope)).toEqual(3.00009155413138));
  it('sicp 31.4', () => expect(evaluate(`(sqrt (+ 100 37))`, scope)).toEqual(11.704699917758145));
  it('sicp 31.5', () => expect(evaluate(`(sqrt (+ (sqrt 2) (sqrt 3)))`, scope)).toEqual(1.77392790232078925));
  it('sicp 31.6', () => expect(evaluate(`(square (sqrt 1000))`, scope)).toEqual(1000.000369924366));

  // lexical scoping
  it('sicp 39.1', () =>
    expect(
      evaluate(
        `
(def (sqrt x)
 (def (goodenough guess)
  (lt (abs (- (square guess) x)) 0.001)) 
(def (improve guess)
 (average guess (/ x guess))) 
(def (sqrt-iter guess)
 (if (goodenough guess) guess (sqrt-iter (improve guess))))
(sqrtiter 1.0))
  
  `,
        scope,
      ),
    ).toEqual(0));

  // recursive fac
  it('sicp 41.1', () => expect(evaluate(`(def (fac n) (if (eq n 1) 1 (* n (fac (- n 1)))))`, scope)).toEqual(0));
  it('sicp 41.2', () => expect(evaluate(`(fac 4)`, scope)).toEqual(24));

  // iterative fac
  it('sicp 41.3', () =>
    expect(
      evaluate(
        `
(def (factorial n) (factiter 1 1 n))
(def (factiter product counter maxcount) 
 (if (gt counter maxcount)
  product
  (factiter (* counter product)
             (+ counter 1)
             maxcount)))
`,
        scope,
      ),
    ).toEqual(0));
  it('sicp 41.4', () => expect(evaluate(`(fac 4)`, scope)).toEqual(24));

  // 46.1
  /* (define (+ a b)
(if (= a 0) b (inc (+ (dec a) b))))
(define (+ a b)
(if (= a 0) b (+ (dec a) (inc b)))) */

  // Exercise 1.10
  //  Ackermann’s function
  it('sicp 47.1', () =>
    expect(
      evaluate(
        `
(def (A x y) (match ((eq y 0) 0) 
((eq x 0) (* 2 y))
((eq y 1) 2)
(else (A (- x 1) (A x (- y 1))))))
`,
        scope,
      ),
    ).toEqual(0));
  it('sicp 47.2', () => expect(evaluate(`(A 1 10)`, scope)).toEqual(1024));
  it('sicp 47.3', () => expect(evaluate(`(A 2 4)`, scope)).toEqual(65536));
  it('sicp 47.4', () => expect(evaluate(`(A 3 3)`, scope)).toEqual(65536));
  it('sicp 47.5', () =>
    expect(
      evaluate(
        `
(def (f n) (A 0 n))
(def (g n) (A 1 n)))
(def (h n) (A 2 n))
(def (k n) (* 5 n n))
    `,
        scope,
      ),
    ).toEqual(0));

  // Tree Recursion
  // recursive process
  it('sicp 48.1', () =>
    expect(
      evaluate(
        `
(def (fib n) (match ((eq n 0) 0) ((eq n 1) 1)
(else (+ (fib (- n 1)) (fib (- n 2))))))
(fib 7)
    `,
        scope,
      ),
    ).toEqual(13));

  // iterative process
  it('sicp 48.2', () =>
    expect(
      evaluate(
        `
(def (fib n) (fibiter 1 0 n))
(def (fibiter a b count) (if (eq count 0)
      b
      (fibiter (+ a b) a (- count 1))))
(fib 7)
    `,
        scope,
      ),
    ).toEqual(13));

  // example: counting change
  it('sicp 52.2', () =>
    expect(
      evaluate(
        `
(def (countchange amount) (cc amount 5))
(def (cc amount kindsofcoins)
 (match 
  ((eq amount 0) 1)
  ((or (lt amount 0) (eq kindsofcoins 0)) 0)
  (else (+ 
   (cc amount (- kindsofcoins 1))
   (cc (- amount (firstdenomination kindsofcoins)) kindsofcoins)))))

(def (firstdenomination kindsofcoins)
(match 
 ((eq kindsofcoins 1) 1) 
 ((eq kindsofcoins 2) 5)
 ((eq kindsofcoins 3) 10)
 ((eq kindsofcoins 4) 25)
 ((eq kindsofcoins 5) 50)))

(countchange 100)
    `,
        scope,
      ),
    ).toEqual(292));

  // todo: pascals triangle
  it('sicp 57.1', () =>
    expect(
      evaluate(
        `
(def (cube x) (* x x x))
(def (p x) (sub (* 3 x) (* 4 (cube x))))
(def (sine angle)
(if (not (gt (abs angle) 0.1)) angle
(p (sine (/ angle 3.0)))))

(sine 12.15)
    `,
        scope,
      ),
    ).toEqual(-0.39980345741334));

  // exponentiation recursive
  it('sicp 57.2', () =>
    expect(
      evaluate(
        `
(def (expt b n) (if (eq n 0) 1 (* b (expt b (- n 1)))))
(expt 2 4)
`,
        scope,
      ),
    ).toEqual(16));

  // exponentiation iterative
  it('sicp 58.1b', () =>
    expect(
      evaluate(
        `
(def (expt b n) (exptiter b n 1))
(def (exptiter b counter product) (if (eq counter 0)
      product
      (exptiter b (- counter 1) (* b product))))
(expt 2 5)
  `,
        scope,
      ),
    ).toEqual(32));

  // exponentiation fast
  it('sicp 58.2', () =>
    expect(
      evaluate(
        `
(def (fastexpt b n) (match ((eq n 0) 1)
((iseven n) (square (fastexpt b (/ n 2)))) (else (* b (fastexpt b (- n 1))))))
(def (iseven n)
(eq (mod n 2) 0))
(fastexpt 2 5)
   `,
        scope,
      ),
    ).toEqual(32));

  // * = repeated addition
  it('sicp 60.1', () =>
    expect(
      evaluate(
        `(def (mult a b) (if (eq b 0)
        0
        (+ a (* a (- b 1)))))
        (mult 3 15)
   `,
      ),
    ).toEqual(45));

  // gcd / euclid
  it('sicp 63.1', () =>
    expect(
      evaluate(
        `(def (gcd a b) (if (eq b 0)
      a
      (gcd b (mod a b))))
      (gcd 20 6)
     `,
      ),
    ).toEqual(2));

  // 65 smallest divisor
  // 67 fermat test
  // ....

  // higher order procedures

  it('sicp 77.1', () =>
    expect(
      evaluate(
        `
(def (sum term a next b)
(if (gt a b) 0 (+ (term a)
(sum term (next a) next b))))
`,
        scope,
      ),
    ).toEqual(0));

  it('sicp 78.1', () =>
    expect(
      evaluate(
        `
(def (inc n) (+ n 1))
(def (cube a) (* a a a))
(def (sumcubes a b)
(sum cube a inc b))
(sumcubes 1 10)
  `,
        scope,
      ),
    ).toEqual(3025));

  it('sicp 78.2', () =>
    expect(
      evaluate(
        `
    (def (identity x) x)
    (def (sumintegers a b)
    (sum identity a inc b))
    (sumintegers 1 10)
    `,
        scope,
      ),
    ).toEqual(55));

  // pisum pulled out defs to make it work
  it('sicp 79.1', () =>
    expect(
      evaluate(
        `
(def (piterm x)
(/ 1.0 (* x (+ x 2)))) 
(def (pinext x) (+ x 4))
(def (pisum a b) 
(sum piterm a pinext b))
(* 8 (pisum 1 1000))
`,
        scope,
      ),
    ).toEqual(3.139592655589783));
});
