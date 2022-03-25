import { useEffect } from 'react';

function usePostMessage(listener) {
  useEffect(() => {
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [listener]);
  return (data) => window.postMessage(data, '*');
}

export default usePostMessage;
