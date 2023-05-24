/*test for issue 302 support alternative solmization types */
import { midi2note } from '../util.mjs';
import { test } from 'vitest';
import assert from 'assert';

test('midi2note - letters', () => {
  const result = midi2note(60, 'letters');
  const expected = 'C4';
  assert.equal(result, expected);
});

test('midi2note - solfeggio', () => {
  const result = midi2note(60, 'solfeggio');
  const expected = 'Do4';
  assert.equal(result, expected);
});

test('midi2note - indian', () => {
  const result = midi2note(60, 'indian');
  const expected = 'Sa4';
  assert.equal(result, expected);
});

test('midi2note - german', () => {
  const result = midi2note(60, 'german');
  const expected = 'C4';
  assert.equal(result, expected);
});

test('midi2note - byzantine', () => {
  const result = midi2note(60, 'byzantine');
  const expected = 'Ni4';
  assert.equal(result, expected);
});

test('midi2note - japanese', () => {
  const result = midi2note(60, 'japanese');
  const expected = 'I4';
  assert.equal(result, expected);
});
