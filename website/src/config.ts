export const SITE = {
  title: 'Strudel',
  description: 'Strudel is a music live coding editor that brings TidalCycles to the browser.',
  defaultLanguage: 'en',
};

export const OPEN_GRAPH = {
  image: {
    src: 'https://strudel.tidalcycles.org/icon.png',
    alt: 'Strudel Logo',
  },
};

// This is the type of the frontmatter you put in the docs markdown files.
export type Frontmatter = {
  title: string;
  description: string;
  layout: string;
  image?: { src: string; alt: string };
  dir?: 'ltr' | 'rtl';
  ogLocale?: string;
  lang?: string;
};

export const KNOWN_LANGUAGES = {
  English: 'en',
} as const;
export const KNOWN_LANGUAGE_CODES = Object.values(KNOWN_LANGUAGES);

export const GITHUB_EDIT_URL = `https://github.com/tidalcycles/strudel/tree/main/website`;

export const COMMUNITY_INVITE_URL = `https://discord.com/invite/HGEdXmRkzT`;

// See "Algolia" section of the README for more information.
export const ALGOLIA = {
  indexName: 'XXXXXXXXXX',
  appId: 'XXXXXXXXXX',
  apiKey: 'XXXXXXXXXX',
};

export type Sidebar = Record<(typeof KNOWN_LANGUAGE_CODES)[number], Record<string, { text: string; link: string }[]>>;
export const SIDEBAR: Sidebar = {
  en: {
    Tutorial: [
      { text: 'Getting Started', link: 'learn/getting-started' },
      { text: 'Notes', link: 'learn/notes' },
      { text: 'Sounds', link: 'learn/sounds' },
      { text: 'Coding syntax', link: 'learn/code' },
      { text: 'Mini-Notation', link: 'learn/mini-notation' },
    ],
    'Making Sound': [
      { text: 'Samples', link: 'learn/samples' },
      { text: 'Synths', link: 'learn/synths' },
      { text: 'Audio Effects', link: 'learn/effects' },
      { text: 'CSound', link: 'learn/csound' },
    ],
    'Pattern Functions': [
      { text: 'Introduction', link: 'functions/intro' },
      { text: 'Pattern Constructors', link: 'learn/factories' },
      { text: 'Time Modifiers', link: 'learn/time-modifiers' },
      { text: 'Control Parameters', link: 'functions/value-modifiers' },
      { text: 'Signals', link: 'learn/signals' },
      { text: 'Conditional Modifiers', link: 'learn/conditional-modifiers' },
      { text: 'Accumulation', link: 'learn/accumulation' },
      { text: 'Tonal Modifiers', link: 'learn/tonal' },
    ],
    More: [
      { text: 'MIDI & OSC', link: 'learn/input-output' },
      { text: 'Offline', link: 'learn/pwa' },
      { text: 'Patterns', link: 'technical-manual/patterns' },
      { text: 'Pattern Alignment', link: 'technical-manual/alignment' },
      { text: 'Strudel vs Tidal', link: 'learn/strudel-vs-tidal' },
    ],
    Development: [
      { text: 'REPL', link: 'technical-manual/repl' },
      { text: 'Docs', link: 'technical-manual/docs' },
      { text: 'Testing', link: 'technical-manual/testing' },
      // { text: 'Packages', link: 'technical-manual/packages' },
      // { text: 'Internals', link: 'technical-manual/internals' },
    ],
  },
};
