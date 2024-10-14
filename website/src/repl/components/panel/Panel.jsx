import { logger } from '@strudel/core';
import useEvent from '@src/useEvent.mjs';
import cx from '@src/cx.mjs';
import { nanoid } from 'nanoid';
import { useCallback, useState } from 'react';
import { setPanelPinned, setActiveFooter as setTab, useSettings } from '../../../settings.mjs';
import { ConsoleTab } from './ConsoleTab';
import { FilesTab } from './FilesTab';
import { Reference } from './Reference';
import { SettingsTab } from './SettingsTab';
import { SoundsTab } from './SoundsTab';
import { WelcomeTab } from './WelcomeTab';
import { PatternsTab } from './PatternsTab';
import { ChevronLeftIcon } from '@heroicons/react/16/solid';

const TAURI = typeof window !== 'undefined' && window.__TAURI__;

export function HorizontalPanel({ context }) {
  const settings = useSettings();
  const { isPanelPinned: pinned, activeFooter: tab } = settings;

  return (
    <PanelNav
      className={cx(
        'hover:max-h-[360px] hover:min-h-[360px] justify-between flex flex-col',
        pinned ? `min-h-[360px] max-h-[360px]` : 'min-h-10 max-h-10',
      )}
    >
      <div className="flex h-full overflow-auto">
        <PanelContent context={context} tab={tab} />
      </div>

      <div className="flex justify-between min-h-10 max-h-10 pr-2 items-center">
        <Tabs setTab={setTab} tab={tab} pinned={pinned} />
        <PinButton pinned={pinned} setPinned={setPanelPinned} />
      </div>
    </PanelNav>
  );
}

export function VerticalPanel({ context }) {
  const settings = useSettings();
  const { isPanelPinned: pinned, activeFooter: tab } = settings;

  return (
    <PanelNav
      onMouseEnter={(x) => setIsHovered(true)}
      onMouseLeave={(x) => setIsHovered(false)}
      className={cx(
        'lg:hover:min-w-[600px] lg:hover:max-w-[600px] hover:min-w-[300px] hover:max-w-[300px] ',
        pinned ? `lg:min-w-[600px] min-w-[300px] lg:max-w-[600px] min-max-[300px]` : 'min-w-8',
      )}
    >
      <div className={cx('group-hover:flex flex-col h-full', pinned ? 'flex' : 'hidden')}>
        <div className="flex justify-between w-full ">
          <Tabs setTab={setTab} tab={tab} pinned={pinned} />
          <PinButton pinned={pinned} setPinned={setPanelPinned} />
        </div>

        <div className="overflow-auto h-full">
          <PanelContent context={context} tab={tab} />
        </div>
      </div>
      <div className={cx(pinned ? 'hidden' : 'flex flex-col items-center justify-center  h-full group-hover:hidden ')}>
        <ChevronLeftIcon className="text-foreground opacity-50 w-6 h-6" />
      </div>
    </PanelNav>
  );
}

const tabNames = {
  welcome: 'intro',
  patterns: 'patterns',
  sounds: 'sounds',
  reference: 'reference',
  console: 'console',
  settings: 'settings',
};
if (TAURI) {
  tabNames.files = 'files';
}

function PanelNav({ children, className, ...props }) {
  return (
    <nav
      aria-label="Settings Menu"
      className={cx('bg-lineHighlight group transition-all overflow-x-auto', className)}
      {...props}
    >
      {children}
    </nav>
  );
}

function PanelContent({ context, tab }) {
  const [log, setLog] = useState([]);
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

  switch (tab) {
    case tabNames.patterns:
      return <PatternsTab context={context} />;
    case tabNames.console:
      return <ConsoleTab log={log} />;
    case tabNames.sounds:
      return <SoundsTab />;
    case tabNames.reference:
      return <Reference />;
    case tabNames.settings:
      return <SettingsTab started={context.started} />;
    case tabNames.files:
      return <FilesTab />;
    default:
      return <WelcomeTab context={context} />;
  }
}

function PanelTab({ label, isSelected, onClick }) {
  return (
    <>
      <div
        onClick={onClick}
        className={cx(
          'h-8 px-2 text-foreground cursor-pointer hover:opacity-50 flex items-center space-x-1 border-b',
          isSelected ? 'border-foreground' : 'border-transparent',
        )}
      >
        {label}
      </div>
    </>
  );
}
function Tabs({ setTab, tab }) {
  return (
    <div className={cx('flex select-none max-w-full overflow-auto pb-2')}>
      {Object.keys(tabNames).map((key) => {
        const val = tabNames[key];
        return <PanelTab key={key} isSelected={tab === val} label={key} onClick={() => setTab(val)} />;
      })}
    </div>
  );
}

function PinButton({ pinned, setPinned }) {
  return (
    <button
      onClick={() => setPinned(!pinned)}
      className={cx(
        'text-foreground max-h-8 min-h-8 max-w-8 min-w-8 items-center justify-center p-1.5 group-hover:flex',
        pinned ? 'flex' : 'hidden',
      )}
      aria-label="Pin Settings Menu"
    >
      <svg
        stroke="currentColor"
        fill={'currentColor'}
        strokeWidth="0"
        className="w-full h-full"
        opacity={pinned ? 1 : '.3'}
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a6 6 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707s.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a6 6 0 0 1 1.013.16l3.134-3.133a3 3 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146"></path>
      </svg>
    </button>
  );
}

function useLogger(onTrigger) {
  useEvent(logger.key, onTrigger);
}
