import { describe, it, expect } from 'vitest';
import { Note } from '../tonleiter.mjs';

describe('tonleiter', () => {
  it('Should tokenize notes', () => {
    expect(Note.tokenize('c')).toEqual(['c', '']);
    expect(Note.tokenize('C')).toEqual(['C', '']);
    expect(Note.tokenize('c#')).toEqual(['c', '#']);
    expect(Note.tokenize('Bb')).toEqual(['B', 'b']);
  });
});
