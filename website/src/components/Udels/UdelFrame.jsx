import { useRef } from 'react';

export function UdelFrame({ onEvaluate, hash, instance }) {
  const ref = useRef();
  window.addEventListener('message', (message) => {
    const childWindow = ref?.current?.contentWindow;
    if (message == null || message.source !== childWindow) {
      return; // Skip message in this event listener
    }
    onEvaluate(message.data);
  });

  const url = new URL(window.location.origin);
  url.hash = hash;
  url.searchParams.append('instance', instance);
  const source = url.toString();

  return (
    <iframe
      ref={ref}
      style={{
        display: 'flex',
        flexGrow: 1,
        minWidth: '50%',
        boxSizing: 'border-box',
        border: '0px',
      }}
      title="strudel embed"
      src={source}
    ></iframe>
  );
}
