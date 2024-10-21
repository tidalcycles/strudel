import Loader from '@src/repl/components/Loader';
import { Code } from '@src/repl/components/Code';
import BigPlayButton from '@src/repl/components/BigPlayButton';
import UserFacingErrorMessage from '@src/repl/components/UserFacingErrorMessage';
import { Header } from './Header';

// type Props = {
//  context: replcontext,
// }

export default function EmbeddedReplEditor(Props) {
  const { context } = Props;
  const { pending, started, handleTogglePlay, containerRef, editorRef, error, init } = context;
  return (
    <div className="h-full flex flex-col relative">
      <Loader active={pending} />
      <Header context={context} embedded={true} />
      <BigPlayButton started={started} handleTogglePlay={handleTogglePlay} />
      <div className="grow flex relative overflow-hidden">
        <Code containerRef={containerRef} editorRef={editorRef} init={init} />
      </div>
      <UserFacingErrorMessage error={error} />
    </div>
  );
}
