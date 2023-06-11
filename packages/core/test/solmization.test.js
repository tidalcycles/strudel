/*test for issue 302 support alternative solmization types */
import { sol2note } from '../util.mjs';
import { test } from 'vitest';
import assert from 'assert';

test('solmization - letters', () => {
  const result = sol2note(60, 'letters');
  const expected = 'C4';
  assert.equal(result, expected);
});

test('solmization - solfeggio', () => {
  const result = sol2note(60, 'solfeggio');
  const expected = 'Do4';
  assert.equal(result, expected);
});

test('solmization - indian', () => {
  const result = sol2note(60, 'indian');
  const expected = 'Sa4';
  assert.equal(result, expected);
});

test('solmization - german', () => {
  const result = sol2note(60, 'german');
  const expected = 'C4';
  assert.equal(result, expected);
});

test('solmization - byzantine', () => {
  const result = sol2note(60, 'byzantine');
  const expected = 'Ni4';
  assert.equal(result, expected);
});

test('solmization - japanese', () => {
  const result = sol2note(60, 'japanese');
  const expected = 'I4';
  assert.equal(result, expected);
});
