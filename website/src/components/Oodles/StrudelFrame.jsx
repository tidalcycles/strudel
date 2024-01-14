import { useRef } from 'react';

export function StrudelFrame({ onEvaluate, hash }) {
  const ref = useRef();

  //   setInterval(() => {
  //     console.log(ref?.current?.contentWindow?.location?.href);
  //   }, 1000);

  //   setInterval(() => {
  //     console.log(ref?.current?.contentWindow);
  //   }, 1000);

  window.addEventListener('message', (message) => {
    const childWindow = ref?.current?.contentWindow;

    if (message == null || message.source !== childWindow) {
      return; // Skip message in this event listener
    }

    onEvaluate(message.data);

    // ...
  });

  //   contentWindow?.onmessage = (event) => {
  //     console.log(event);
  //   };
  //   contentWindow?.addEventListener(
  //     'message',
  //     (event) => {
  //       console.log(event);
  //     },
  //     false,
  //   );

  const source = window.location.origin + '/#' + hash;

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
