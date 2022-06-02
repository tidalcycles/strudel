import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function Slides({ children }) {
  const [slide, setSlide] = useState(0);
  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-900">
      <AnimatePresence exitBeforeEnter>
        <motion.div
          key={slide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-screen h-screen"
        >
          <div className="flex justify-center items-center p-6">
            <div className="prose grow max-w-full text-gray-200 font-serif prose-headings:text-gray-200 prose-headings:font-sans prose-2xl prose-slate">
              {children[slide]}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <SlideNav slide={slide} setSlide={setSlide} slides={children} />
    </div>
  );
}

export function Slide({ children }) {
  return children;
}

function SlideNav({ slide, setSlide, slides }) {
  return (
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
    </div>
  );
}
