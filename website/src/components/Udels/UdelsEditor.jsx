import { ReplContext } from '@src/repl/util.mjs';

import Loader from '@src/repl/components/Loader';
import { Panel } from '@src/repl/components/panel/Panel';
import { Code } from '@src/repl/components/Code';
import BigPlayButton from '@src/repl/components/BigPlayButton';
import UserFacingErrorMessage from '@src/repl/components/UserFacingErrorMessage';

// type Props = {
//  context: replcontext,
//  containerRef:  React.MutableRefObject<HTMLElement | null>,
//  editorRef:  React.MutableRefObject<HTMLElement | null>,
//  error: Error
//  init: () => void
// }

export default function UdelsEditor(Props) {
  const { context, containerRef, editorRef, error, init } = Props;
  const { pending, started, handleTogglePlay } = context;
  return (
    <ReplContext.Provider value={context}>
      <div className={'h-full flex w-full flex-col relative'}>
        <Loader active={pending} />
        {/* <Header context={context} /> */}
        <BigPlayButton started={started} handleTogglePlay={handleTogglePlay} />
        <div className="grow flex relative overflow-hidden">
          <Code containerRef={containerRef} editorRef={editorRef} init={init} />
        </div>
        <UserFacingErrorMessage error={error} />
        <Panel context={context} />
      </div>
    </ReplContext.Provider>
  );
}
