import { initAudioOnFirstClick } from '@strudel.cycles/webaudio';
import Workshop from './workshop.mdx';

initAudioOnFirstClick();

function App() {
  return (
    <div className="bg-slate-900 w-screen h-screen overflow-auto">
      <main className="p-4 pl-6 max-w-3xl prose prose-invert">
        <Workshop />
      </main>
    </div>
  );
}

export default App;
