/*
mondo.test.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/mini/test/mini.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { describe, expect, it } from 'vitest';
import { MondoParser, printAst } from '../mondo.mjs';

const parser = new MondoParser();
const p = (code) => parser.parse(code, -1);

describe('mondo tokenizer', () => {
  const parser = new MondoParser();
  it('should tokenize with loangleions', () =>
    expect(
      parser
        .tokenize('(one two three)')
        .map((t) => t.value + '=' + t.loc.join('-'))
        .join(' '),
    ).toEqual('(=0-1 one=1-4 two=5-8 three=9-14 )=14-15'));
  // it('should parse with loangleions', () => expect(parser.parse('(one two three)')).toEqual());
  it('should get loangleions', () =>
    expect(parser.get_locations('s bd rim')).toEqual([
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

  it('should desugar .', () => expect(desguar('s jazz . fast 2')).toEqual('(fast (s jazz) 2)'));
  it('should desugar . square', () => expect(desguar('[bd cp . fast 2]')).toEqual('(fast (square bd cp) 2)'));
  it('should desugar . twice', () => expect(desguar('s jazz . fast 2 . slow 2')).toEqual('(slow (fast (s jazz) 2) 2)'));
  it('should desugar . nested', () => expect(desguar('(s cp . fast 2)')).toEqual('(fast (s cp) 2)'));
  it('should desugar . within []', () => expect(desguar('[bd cp . fast 2]')).toEqual('(fast (square bd cp) 2)'));
  it('should desugar . within , within []', () =>
    expect(desguar('[bd cp . fast 2, x]')).toEqual('(stack (fast (square bd cp) 2) x)'));

  it('should desugar . ()', () => expect(desguar('[jazz hh.(fast 2)]')).toEqual('(square jazz (fast hh 2))'));

  it('should desugar , square', () => expect(desguar('[bd, hh]')).toEqual('(stack bd hh)'));
  it('should desugar , square 2', () => expect(desguar('[bd, hh oh]')).toEqual('(stack bd (square hh oh))'));
  it('should desugar , square 3', () =>
    expect(desguar('[bd cp, hh oh]')).toEqual('(stack (square bd cp) (square hh oh))'));
  it('should desugar , angle', () => expect(desguar('<bd, hh>')).toEqual('(stack bd hh)'));
  it('should desugar , angle 2', () => expect(desguar('<bd, hh oh>')).toEqual('(stack bd (angle hh oh))'));
  it('should desugar , angle 3', () =>
    expect(desguar('<bd cp, hh oh>')).toEqual('(stack (angle bd cp) (angle hh oh))'));
  it('should desugar , ()', () => expect(desguar('(s bd, s cp)')).toEqual('(stack (s bd) (s cp))'));
  it('should desugar * /', () => expect(desguar('[a b*2 c d/3 e]')).toEqual('(square a (* b 2) c (/ d 3) e)'));
  it('should desugar []*x', () => expect(desguar('[a [b c]*3]')).toEqual('(square a (* (square b c) 3))'));
  it('should desugar x:y', () => expect(desguar('x:y')).toEqual('(: x y)'));
  it('should desugar x:y:z', () => expect(desguar('x:y:z')).toEqual('(: (: x y) z)'));
  it('should desugar x:y*x', () => expect(desguar('bd:0*2')).toEqual('(* (: bd 0) 2)'));
  it('should desugar a..b', () => expect(desguar('0..2')).toEqual('(.. 0 2)'));

  it('should desugar README example', () =>
    expect(desguar('s [bd hh*2 cp.(crush 4) <mt ht lt>] . speed .8')).toEqual(
      '(speed (s (square bd (* hh 2) (crush cp 4) (angle mt ht lt))) .8)',
    ));
});
