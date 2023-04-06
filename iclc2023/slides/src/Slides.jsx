import { persistentAtom } from '@nanostores/persistent';
import { useStore } from '@nanostores/react'; // or '@nanostores/preact'
import useEvent from './useEvent';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}
// https://vitejs.dev/guide/features.html#glob-import
const slideImports = import.meta.glob('./slides/*.mdx');

const loadedMDXFiles = await Promise.all(
  Object.entries(slideImports).map(async ([path, load]) => {
    const segments = path.split('/');
    const filename = segments[segments.length - 1].slice(0, -4); // expects .mdx at the end
    return [filename, (await load()).default];
  }),
);

const order = [
  'cover',
  'whatIsStrudel',
  'history',
  'hs2js',
  'patterns-events',
  'events-audio', // outputs
  'outputs',
  //
  'replflow',
  'transpilation',
  'mininotation',
  'mini-comparison',
  // scheduling?
  // pattern alignment?
  // flexible typing?
  // future outlook?
];

const slideEntries = order.map((name) => loadedMDXFiles.find(([file]) => file === name));

// current slide index is persisted, so it's safe to refresh the browser
export const slideIndex = persistentAtom('slideIndex', '0');

export const prev = () => slideIndex.set((parseInt(slideIndex.get()) - 1 + slideEntries.length) % slideEntries.length);
export const next = () => slideIndex.set((parseInt(slideIndex.get()) + 1) % slideEntries.length);

function Slides() {
  const activeIndex = parseInt(useStore(slideIndex));

  useEvent('click', (e) => {
    if (!e.ctrlKey) {
      return;
    }
    const leftHalf = e.clientX / document.body.clientWidth < 0.5;
    if (leftHalf) {
      prev();
    } else {
      next();
    }
  });
  /*useEvent('keydown', (e) => {
    if (e.key === 'Home') {
      prev();
    } else if (e.key === 'End') {
      next();
    }
  });*/

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      {slideEntries.map(([path, Slide], i) => (
        <div
          key={i}
          className={cx(
            `bg-slate-900 w-full h-full flex justify-center absolute top-0 transition-all ease-in-out duration-500 overflow-auto`,
            i < activeIndex && '-translate-x-full',
            i > activeIndex && 'translate-x-full',
          )}
        >
          <div className="prose prose-invert w-[1400px] p-12 max-w-full" style={{ fontSize: '2em' }}>
            {Math.abs(i - activeIndex) < 2 && <Slide />}
          </div>
        </div>
      ))}
      <div className="absolute top-0 w-full">
        <div className="h-[5px] bg-slate-500 w-full z-100">
          <div
            style={{ width: ((activeIndex / (slideEntries.length - 1)) * 100).toFixed(0) + '%' }}
            className="h-full bg-yellow-500"
          />
        </div>
      </div>
    </div>
  );
}

export default Slides;
