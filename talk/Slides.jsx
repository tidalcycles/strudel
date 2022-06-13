import { useState, useLayoutEffect, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const getUrlIndex = () => parseInt(window.location.hash.split('#')[1] || 0, 10);

export function Slides({ children }) {
  const visible = useMemo(() => children.filter((child) => !child.props.hidden), [children]);
  const [slide, setSlide] = useState(getUrlIndex() % visible.length);
  useEffect(() => {
    window.location.hash = '#' + slide;
  }, [slide]);

  const next = useCallback(() => setSlide((s) => (s + 1) % visible.length), [visible]);
  const prev = useCallback(() => setSlide((s) => (s + visible.length - 1) % visible.length), [visible]);

  useLayoutEffect(() => {
    const handleKeyPress = async (e) => {
      if (e.ctrlKey && e.altKey) {
        if (e.code === 'ArrowRight') {
          next();
        } else if (e.code === 'ArrowLeft') {
          prev();
        }
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyPress, true);
    return () => window.removeEventListener('keydown', handleKeyPress, true);
  }, [slide]);
  return (
    <div className="bg-slate-900">
      <AnimatePresence exitBeforeEnter>
        <motion.div
          key={slide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-screen h-screen"
        >
          <div className="flex justify-center px-6 min-h-full overflow-auto">
            <div
              className={`px-8 prose grow max-w-[1280px] 
            text-gray-200 font-serif 
            prose-headings:text-gray-200 
            prose-a:text-indigo-300 
            prose-blockquote:text-gray-200 
            prose-em:text-[1.3em] 
            prose-strong:text-gray-200
            prose-li:text-[1.4em] 
            prose-headings:font-sans 
            prose-code:text-gray-300
            prose-headings:mt-12 
            prose-2xl 
            prose-slate`}
            >
              <center>{visible[slide]}</center>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <SlideNav onNext={next} onPrev={prev} slides={visible} />
    </div>
  );
}

export function Slide({ children }) {
  return children;
}

function SlideNav({ onNext, onPrev }) {
  return (
    <div className="flex absolute top-1/2 space-x-2 w-full justify-between items-center z-1">
      <button onClick={() => onPrev()} className="absolute left-0 my-auto">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-gray-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button onClick={() => onNext()} className="absolute right-0 my-auto">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-gray-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
/* 

<div className="flex absolute bottom-8 space-x-2 w-full justify-center items-center z-1">
<button onClick={() => setSlide((s) => (s + slides.length - 1) % slides.length)}>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-gray-200"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
</button>
{slides.map((_, i) => (
  <div key={i} className={`rounded-full ${slide === i ? 'bg-gray-200 w-3 h-3' : 'bg-gray-500 w-2 h-2'}`}></div>
))}
<button onClick={() => setSlide((s) => (s + 1) % slides.length)}>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-gray-200"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
</button>
</div> */
