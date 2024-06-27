import XMarkIcon from '@heroicons/react/20/solid/XMarkIcon';
import { logger } from '@strudel/core';
import useEvent from '@src/useEvent.mjs';
import cx from '@src/cx.mjs';
import { nanoid } from 'nanoid';
import { useCallback, useLayoutEffect, useEffect, useRef, useState } from 'react';
import { setActiveFooter, useSettings } from '../../../settings.mjs';
import { ConsoleTab } from './ConsoleTab';
import { FilesTab } from './FilesTab';
import { Reference } from './Reference';
import { SettingsTab } from './SettingsTab';
import { SoundsTab } from './SoundsTab';
import { WelcomeTab } from './WelcomeTab';
import { PatternsTab } from './PatternsTab';
import useClient from '@src/useClient.mjs';

// https://gist.github.com/gaearon/e7d97cdf38a2907924ea12e4ebdf3c85
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const TAURI = typeof window !== 'undefined' && window.__TAURI__;

export function Panel({ context }) {
  const footerContent = useRef();
  const [log, setLog] = useState([]);
  const { activeFooter, isZen, panelPosition } = useSettings();

  useIsomorphicLayoutEffect(() => {
    if (footerContent.current && activeFooter === 'console') {
      // scroll log box to bottom when log changes
      footerContent.current.scrollTop = footerContent.current?.scrollHeight;
    }
  }, [log, activeFooter]);
  useIsomorphicLayoutEffect(() => {
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

  const PanelTab = ({ children, name, label }) => (
    <>
      <div
        onClick={() => setActiveFooter(name)}
        className={cx(
          'h-8 px-2 text-foreground cursor-pointer hover:opacity-50 flex items-center space-x-1 border-b',
          activeFooter === name ? 'border-foreground' : 'border-transparent',
        )}
      >
        {label || name}
      </div>
      {activeFooter === name && <>{children}</>}
    </>
  );
  const client = useClient();
  if (isZen) {
    return null;
  }

  const isActive = activeFooter !== '';

  let positions = {
    right: cx('max-w-full flex-grow-0 flex-none overflow-hidden', isActive ? 'w-[600px] h-full' : 'absolute right-0'),
    bottom: cx('relative', isActive ? 'h-[360px] min-h-[360px]' : ''),
  };
  if (!client) {
    return null;
  }
  return (
    <nav className={cx('bg-lineHighlight z-[10] flex flex-col', positions[panelPosition])}>
      <div className="flex justify-between px-2">
        <div className={cx('flex select-none max-w-full overflow-auto', activeFooter && 'pb-2')}>
          <PanelTab name="intro" label="welcome" />
          <PanelTab name="patterns" />
          <PanelTab name="sounds" />
          <PanelTab name="console" />
          <PanelTab name="reference" />
          <PanelTab name="settings" />
          {TAURI && <PanelTab name="files" />}
        </div>
        {activeFooter !== '' && (
          <button onClick={() => setActiveFooter('')} className="text-foreground px-2" aria-label="Close Panel">
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      {activeFooter !== '' && (
        <div className="relative overflow-hidden">
          <div className="text-white overflow-auto h-full max-w-full" ref={footerContent}>
            {activeFooter === 'intro' && <WelcomeTab context={context} />}
            {activeFooter === 'patterns' && <PatternsTab context={context} />}
            {activeFooter === 'console' && <ConsoleTab log={log} />}
            {activeFooter === 'sounds' && <SoundsTab />}
            {activeFooter === 'reference' && <Reference />}
            {activeFooter === 'settings' && <SettingsTab started={context.started} />}
            {activeFooter === 'files' && <FilesTab />}
          </div>
        </div>
      )}
    </nav>
  );
}

function useLogger(onTrigger) {
  useEvent(logger.key, onTrigger);
}
