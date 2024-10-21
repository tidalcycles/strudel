import { atom } from 'nanostores';
import { useStore } from '@nanostores/react';
import { logger } from '@strudel/core';
import { nanoid } from 'nanoid';
import { settingsMap } from './settings.mjs';
import { confirmDialog, parseJSON, supabase } from './repl/util.mjs';

export let $publicPatterns = atom([]);
export let $featuredPatterns = atom([]);

export const collectionName = {
  user: 'user',
  public: 'Last Creations',
  stock: 'Stock Examples',
  featured: 'Featured',
};

export const patternFilterName = {
  community: 'community',
  user: 'user',
};

const sessionAtom = (name, initial = undefined) => {
  const storage = typeof sessionStorage !== 'undefined' ? sessionStorage : {};
  const store = atom(typeof storage[name] !== 'undefined' ? storage[name] : initial);
  store.listen((newValue) => {
    if (typeof newValue === 'undefined') {
      delete storage[name];
    } else {
      storage[name] = newValue;
    }
  });
  return store;
};

export let $viewingPatternData = sessionAtom('viewingPatternData', {
  id: '',
  code: '',
  collection: collectionName.user,
  created_at: Date.now(),
});

export const getViewingPatternData = () => {
  return parseJSON($viewingPatternData.get());
};
export const useViewingPatternData = () => {
  return useStore($viewingPatternData);
};

export const setViewingPatternData = (data) => {
  $viewingPatternData.set(JSON.stringify(data));
};

export function loadPublicPatterns() {
  return supabase.from('code_v1').select().eq('public', true).limit(20).order('id', { ascending: false });
}

export function loadFeaturedPatterns() {
  return supabase.from('code_v1').select().eq('featured', true).limit(20).order('id', { ascending: false });
}

export async function loadDBPatterns() {
  try {
    const { data: publicPatterns } = await loadPublicPatterns();
    const { data: featuredPatterns } = await loadFeaturedPatterns();
    const featured = {};
    const pub = {};

    publicPatterns?.forEach((data, key) => (pub[data.id ?? key] = data));
    featuredPatterns?.forEach((data, key) => (featured[data.id ?? key] = data));
    $publicPatterns.set(pub);
    $featuredPatterns.set(featured);
  } catch (err) {
    console.error('error loading patterns', err);
  }
}

// reason: https://github.com/tidalcycles/strudel/issues/857
const $activePattern = sessionAtom('activePattern', '');

export function setActivePattern(key) {
  $activePattern.set(key);
}
export function getActivePattern() {
  return $activePattern.get();
}
export function useActivePattern() {
  return useStore($activePattern);
}

export const setLatestCode = (code) => settingsMap.setKey('latestCode', code);

const defaultCode = '';
export const userPattern = {
  collection: collectionName.user,
  getAll() {
    const patterns = parseJSON(settingsMap.get().userPatterns);
    return patterns ?? {};
  },
  getPatternData(id) {
    const userPatterns = this.getAll();
    return userPatterns[id];
  },
  exists(id) {
    return this.getPatternData(id) != null;
  },
  isValidID(id) {
    return id != null && id.length > 0;
  },

  create() {
    const newID = createPatternID();
    const code = defaultCode;
    const data = { code, created_at: Date.now(), id: newID, collection: this.collection };
    return { id: newID, data };
  },
  createAndAddToDB() {
    const newPattern = this.create();
    return this.update(newPattern.id, newPattern.data);
  },

  update(id, data) {
    const userPatterns = this.getAll();
    data = { ...data, id, collection: this.collection };
    setUserPatterns({ ...userPatterns, [id]: data });
    return { id, data };
  },
  duplicate(data) {
    const newPattern = this.create();
    return this.update(newPattern.id, { ...newPattern.data, code: data.code });
  },
  clearAll() {
    confirmDialog(`This will delete all your patterns. Are you really sure?`).then((r) => {
      if (r == false) {
        return;
      }
      const viewingPatternData = getViewingPatternData();
      setUserPatterns({});

      if (viewingPatternData.collection !== this.collection) {
        return { id: viewingPatternData.id, data: viewingPatternData };
      }
      setActivePattern(null);
      return this.create();
    });
  },
  delete(id) {
    const userPatterns = this.getAll();
    delete userPatterns[id];
    if (getActivePattern() === id) {
      setActivePattern(null);
    }
    setUserPatterns(userPatterns);
    const viewingPatternData = getViewingPatternData();
    const viewingID = viewingPatternData?.id;
    if (viewingID === id) {
      return { id: null, data: { code: defaultCode } };
    }
    return { id: viewingID, data: userPatterns[viewingID] };
  },
};

function setUserPatterns(obj) {
  return settingsMap.setKey('userPatterns', JSON.stringify(obj));
}

export const createPatternID = () => {
  return nanoid(12);
};

export async function importPatterns(fileList) {
  const files = Array.from(fileList);
  await Promise.all(
    files.map(async (file, i) => {
      const content = await file.text();
      if (file.type === 'application/json') {
        const userPatterns = userPattern.getAll();
        setUserPatterns({ ...userPatterns, ...parseJSON(content) });
      } else if (file.type === 'text/plain') {
        const id = file.name.replace(/\.[^/.]+$/, '');
        userPattern.update(id, { code: content });
      }
    }),
  );
  logger(`import done!`);
}

export async function exportPatterns() {
  const userPatterns = userPattern.getAll();
  const blob = new Blob([JSON.stringify(userPatterns)], { type: 'application/json' });
  const downloadLink = document.createElement('a');
  downloadLink.href = window.URL.createObjectURL(blob);
  const date = new Date().toISOString().split('T')[0];
  downloadLink.download = `strudel_patterns_${date}.json`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}
