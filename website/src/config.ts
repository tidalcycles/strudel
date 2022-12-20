export const SITE = {
  title: 'Strudel Docs',
  description: 'Documentation for the Strudel Live Coding Language',
  defaultLanguage: 'en_US',
};

export const OPEN_GRAPH = {
  image: {
    src: 'https://github.com/withastro/astro/blob/main/assets/social/banner-minimal.png?raw=true',
    alt:
      'astro logo on a starry expanse of space,' + ' with a purple saturn-like planet floating in the right foreground',
  },
  twitter: 'astrodotbuild',
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

export type Sidebar = Record<typeof KNOWN_LANGUAGE_CODES[number], Record<string, { text: string; link: string }[]>>;
export const SIDEBAR: Sidebar = {
  en: {
    Learn: [
      { text: 'Getting Started', link: 'learn/getting-started' },
      { text: 'Mini Notation', link: 'learn/mini-notation' },
      { text: 'Synths, Samples & FX', link: 'learn/synths-samples-effects' },
      { text: 'Functions', link: 'learn/functions' },
      { text: 'Signals', link: 'learn/signals' },
      { text: 'Tonal', link: 'learn/tonal' },
      { text: 'Outputs', link: 'learn/outputs' },
    ],
  },
};
