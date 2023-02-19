import { useState } from 'react';
import { useEvent } from '@strudel.cycles/react';
import * as Store from '../public/store.mjs';

function useStore() {
  const [state, setState] = useState(Store.get());
  useEvent(Store.storeKey, (e) => setState(e.detail.next));
  return { state, update: Store.updateState };
}

export default useStore;
