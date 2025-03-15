/*
uzu.test.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/mini/test/mini.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { describe, expect, it } from 'vitest';
import { UzuParser, UzuRunner, printAst } from '../uzu.mjs';

const parser = new UzuParser();
const p = (code) => parser.parse(code);

describe('uzu s-expressions parser', () => {
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

describe('uzu sugar', () => {
  it('should desugar []', () => expect(desguar('[a b c]')).toEqual('(seq a b c)'));
  it('should desugar [] nested', () => expect(desguar('[a [b c]]')).toEqual('(seq a (seq b c))'));
  it('should desugar <>', () => expect(desguar('<a b c>')).toEqual('(cat a b c)'));
  it('should desugar <> nested', () => expect(desguar('<a <b c>>')).toEqual('(cat a (cat b c))'));
  it('should desugar mixed [] <>', () => expect(desguar('[a <b c>]')).toEqual('(seq a (cat b c))'));
  it('should desugar mixed <> []', () => expect(desguar('<a [b c]>')).toEqual('(cat a (seq b c))'));
  it('should desugar .', () => expect(desguar('s jazz . fast 2')).toEqual('(fast (s jazz) 2)'));
  it('should desugar . twice', () => expect(desguar('s jazz . fast 2 . slow 2')).toEqual('(slow (fast (s jazz) 2) 2)'));
  it('should desugar README example', () =>
    expect(desguar('s [bd hh*2 cp.(crush 4) <mt ht lt>] . speed .8')).toEqual(
      '(speed (s (seq bd (* hh 2) (crush cp 4) (cat mt ht lt))) .8)',
    ));
});
