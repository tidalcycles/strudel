import XMarkIcon from '@heroicons/react/20/solid/XMarkIcon';
import { logger } from '@strudel.cycles/core';
import { useEvent, cx } from '@strudel.cycles/react';
// import { cx } from '@strudel.cycles/react';
import { nanoid } from 'nanoid';
import React, { useMemo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Reference } from './Reference';
import { themes } from './themes.mjs';
import { useSettings, settingsMap, setActiveFooter, defaultSettings } from '../settings.mjs';
import { getAudioContext, soundMap } from '@strudel.cycles/webaudio';
import { useStore } from '@nanostores/react';
import { FilesTab } from './FilesTab';

const TAURI = window.__TAURI__;

export function Footer({ context }) {
  const footerContent = useRef();
  const [log, setLog] = useState([]);
  const { activeFooter, isZen, panelPosition: position } = useSettings();

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
          'h-8 px-2 text-foreground cursor-pointer hover:opacity-50 flex items-center space-x-1 border-b',
          activeFooter === name ? 'border-foreground' : 'border-transparent',
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

  const isActive = activeFooter !== '';

  let positions = {
    right: cx('max-w-full flex-grow-0 flex-none overflow-hidden', isActive ? 'w-[600px] h-full' : 'absolute right-0'),
    bottom: 'h-[360px] min-h-[360px] relative',
  };
  return (
    <nav className={cx('bg-lineHighlight z-[1000] flex flex-col', positions[position])}>
      <div className="flex justify-between px-2">
        <div className={cx('flex select-none max-w-full overflow-auto', activeFooter && 'pb-2')}>
          <FooterTab name="intro" label="welcome" />
          <FooterTab name="sounds" />
          <FooterTab name="console" />
          <FooterTab name="reference" />
          <FooterTab name="settings" />
          {TAURI && <FooterTab name="files" />}
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
            {activeFooter === 'intro' && <WelcomeTab />}
            {activeFooter === 'console' && <ConsoleTab log={log} />}
            {activeFooter === 'sounds' && <SoundsTab />}
            {activeFooter === 'reference' && <Reference />}
            {activeFooter === 'settings' && <SettingsTab scheduler={context.scheduler} />}
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

function WelcomeTab() {
  return (
    <div className="prose dark:prose-invert max-w-[600px] pt-2 font-sans pb-8 px-4">
      <h3>
        <span className={cx('animate-spin inline-block select-none')}>🌀</span> welcome
      </h3>
      <p>
        You have found <span className="underline">strudel</span>, a new live coding platform to write dynamic music
        pieces in the browser! It is free and open-source and made for beginners and experts alike. To get started:
        <br />
        <br />
        <span className="underline">1. hit play</span> - <span className="underline">2. change something</span> -{' '}
        <span className="underline">3. hit update</span>
        <br />
        If you don't like what you hear, try <span className="underline">shuffle</span>!
      </p>
      <p>
        To learn more about what this all means, check out the{' '}
        <a href="./workshop/getting-started" target="_blank">
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
        <a href="https://tidalcycles.org/" target="_blank">
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
  );
}

function ConsoleTab({ log }) {
  return (
    <div id="console-tab" className="break-all px-4 dark:text-white text-stone-900 text-sm">
      <pre>{`███████╗████████╗██████╗ ██╗   ██╗██████╗ ███████╗██╗     
██╔════╝╚══██╔══╝██╔══██╗██║   ██║██╔══██╗██╔════╝██║     
███████╗   ██║   ██████╔╝██║   ██║██║  ██║█████╗  ██║     
╚════██║   ██║   ██╔══██╗██║   ██║██║  ██║██╔══╝  ██║     
███████║   ██║   ██║  ██║╚██████╔╝██████╔╝███████╗███████╗
╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝`}</pre>
      {log.map((l, i) => {
        const message = linkify(l.message);
        return (
          <div key={l.id} className={cx(l.type === 'error' && 'text-red-500', l.type === 'highlight' && 'underline')}>
            <span dangerouslySetInnerHTML={{ __html: message }} />
            {l.count ? ` (${l.count})` : ''}
          </div>
        );
      })}
    </div>
  );
}

const getSamples = (samples) =>
  Array.isArray(samples) ? samples.length : typeof samples === 'object' ? Object.values(samples).length : 1;

function SoundsTab() {
  const sounds = useStore(soundMap);
  const { soundsFilter } = useSettings();
  const soundEntries = useMemo(() => {
    let filtered = Object.entries(sounds).filter(([key]) => !key.startsWith('_'));
    if (!sounds) {
      return [];
    }
    if (soundsFilter === 'user') {
      return filtered.filter(([key, { data }]) => !data.prebake);
    }
    if (soundsFilter === 'drums') {
      return filtered.filter(([_, { data }]) => data.type === 'sample' && data.tag === 'drum-machines');
    }
    if (soundsFilter === 'samples') {
      return filtered.filter(([_, { data }]) => data.type === 'sample' && data.tag !== 'drum-machines');
    }
    if (soundsFilter === 'synths') {
      return filtered.filter(([_, { data }]) => ['synth', 'soundfont'].includes(data.type));
    }
    return filtered;
  }, [sounds, soundsFilter]);
  // holds mutable ref to current triggered sound
  const trigRef = useRef();
  // stop current sound on mouseup
  useEvent('mouseup', () => {
    const t = trigRef.current;
    trigRef.current = undefined;
    t?.then((ref) => {
      ref?.stop(getAudioContext().currentTime + 0.01);
    });
  });
  return (
    <div id="sounds-tab" className="flex flex-col w-full h-full dark:text-white text-stone-900">
      <div className="px-2 pb-2 flex-none">
        <ButtonGroup
          value={soundsFilter}
          onChange={(value) => settingsMap.setKey('soundsFilter', value)}
          items={{
            samples: 'samples',
            drums: 'drum-machines',
            synths: 'Synths',
            user: 'User',
          }}
        ></ButtonGroup>
      </div>
      <div className="p-2 min-h-0 max-h-full grow overflow-auto font-mono text-sm break-normal">
        {soundEntries.map(([name, { data, onTrigger }]) => (
          <span
            key={name}
            className="cursor-pointer hover:opacity-50"
            onMouseDown={async () => {
              const ctx = getAudioContext();
              const params = {
                note: ['synth', 'soundfont'].includes(data.type) ? 'a3' : undefined,
                s: name,
                clip: 1,
                release: 0.5,
              };
              const time = ctx.currentTime + 0.05;
              const onended = () => trigRef.current?.node?.disconnect();
              trigRef.current = Promise.resolve(onTrigger(time, params, onended));
              trigRef.current.then((ref) => {
                ref?.node.connect(ctx.destination);
              });
            }}
          >
            {' '}
            {name}
            {data?.type === 'sample' ? `(${getSamples(data.samples)})` : ''}
            {data?.type === 'soundfont' ? `(${data.fonts.length})` : ''}
          </span>
        ))}
        {!soundEntries.length ? 'No custom sounds loaded in this pattern (yet).' : ''}
      </div>
    </div>
  );
}

function Checkbox({ label, value, onChange }) {
  return (
    <label>
      <input type="checkbox" checked={value} onChange={onChange} />
      {' ' + label}
    </label>
  );
}

function ButtonGroup({ value, onChange, items }) {
  return (
    <div className="flex max-w-lg">
      {Object.entries(items).map(([key, label], i, arr) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cx(
            'px-2 border-b h-8',
            // i === 0 && 'rounded-l-md',
            // i === arr.length - 1 && 'rounded-r-md',
            // value === key ? 'bg-background' : 'bg-lineHighlight',
            value === key ? 'border-foreground' : 'border-transparent',
          )}
        >
          {label.toLowerCase()}
        </button>
      ))}
    </div>
  );
}

function SelectInput({ value, options, onChange }) {
  return (
    <select
      className="p-2 bg-background rounded-md text-foreground"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {Object.entries(options).map(([k, label]) => (
        <option key={k} className="bg-background" value={k}>
          {label}
        </option>
      ))}
    </select>
  );
}

function NumberSlider({ value, onChange, step = 1, ...rest }) {
  return (
    <div className="flex space-x-2 gap-1">
      <input
        className="p-2 grow"
        type="range"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        {...rest}
      />
      <input
        type="number"
        value={value}
        step={step}
        className="w-16 bg-background rounded-md"
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function FormItem({ label, children }) {
  return (
    <div className="grid gap-2">
      <label>{label}</label>
      {children}
    </div>
  );
}

const themeOptions = Object.fromEntries(Object.keys(themes).map((k) => [k, k]));
const fontFamilyOptions = {
  monospace: 'monospace',
  BigBlueTerminal: 'BigBlueTerminal',
  x3270: 'x3270',
  PressStart: 'PressStart2P',
  galactico: 'galactico',
  'we-come-in-peace': 'we-come-in-peace',
  FiraCode: 'FiraCode',
  'FiraCode-SemiBold': 'FiraCode SemiBold',
};

function SettingsTab({ scheduler }) {
  const {
    theme,
    keybindings,
    isLineNumbersDisplayed,
    isAutoCompletionEnabled,
    isLineWrappingEnabled,
    fontSize,
    fontFamily,
    panelPosition,
  } = useSettings();

  return (
    <div className="text-foreground p-4 space-y-4">
      {/* <FormItem label="Tempo">
        <div className="space-x-4">
          <button
            onClick={() => {
              scheduler.setCps(scheduler.cps - 0.1);
            }}
          >
            slower
          </button>
          <button
            onClick={() => {
              scheduler.setCps(scheduler.cps + 0.1);
            }}
          >
            faster
          </button>
        </div>
      </FormItem> */}
      <FormItem label="Theme">
        <SelectInput options={themeOptions} value={theme} onChange={(theme) => settingsMap.setKey('theme', theme)} />
      </FormItem>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem label="Font Family">
          <SelectInput
            options={fontFamilyOptions}
            value={fontFamily}
            onChange={(fontFamily) => settingsMap.setKey('fontFamily', fontFamily)}
          />
        </FormItem>
        <FormItem label="Font Size">
          <NumberSlider
            value={fontSize}
            onChange={(fontSize) => settingsMap.setKey('fontSize', fontSize)}
            min={10}
            max={40}
            step={2}
          />
        </FormItem>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FormItem label="Keybindings">
          <ButtonGroup
            value={keybindings}
            onChange={(keybindings) => settingsMap.setKey('keybindings', keybindings)}
            items={{ codemirror: 'Codemirror', vim: 'Vim', emacs: 'Emacs' }}
          ></ButtonGroup>
        </FormItem>
        <Checkbox
          label="Display line numbers"
          onChange={(cbEvent) => settingsMap.setKey('isLineNumbersDisplayed', cbEvent.target.checked)}
          value={isLineNumbersDisplayed}
        />
        <Checkbox
          label="Enable auto-completion"
          onChange={(cbEvent) => settingsMap.setKey('isAutoCompletionEnabled', cbEvent.target.checked)}
          value={isAutoCompletionEnabled}
        />
        <Checkbox
          label="Enable line wrapping"
          onChange={(cbEvent) => settingsMap.setKey('isLineWrappingEnabled', cbEvent.target.checked)}
          value={isLineWrappingEnabled}
        />
        <FormItem label="Footer Position">
          <ButtonGroup
            value={panelPosition}
            onChange={(value) => settingsMap.setKey('panelPosition', value)}
            items={{ bottom: 'Bottom', right: 'Right' }}
          ></ButtonGroup>
        </FormItem>
      </div>
      <FormItem label="Reset Settings">
        <button
          className="bg-background p-2 max-w-[300px] rounded-md hover:opacity-50"
          onClick={() => {
            if (confirm('Sure?')) {
              settingsMap.set(defaultSettings);
            }
          }}
        >
          restore default settings
        </button>
      </FormItem>
    </div>
  );
}
