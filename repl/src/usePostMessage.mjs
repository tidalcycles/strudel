import { useEffect, useCallback } from 'react';

function usePostMessage(listener) {
  useEffect(() => {
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [listener]);
  return useCallback((data) => window.postMessage(data, '*'), []);
}

export default usePostMessage;
