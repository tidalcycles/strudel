import { ReplContext } from '@src/repl/util.mjs';

import Loader from '@src/repl/components/Loader';
import { Panel } from '@src/repl/components/panel/Panel';
import { Code } from '@src/repl/components/Code';
import BigPlayButton from '@src/repl/components/BigPlayButton';
import UserFacingErrorMessage from '@src/repl/components/UserFacingErrorMessage';
import { Header } from './Header';

// type Props = {
//  context: replcontext,
//  containerRef:  React.MutableRefObject<HTMLElement | null>,
//  editorRef:  React.MutableRefObject<HTMLElement | null>,
//  error: Error
//  init: () => void
//  isEmbedded: boolean
// }

export default function ReplEditor(Props) {
  const { context, containerRef, editorRef, error, init, panelPosition } = Props;
  const { pending, started, handleTogglePlay, isEmbedded } = context;
  const showPanel = !isEmbedded;
  return (
    <ReplContext.Provider value={context}>
      <div className="h-full flex flex-col relative">
        <Loader active={pending} />
        <Header context={context} />
        {isEmbedded && <BigPlayButton started={started} handleTogglePlay={handleTogglePlay} />}
        <div className="grow flex relative overflow-hidden">
          <Code containerRef={containerRef} editorRef={editorRef} init={init} />
          {panelPosition === 'right' && showPanel && <Panel context={context} />}
        </div>
        <UserFacingErrorMessage error={error} />
        {panelPosition === 'bottom' && showPanel && <Panel context={context} />}
      </div>
    </ReplContext.Provider>
  );
}
