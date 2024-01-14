import { useRef } from 'react';

export function StrudelFrame({}) {
  const ref = useRef();

  //   setInterval(() => {
  //     console.log(ref?.current?.contentWindow?.location?.href);
  //   }, 1000);

  const source = window.location.origin;
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
