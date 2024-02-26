import { describe, expect, it } from 'vitest';
import { getMetadata } from '../website/src/metadata_parser';

describe.concurrent('Metadata parser', () => {
  it('loads a tag from inline comment', async () => {
    const tune = `// @title Awesome song`;
    expect(getMetadata(tune)).toStrictEqual({
      title: 'Awesome song',
    });
  });

  it('loads many tags from inline comments', async () => {
    const tune = `// @title Awesome song
// @by Sam`;
    expect(getMetadata(tune)).toStrictEqual({
      title: 'Awesome song',
      by: ['Sam'],
    });
  });

  it('loads many tags from one inline comment', async () => {
    const tune = `// @title Awesome song @by Sam`;
    expect(getMetadata(tune)).toStrictEqual({
      title: 'Awesome song',
      by: ['Sam'],
    });
  });

  it('loads a tag from a block comment', async () => {
    const tune = `/* @title Awesome song */`;
    expect(getMetadata(tune)).toStrictEqual({
      title: 'Awesome song',
    });
  });

  it('loads many tags from a block comment', async () => {
    const tune = `/*
@title Awesome song
@by Sam
*/`;
    expect(getMetadata(tune)).toStrictEqual({
      title: 'Awesome song',
      by: ['Sam'],
    });
  });

  it('loads many tags from many block comments', async () => {
    const tune = `/* @title Awesome song */
/* @by Sam */`;
    expect(getMetadata(tune)).toStrictEqual({
      title: 'Awesome song',
      by: ['Sam'],
    });
  });

  it('loads many tags from mixed comments', async () => {
    const tune = `/* @title Awesome song */
// @by Sam
`;
    expect(getMetadata(tune)).toStrictEqual({
      title: 'Awesome song',
      by: ['Sam'],
    });
  });

  it('loads a title tag with quotes syntax', async () => {
    const tune = `// "Awesome song"`;
    expect(getMetadata(tune)).toStrictEqual({
      title: 'Awesome song',
    });
  });

  it('loads a title tag with quotes syntax among other tags', async () => {
    const tune = `// "Awesome song" made @by Sam`;
    expect(getMetadata(tune)).toStrictEqual({
      title: 'Awesome song',
      by: ['Sam'],
    });
  });

  it('loads a title tag with quotes syntax from block comment', async () => {
    const tune = `/* "Awesome song"
@by Sam */`;
    expect(getMetadata(tune)).toStrictEqual({
      title: 'Awesome song',
      by: ['Sam'],
    });
  });

  it('does not load a title tag with quotes syntax after a prefix', async () => {
    const tune = `// I don't care about those "metadata".`;
    expect(getMetadata(tune)).toStrictEqual({});
  });

  it('does not load a title tag with quotes syntax after an other comment', async () => {
    const tune = `// I don't care about those
// "metadata"`;
    expect(getMetadata(tune)).toStrictEqual({});
  });

  it('does not load a title tag with quotes syntax after other tags', async () => {
    const tune = `/*
@by Sam aka "Lady Strudel"
    "Sandyyy"
*/`;
    expect(getMetadata(tune)).toStrictEqual({
      by: ['Sam aka "Lady Strudel"', '"Sandyyy"'],
    });
  });

  it('loads a tag list with comma-separated values syntax', async () => {
    const tune = `// @by Sam, Sandy`;
    expect(getMetadata(tune)).toStrictEqual({
      by: ['Sam', 'Sandy'],
    });
  });

  it('loads a tag list with duplicate keys syntax', async () => {
    const tune = `// @by Sam
// @by Sandy`;
    expect(getMetadata(tune)).toStrictEqual({
      by: ['Sam', 'Sandy'],
    });
  });

  it('loads a tag list with duplicate keys syntax, with prefixes', async () => {
    const tune = `// song @by Sam
// samples @by Sandy`;
    expect(getMetadata(tune)).toStrictEqual({
      by: ['Sam', 'Sandy'],
    });
  });

  it('loads many tag lists with duplicate keys syntax, within code', async () => {
    const tune = `note("a3 c#4 e4 a4") // @by Sam @license CC0
    s("bd hh sd hh") // @by Sandy @license CC BY-NC-SA`;
    expect(getMetadata(tune)).toStrictEqual({
      by: ['Sam', 'Sandy'],
      license: ['CC0', 'CC BY-NC-SA'],
    });
  });

  it('loads a tag list with duplicate keys syntax from block comment', async () => {
    const tune = `/* @by Sam
@by Sandy */`;
    expect(getMetadata(tune)).toStrictEqual({
      by: ['Sam', 'Sandy'],
    });
  });

  it('loads a tag list with newline syntax', async () => {
    const tune = `/*
@by Sam
    Sandy */`;
    expect(getMetadata(tune)).toStrictEqual({
      by: ['Sam', 'Sandy'],
    });
  });

  it('loads a multiline tag from block comment', async () => {
    const tune = `/*
@details I wrote this song in February 19th, 2023.
         It was around midnight and I was lying on
         the sofa in the living room.
*/`;
    expect(getMetadata(tune)).toStrictEqual({
      details:
        'I wrote this song in February 19th, 2023. ' +
        'It was around midnight and I was lying on the sofa in the living room.',
    });
  });

  it('loads a multiline tag from block comment with duplicate keys', async () => {
    const tune = `/*
@details I wrote this song in February 19th, 2023.
@details It was around midnight and I was lying on
         the sofa in the living room.
*/`;
    expect(getMetadata(tune)).toStrictEqual({
      details:
        'I wrote this song in February 19th, 2023. ' +
        'It was around midnight and I was lying on the sofa in the living room.',
    });
  });

  it('loads a multiline tag from inline comments', async () => {
    const tune = `// @details I wrote this song in February 19th, 2023.
// @details It was around midnight and I was lying on
// @details the sofa in the living room.
*/`;
    expect(getMetadata(tune)).toStrictEqual({
      details:
        'I wrote this song in February 19th, 2023. ' +
        'It was around midnight and I was lying on the sofa in the living room.',
    });
  });

  it('loads empty tags from inline comments', async () => {
    const tune = `// @title
// @by`;
    expect(getMetadata(tune)).toStrictEqual({
      title: '',
      by: [],
    });
  });

  it('loads tags with whitespaces from inline comments', async () => {
    const tune = `   //   @title   Awesome   song   
   //    @by   Sam   Tagada   `;
    expect(getMetadata(tune)).toStrictEqual({
      title: 'Awesome song',
      by: ['Sam Tagada'],
    });
  });

  it('loads tags with whitespaces from block comment', async () => {
    const tune = `   /*   @title   Awesome   song   
       @by   Sam   Tagada   */   `;
    expect(getMetadata(tune)).toStrictEqual({
      title: 'Awesome song',
      by: ['Sam Tagada'],
    });
  });

  it('loads empty tags from block comment', async () => {
    const tune = `/* @title
@by */`;
    expect(getMetadata(tune)).toStrictEqual({
      title: '',
      by: [],
    });
  });

  it('does not load tags if there is not', async () => {
    const tune = `note("a3 c#4 e4 a4")`;
    expect(getMetadata(tune)).toStrictEqual({});
  });

  it('does not load code that looks like a metadata tag', async () => {
    const tune = `const str1 = '@title Awesome song'`;
    // need a lexer to avoid this one, but it's a pretty rare use case:
    // const tune = `const str1 = '// @title Awesome song'`;

    expect(getMetadata(tune)).toStrictEqual({});
  });
});
