import AcademicCapIcon from '@heroicons/react/20/solid/AcademicCapIcon';
import CommandLineIcon from '@heroicons/react/20/solid/CommandLineIcon';
import LinkIcon from '@heroicons/react/20/solid/LinkIcon';
import PlayCircleIcon from '@heroicons/react/20/solid/PlayCircleIcon';
import SparklesIcon from '@heroicons/react/20/solid/SparklesIcon';
import StopCircleIcon from '@heroicons/react/20/solid/StopCircleIcon';
import { cx } from '@strudel.cycles/react';
import React, { useContext } from 'react';
// import { ReplContext } from './Repl';
import './Repl.css';

const isEmbedded = window.location !== window.parent.location;

export function Header({ context }) {
  const {
    started,
    pending,
    isDirty,
    lastShared,
    activeCode,
    handleTogglePlay,
    handleUpdate,
    handleShuffle,
    handleShare,
    isZen,
    setIsZen,
  } = context;
  // useContext(ReplContext)

  return (
    <header
      id="header"
      className={cx(
        'py-1 flex-none w-full md:flex text-black justify-between z-[100] text-lg  select-none sticky top-0',
        !isZen && 'bg-header',
      )}
    >
      <div className="px-4 flex space-x-2 pt-2 md:pt-0 select-none">
        {/*             <img
    src={logo}
    className={cx('Tidal-logo', isEmbedded ? 'w-8 h-8' : 'w-10 h-10', started && 'animate-pulse')} // 'bg-[#ffffff80] rounded-full'
    alt="logo"
  /> */}
        <h1
          className={cx(
            isEmbedded ? 'text-l' : 'text-xl',
            // 'bg-clip-text bg-gradient-to-r from-primary to-secondary  text-transparent font-bold',
            'text-white font-bold flex space-x-2 items-center',
          )}
        >
          <div
            className={cx('mt-[1px]', started && 'animate-spin', 'cursor-pointer')}
            onClick={() => setIsZen((z) => !z)}
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
        <div className="flex max-w-full overflow-auto text-white ">
          <button
            onClick={handleTogglePlay}
            className={cx(!isEmbedded ? 'p-2' : 'px-2', 'hover:text-tertiary', !started && 'animate-pulse')}
          >
            {!pending ? (
              <span className={cx('flex items-center space-x-1', isEmbedded ? 'w-16' : 'w-16')}>
                {started ? <StopCircleIcon className="w-5 h-5" /> : <PlayCircleIcon className="w-5 h-5" />}
                <span>{started ? 'stop' : 'play'}</span>
              </span>
            ) : (
              <>loading...</>
            )}
          </button>
          <button
            onClick={handleUpdate}
            className={cx(
              'flex items-center space-x-1',
              !isEmbedded ? 'p-2' : 'px-2',
              !isDirty || !activeCode ? 'opacity-50' : 'hover:text-tertiary',
            )}
          >
            <CommandLineIcon className="w-5 h-5" />
            <span>update</span>
          </button>
          {!isEmbedded && (
            <button className="hover:text-tertiary p-2 flex items-center space-x-1" onClick={handleShuffle}>
              <SparklesIcon className="w-5 h-5" />
              <span> shuffle</span>
            </button>
          )}
          {!isEmbedded && (
            <button
              className={cx(
                'cursor-pointer hover:text-tertiary flex items-center space-x-1',
                !isEmbedded ? 'p-2' : 'px-2',
              )}
              onClick={handleShare}
            >
              <LinkIcon className="w-5 h-5" />
              <span>share{lastShared && lastShared === (activeCode || code) ? 'd!' : ''}</span>
            </button>
          )}
          {!isEmbedded && (
            <a
              href="./learn/getting-started"
              className={cx('hover:text-tertiary flex items-center space-x-1', !isEmbedded ? 'p-2' : 'px-2')}
            >
              <AcademicCapIcon className="w-5 h-5" />
              <span>learn</span>
            </a>
          )}
          {isEmbedded && (
            <button className={cx('hover:text-tertiary px-2')}>
              <a href={window.location.href} target="_blank" rel="noopener noreferrer" title="Open in REPL">
                🚀 open
              </a>
            </button>
          )}
          {isEmbedded && (
            <button className={cx('hover:text-tertiary px-2')}>
              <a
                onClick={() => {
                  window.location.href = initialUrl;
                  window.location.reload();
                }}
                title="Reset"
              >
                💔 reset
              </a>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
