export const storeKey = 'strudel-settings';

export function get(prop) {
  const state = JSON.parse(localStorage.getItem(storeKey));
  if (!prop) {
    return state;
  }
  return state[prop];
}

export function set(next) {
  localStorage.setItem(storeKey, JSON.stringify(next));
}

export function updateState(func) {
  const prev = get();
  const next = func(prev);
  set(next);
  document.dispatchEvent(
    new CustomEvent(storeKey, {
      detail: { next, prev },
    }),
  );
}

export function watch(func, prop) {
  document.addEventListener(storeKey, (e) => {
    const { prev, next } = e.detail;
    const hasPropChanged = (p) => next[p] !== prev[p];
    if (!prop) {
      func(next);
    } else if (hasPropChanged(prop)) {
      func(next[prop]);
    }
  });
}
