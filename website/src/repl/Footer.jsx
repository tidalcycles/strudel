import XMarkIcon from '@heroicons/react/20/solid/XMarkIcon';
import { logger } from '@strudel.cycles/core';
import { cx } from '@strudel.cycles/react';
import { nanoid } from 'nanoid';
import React, { useContext, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useEvent, loadedSamples, ReplContext } from './Repl';
import { Reference } from './Reference';
import { themes, themeColors } from './themes.mjs';

export function Footer({ context }) {
  // const [activeFooter, setActiveFooter] = useState('console');
  // const { activeFooter, setActiveFooter, isZen } = useContext?.(ReplContext);
  const { activeFooter, setActiveFooter, isZen, theme, setTheme } = context;
  const footerContent = useRef();
  const [log, setLog] = useState([]);

  useLayoutEffect(() => {
    if (footerContent.current && activeFooter === 'console') {
      // scroll log box to bottom when log changes
      footerContent.current.scrollTop = footerContent.current?.scrollHeight;
    }
  }, [log, activeFooter]);
  useLayoutEffect(() => {
    if (!footerContent.current) {
    } else if (activeFooter === 'console') {
      footerContent.current.scrollTop = footerContent.current?.scrollHeight;
    } else {
      footerContent.current.scrollTop = 0;
    }
  }, [activeFooter]);

  useLogger(
    useCallback((e) => {
      const { message, type, data } = e.detail;
      setLog((l) => {
        const lastLog = l.length ? l[l.length - 1] : undefined;
        const id = nanoid(12);
        // if (type === 'loaded-sample' && lastLog.type === 'load-sample' && lastLog.url === data.url) {
        if (type === 'loaded-sample') {
          // const loadIndex = l.length - 1;
          const loadIndex = l.findIndex(({ data: { url }, type }) => type === 'load-sample' && url === data.url);
          l[loadIndex] = { message, type, id, data };
        } else if (lastLog && lastLog.message === message) {
          l = l.slice(0, -1).concat([{ message, type, count: (lastLog.count ?? 1) + 1, id, data }]);
        } else {
          l = l.concat([{ message, type, id, data }]);
        }
        return l.slice(-20);
      });
    }, []),
  );

  const FooterTab = ({ children, name, label }) => (
    <>
      <div
        onClick={() => setActiveFooter(name)}
        className={cx(
          'h-8 px-2 text-white cursor-pointer hover:text-tertiary flex items-center space-x-1 border-b',
          activeFooter === name ? 'border-white hover:border-tertiary' : 'border-transparent',
        )}
      >
        {label || name}
      </div>
      {activeFooter === name && <>{children}</>}
    </>
  );
  if (isZen) {
    return null;
  }
  return (
    <footer className="bg-lineHighlight z-[20]">
      <div className="flex justify-between px-2">
        <div className={cx('flex select-none max-w-full overflow-auto', activeFooter && 'pb-2')}>
          <FooterTab name="intro" label="welcome" />
          <FooterTab name="samples" />
          <FooterTab name="console" />
          <FooterTab name="reference" />
          <FooterTab name="settings" />
        </div>
        {activeFooter !== '' && (
          <button onClick={() => setActiveFooter('')} className="text-white" aria-label="Close Panel">
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      {activeFooter !== '' && (
        <div
          className="text-white font-mono text-sm h-[360px] flex-none overflow-auto max-w-full relative"
          ref={footerContent}
        >
          {activeFooter === 'intro' && (
            <div className="prose prose-invert max-w-[600px] pt-2 font-sans pb-8 px-4">
              <h3>
                <span className={cx('animate-spin inline-block select-none')}>🌀</span> welcome
              </h3>
              <p>
                You have found <span className="underline">strudel</span>, a new live coding platform to write dynamic
                music pieces in the browser! It is free and open-source and made for beginners and experts alike. To get
                started:
                <br />
                <br />
                <span className="underline">1. hit play</span> - <span className="underline">2. change something</span>{' '}
                - <span className="underline">3. hit update</span>
                <br />
                If you don't like what you hear, try <span className="underline">shuffle</span>!
              </p>
              <p>
                To learn more about what this all means, check out the{' '}
                <a href="./learn/getting-started" target="_blank">
                  interactive tutorial
                </a>
                . Also feel free to join the{' '}
                <a href="https://discord.com/invite/HGEdXmRkzT" target="_blank">
                  tidalcycles discord channel
                </a>{' '}
                to ask any questions, give feedback or just say hello.
              </p>
              <h3>about</h3>
              <p>
                strudel is a JavaScript version of{' '}
                <a href="tidalcycles.org/" target="_blank">
                  tidalcycles
                </a>
                , which is a popular live coding language for music, written in Haskell. You can find the source code at{' '}
                <a href="https://github.com/tidalcycles/strudel" target="_blank">
                  github
                </a>
                . Please consider to{' '}
                <a href="https://opencollective.com/tidalcycles" target="_blank">
                  support this project
                </a>{' '}
                to ensure ongoing development 💖
              </p>
            </div>
          )}
          {activeFooter === 'console' && (
            <div className="break-all px-4">
              {log.map((l, i) => {
                const message = linkify(l.message);
                return (
                  <div
                    key={l.id}
                    className={cx(l.type === 'error' && 'text-red-500', l.type === 'highlight' && 'text-highlight')}
                  >
                    <span dangerouslySetInnerHTML={{ __html: message }} />
                    {l.count ? ` (${l.count})` : ''}
                  </div>
                );
              })}
            </div>
          )}
          {activeFooter === 'samples' && (
            <div className="break-normal w-full px-4">
              <span className="text-white">{loadedSamples.length} banks loaded:</span>
              {loadedSamples.map(([name, samples]) => (
                <span key={name} className="cursor-pointer hover:text-tertiary" onClick={() => {}}>
                  {' '}
                  {name}(
                  {Array.isArray(samples)
                    ? samples.length
                    : typeof samples === 'object'
                    ? Object.values(samples).length
                    : 1}
                  ){' '}
                </span>
              ))}
            </div>
          )}
          {activeFooter === 'reference' && <Reference />}
          {activeFooter === 'settings' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 p-2">
              {Object.entries(themes).map(([k, t]) => (
                <div
                  key={k}
                  className={classNames(
                    'border-4 border-transparent cursor-pointer p-4 bg-bg rounded-md hover:bg-stone-700',
                    theme === t ? '!border-stone-500' : '',
                  )}
                  onClick={() => {
                    console.log(k, themeColors(t));
                    setTheme(t);
                    document.dispatchEvent(
                      new CustomEvent('strudel-theme', {
                        detail: {
                          // TODO: dynamic
                          background: '#21202e',
                          foreground: '#edecee',
                          caret: '#a277ff',
                          selection: '#3d375e7f',
                          selectionMatch: '#3d375e7f',
                          gutterBackground: '#21202e',
                          gutterForeground: '#edecee',
                          gutterBorder: 'transparent',
                          lineHighlight: '#a394f033',
                        },
                      }),
                    );
                  }}
                >
                  <div className="mb-2 w-full text-center">{k}</div>
                  <div className="flex justify-stretch overflow-hidden rounded-md">
                    {themeColors(t).map((c, i) => (
                      <div key={i} className="grow h-6" style={{ background: c }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </footer>
  );
}

function useLogger(onTrigger) {
  useEvent(logger.key, onTrigger);
}

function linkify(inputText) {
  var replacedText, replacePattern1, replacePattern2, replacePattern3;

  //URLs starting with http://, https://, or ftp://
  replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
  replacedText = inputText.replace(replacePattern1, '<a class="underline" href="$1" target="_blank">$1</a>');

  //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
  replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
  replacedText = replacedText.replace(
    replacePattern2,
    '$1<a class="underline" href="http://$2" target="_blank">$2</a>',
  );

  //Change email addresses to mailto:: links.
  replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
  replacedText = replacedText.replace(replacePattern3, '<a class="underline" href="mailto:$1">$1</a>');

  return replacedText;
}

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}
