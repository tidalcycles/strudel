import DownloadButton from './DownloadButton';

// type Props = {
//   containerRef:  React.MutableRefObject<HTMLElement | null>,
//   editorRef:  React.MutableRefObject<HTMLElement | null>,
//   init: () => void
// }
export function Code(Props) {
  const { editorRef, containerRef, init, context } = Props;

  return (
    <section
      className={'text-gray-100 cursor-text pb-0 overflow-auto grow relative'}
      id="code"
      ref={(el) => {
        containerRef.current = el;
        if (!editorRef.current) {
          init();
        }
      }}
    >
      {context && <DownloadButton context={context} />}
    </section>
  );
}
