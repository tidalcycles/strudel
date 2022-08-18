import { useLayoutEffect } from 'react';

// set active pattern on ctrl+enter
const useKeydown = (callback) =>
  useLayoutEffect(() => {
    window.addEventListener('keydown', callback, true);
    return () => window.removeEventListener('keydown', callback, true);
  }, [callback]);

export default useKeydown;
