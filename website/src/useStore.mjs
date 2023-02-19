import { useEffect, useState } from 'react';
// import { useEvent } from '@strudel.cycles/react';
import * as Store from '../public/store.mjs';
import {} from 'react';

function useStore() {
  const [state, setState] = useState(Store.get());
  useEvent(Store.storeKey, (e) => setState(e.detail.next));
  return { state, update: Store.updateState };
}

// TODO: dedupe
function useEvent(name, onTrigger, useCapture = false) {
  useEffect(() => {
    document.addEventListener(name, onTrigger, useCapture);
    return () => {
      document.removeEventListener(name, onTrigger, useCapture);
    };
  }, [onTrigger]);
}

export default useStore;
