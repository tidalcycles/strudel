import Loader from '@src/repl/components/Loader';
import { Panel } from '@src/repl/components/panel/Panel';
import { Code } from '@src/repl/components/Code';
import UserFacingErrorMessage from '@src/repl/components/UserFacingErrorMessage';
import { Header } from './Header';
import { useSettings } from '@src/settings.mjs';

// type Props = {
//  context: replcontext,
// }

export default function ReplEditor(Props) {
  const { context } = Props;
  const { containerRef, editorRef, error, init, pending } = context;
  const settings = useSettings();
  const { panelPosition } = settings;

  return (
    <div className="h-full flex flex-col relative">
      <Loader active={pending} />
      <Header context={context} />
      <div className="grow flex relative overflow-hidden">
        <Code containerRef={containerRef} editorRef={editorRef} init={init} />
        {panelPosition === 'right' && <Panel context={context} />}
      </div>
      <UserFacingErrorMessage error={error} />
      {panelPosition === 'bottom' && <Panel context={context} />}
    </div>
  );
}
