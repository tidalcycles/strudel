import AcademicCapIcon from '@heroicons/react/20/solid/AcademicCapIcon';
import ArrowPathIcon from '@heroicons/react/20/solid/ArrowPathIcon';
import LinkIcon from '@heroicons/react/20/solid/LinkIcon';
import PlayCircleIcon from '@heroicons/react/20/solid/PlayCircleIcon';
import SparklesIcon from '@heroicons/react/20/solid/SparklesIcon';
import StopCircleIcon from '@heroicons/react/20/solid/StopCircleIcon';
import cx from '@src/cx.mjs';
import { useSettings, setIsZen } from '../../settings.mjs';
import '../Repl.css';

const { BASE_URL } = import.meta.env;
const baseNoTrailing = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

export function Header({ context, embedded = false }) {
  const { started, pending, isDirty, activeCode, handleTogglePlay, handleEvaluate, handleShuffle, handleShare } =
    context;
  const isEmbedded = typeof window !== 'undefined' && (embedded || window.location !== window.parent.location);
  const { isZen } = useSettings();

  return (
    <header
      id="header"
      className={cx(
        'flex-none text-black  z-[100] text-lg select-none',
        !isZen && !isEmbedded && 'bg-lineHighlight',
        isZen ? 'h-12 w-8 fixed top-0 left-0' : 'sticky top-0 w-full py-1 justify-between',
        isEmbedded ? 'flex' : 'md:flex',
      )}
    >
      <div className="px-4 flex space-x-2 md:pt-0 select-none">
        {/*             <img
    src={logo}
    className={cx('Tidal-logo', isEmbedded ? 'w-8 h-8' : 'w-10 h-10', started && 'animate-pulse')} // 'bg-[#ffffff80] rounded-full'
    alt="logo"
  /> */}
        <h1
          onClick={() => {
            if (isEmbedded) window.open(window.location.href.replace('embed', ''));
          }}
          className={cx(
            isEmbedded ? 'text-l cursor-pointer' : 'text-xl',
            'text-foreground font-bold flex space-x-2 items-center',
          )}
        >
          <div
            className={cx('mt-[1px]', started && 'animate-spin', 'cursor-pointer', isZen && 'fixed top-2 right-4')}
            onClick={() => {
              if (!isEmbedded) {
                setIsZen(!isZen);
              }
            }}
          >
            🌀
          </div>
          {!isZen && (
            <div className={cx(started && 'animate-pulse')}>
              <span className="">strudel</span> <span className="text-sm">REPL</span>
            </div>
          )}
        </h1>
      </div>
      {!isZen && (
        <div className="flex max-w-full overflow-auto text-foreground">
          <button
            onClick={handleTogglePlay}
            title={started ? 'stop' : 'play'}
            className={cx(!isEmbedded ? 'p-2' : 'px-2', 'hover:opacity-50', !started && 'animate-pulse')}
          >
            {!pending ? (
              <span className={cx('flex items-center space-x-1', isEmbedded ? '' : 'w-16')}>
                {started ? <StopCircleIcon className="w-6 h-6" /> : <PlayCircleIcon className="w-6 h-6" />}
                {!isEmbedded && <span>{started ? 'stop' : 'play'}</span>}
              </span>
            ) : (
              <>loading...</>
            )}
          </button>
          <button
            onClick={handleEvaluate}
            title="update"
            className={cx(
              'flex items-center space-x-1',
              !isEmbedded ? 'p-2' : 'px-2',
              !isDirty || !activeCode ? 'opacity-50' : 'hover:opacity-50',
            )}
          >
            {/*             <CommandLineIcon className="w-6 h-6" /> */}
            <ArrowPathIcon className="w-6 h-6" />
            {!isEmbedded && <span>update</span>}
          </button>
          {!isEmbedded && (
            <button
              title="shuffle"
              className="hover:opacity-50 p-2 flex items-center space-x-1"
              onClick={handleShuffle}
            >
              <SparklesIcon className="w-6 h-6" />
              <span> shuffle</span>
            </button>
          )}
          {!isEmbedded && (
            <button
              title="share"
              className={cx(
                'cursor-pointer hover:opacity-50 flex items-center space-x-1',
                !isEmbedded ? 'p-2' : 'px-2',
              )}
              onClick={handleShare}
            >
              <LinkIcon className="w-6 h-6" />
              <span>share</span>
            </button>
          )}
          {!isEmbedded && (
            <a
              title="learn"
              href={`${baseNoTrailing}/workshop/getting-started/`}
              className={cx('hover:opacity-50 flex items-center space-x-1', !isEmbedded ? 'p-2' : 'px-2')}
            >
              <AcademicCapIcon className="w-6 h-6" />
              <span>learn</span>
            </a>
          )}
          {/* {isEmbedded && (
            <button className={cx('hover:opacity-50 px-2')}>
              <a href={window.location.href} target="_blank" rel="noopener noreferrer" title="Open in REPL">
                🚀
              </a>
            </button>
          )}
          {isEmbedded && (
            <button className={cx('hover:opacity-50 px-2')}>
              <a
                onClick={() => {
                  window.location.href = initialUrl;
                  window.location.reload();
                }}
                title="Reset"
              >
                💔
              </a>
            </button>
          )} */}
        </div>
      )}
    </header>
  );
}
